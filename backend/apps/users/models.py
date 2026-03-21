from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
import uuid
from django.utils import timezone
from datetime import timedelta
from cloudinary.models import CloudinaryField


class User(AbstractUser):

    ROLE_CHOICES = (
        ("USER", "User"),
        ("ADMIN", "Admin"),
        ("SUPERADMIN", "Super Admin"),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="USER")

    def __str__(self):
        return self.username

    @property
    def is_subscribed(self):
        """Check if user has an active subscription"""
        return hasattr(self, 'user_subscription') and self.user_subscription.is_active

    @property
    def subscription_plan(self):
        """Get the user's current subscription plan"""
        if hasattr(self, 'user_subscription') and self.user_subscription.is_active:
            return self.user_subscription.plan
        return None


class Profile(models.Model):
    MATURITY_CHOICES = (
        ('KIDS', 'Kids'),
        ('ADULT', 'Adult'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profiles"
    )
    name = models.CharField(max_length=50)
    profile_image = CloudinaryField('image', folder='profiles/')
    maturity_level = models.CharField(max_length=10, choices=MATURITY_CHOICES, default='ADULT')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'name'], name='unique_profile_name_per_user')
        ]

    def __str__(self):
        return f"{self.user.username} - {self.name}"



class PasswordResetToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reset_tokens"
    )
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        """Token is valid for 1 hour"""
        expiry_time = self.created_at + timedelta(hours=1)
        return not self.is_used and timezone.now() < expiry_time

    def __str__(self):
        return f"Reset token for {self.user.username}"


class SubscriptionPlan(models.Model):
    """Defines available subscription plans"""

    PLAN_TYPES = (
        ('BASIC', 'Basic'),
        ('STANDARD', 'Standard'),
        ('PREMIUM', 'Premium'),
    )

    name = models.CharField(max_length=50, choices=PLAN_TYPES, unique=True)
    display_name = models.CharField(max_length=100)
    description = models.TextField()

    # Pricing
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2)
    yearly_price = models.DecimalField(max_digits=10, decimal_places=2)

    # Features
    max_profiles = models.IntegerField(default=2)
    max_simultaneous_streams = models.IntegerField(default=1)
    video_quality = models.CharField(max_length=20, default='SD')  # SD, HD, 4K
    has_ads = models.BooleanField(default=True)
    can_download = models.BooleanField(default=False)
    priority_support = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['monthly_price']

    def __str__(self):
        return self.display_name


class Subscription(models.Model):
    """User's subscription instance"""

    BILLING_CYCLES = (
        ('MONTHLY', 'Monthly'),
        ('YEARLY', 'Yearly'),
    )

    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('CANCELLED', 'Cancelled'),
        ('EXPIRED', 'Expired'),
        ('TRIAL', 'Trial'),
    )

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_subscription'
    )
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLES, default='MONTHLY')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')

    # Dates
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField()
    trial_end_date = models.DateTimeField(null=True, blank=True)

    # Payment
    auto_renew = models.BooleanField(default=True)
    last_payment_date = models.DateTimeField(null=True, blank=True)
    next_billing_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.plan.display_name} ({self.status})"

    @property
    def is_active(self):
        """Check if subscription is currently active"""
        return self.status in ['ACTIVE', 'TRIAL'] and self.end_date > timezone.now()

    @property
    def is_trial(self):
        """Check if subscription is in trial period"""
        return (
            self.status == 'TRIAL' and
            self.trial_end_date and
            timezone.now() < self.trial_end_date
        )

    @property
    def days_remaining(self):
        """Calculate days remaining in subscription"""
        if self.is_active:
            delta = self.end_date - timezone.now()
            return delta.days
        return 0

    def cancel(self):
        """Cancel the subscription"""
        self.status = 'CANCELLED'
        self.auto_renew = False
        self.save()

    def renew(self):
        """Renew the subscription for another billing cycle"""
        if self.billing_cycle == 'MONTHLY':
            self.end_date = self.end_date + timedelta(days=30)
            self.next_billing_date = self.end_date
        else:  # YEARLY
            self.end_date = self.end_date + timedelta(days=365)
            self.next_billing_date = self.end_date

        self.status = 'ACTIVE'
        self.last_payment_date = timezone.now()
        self.save()


class PaymentHistory(models.Model):
    """Track payment transactions"""

    PAYMENT_STATUS = (
        ('INITIATED', 'Initiated'),
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )

    PAYMENT_METHODS = (
        ('CARD', 'Credit/Debit Card'),
        ('UPI', 'UPI'),
        ('NETBANKING', 'Net Banking'),
        ('WALLET', 'Wallet'),
    )

    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name='payments',
        null=True,
        blank=True
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments'
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')

    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PENDING')

    transaction_id = models.CharField(max_length=200, unique=True, null=True, blank=True)
    payment_gateway_response = models.JSONField(null=True, blank=True)

    # Razorpay specific fields
    razorpay_order_id = models.CharField(max_length=200, null=True, blank=True)
    razorpay_payment_id = models.CharField(max_length=200, null=True, blank=True)
    razorpay_signature = models.CharField(max_length=500, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Payment Histories'

    def __str__(self):
        return f"{self.user.username} - ₹{self.amount} - {self.payment_status}"
