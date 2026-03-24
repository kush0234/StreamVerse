from rest_framework import serializers
from .models import User, Profile, PasswordResetToken, SubscriptionPlan, Subscription, PaymentHistory
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.mail import send_mail
from django.conf import settings


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )

    class Meta:
        model = User
        fields = ("username", "email", "password")

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"],
            role="USER",  # force default role so user can not be admin
        )
        return user


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True, write_only=True, validators=[validate_password]
    )

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with this email address")
        return value

    def save(self):
        email = self.validated_data['email']
        user = User.objects.get(email=email)

        # Create reset token
        reset_token = PasswordResetToken.objects.create(user=user)

        # Send email
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token.token}"
        subject = "StreamVerse - Password Reset Request"
        message = f"""
Hello {user.username},

You requested to reset your password for StreamVerse.

Click the link below to reset your password:
{reset_url}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.

Best regards,
StreamVerse Team
        """

        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        return reset_token


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.UUIDField(required=True)
    new_password = serializers.CharField(
        required=True, write_only=True, validators=[validate_password]
    )

    def validate_token(self, value):
        try:
            reset_token = PasswordResetToken.objects.get(token=value)
            if not reset_token.is_valid():
                raise serializers.ValidationError("This reset token has expired or been used")
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Invalid reset token")
        return value

    def save(self):
        token = self.validated_data['token']
        new_password = self.validated_data['new_password']

        reset_token = PasswordResetToken.objects.get(token=token)
        user = reset_token.user

        # Update password
        user.set_password(new_password)
        user.save()

        # Mark token as used
        reset_token.is_used = True
        reset_token.save()

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom fields to token
        token["role"] = user.role
        token["username"] = user.username

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        data["role"] = self.user.role
        data["username"] = self.user.username

        return data


class ProfileSerializer(serializers.ModelSerializer):
    profile_image_url = serializers.SerializerMethodField()
    profile_image = serializers.ImageField(required=False, allow_null=True, allow_empty_file=True)

    class Meta:
        model = Profile
        fields = ["id", "name", "profile_image", "profile_image_url", "maturity_level", "created_at"]
        read_only_fields = ["id", "created_at", "profile_image_url"]

    def get_profile_image_url(self, obj):
        if obj.profile_image:
            try:
                return obj.profile_image.url
            except:
                return None
        return None

    def validate_name(self, value):
        """Ensure profile name is unique for the user"""
        user = self.context['request'].user

        # Check if updating existing profile
        if self.instance:
            existing_profiles = Profile.objects.filter(
                user=user, name__iexact=value
            ).exclude(id=self.instance.id)
        else:
            existing_profiles = Profile.objects.filter(
                user=user, name__iexact=value
            )

        if existing_profiles.exists():
            raise serializers.ValidationError("You already have a profile with this name.")

        return value


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    savings = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'display_name', 'description',
            'monthly_price', 'yearly_price', 'savings',
            'max_profiles', 'max_simultaneous_streams', 'video_quality',
            'has_ads', 'can_download', 'priority_support', 'is_active'
        ]

    def get_savings(self, obj):
        """Calculate yearly savings"""
        monthly_cost = float(obj.monthly_price) * 12
        yearly_cost = float(obj.yearly_price)
        return monthly_cost - yearly_cost


class SubscriptionSerializer(serializers.ModelSerializer):
    plan_details = SubscriptionPlanSerializer(source='plan', read_only=True)
    is_active_status = serializers.BooleanField(source='is_active', read_only=True)
    is_trial_status = serializers.BooleanField(source='is_trial', read_only=True)
    days_left = serializers.IntegerField(source='days_remaining', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'plan_details', 'billing_cycle', 'status',
            'start_date', 'end_date', 'trial_end_date',
            'auto_renew', 'last_payment_date', 'next_billing_date',
            'is_active_status', 'is_trial_status', 'days_left',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CreateSubscriptionSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField(required=True)
    billing_cycle = serializers.ChoiceField(choices=['MONTHLY', 'YEARLY'], required=True)
    payment_method = serializers.ChoiceField(
        choices=['CARD', 'UPI', 'NETBANKING', 'WALLET'],
        required=True
    )

    def validate_plan_id(self, value):
        try:
            plan = SubscriptionPlan.objects.get(id=value, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive subscription plan")
        return value


class PaymentHistorySerializer(serializers.ModelSerializer):
    subscription_plan = serializers.CharField(source='subscription.plan.display_name', read_only=True)

    class Meta:
        model = PaymentHistory
        fields = [
            'id', 'subscription', 'subscription_plan', 'amount', 'currency',
            'payment_method', 'payment_status', 'transaction_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserInfoSerializer(serializers.ModelSerializer):
    profile_count = serializers.SerializerMethodField()
    max_profiles = serializers.SerializerMethodField()
    member_since = serializers.SerializerMethodField()
    subscription_info = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "date_joined", "member_since", "profile_count", "max_profiles", "subscription_info"]
        read_only_fields = ["id", "username", "email", "date_joined"]

    def get_profile_count(self, obj):
        return obj.profiles.count()

    def get_max_profiles(self, obj):
        if obj.is_subscribed and obj.subscription_plan:
            return obj.subscription_plan.max_profiles
        return 2  # Default for unsubscribed users

    def get_member_since(self, obj):
        return obj.date_joined.strftime("%B %Y")

    def get_subscription_info(self, obj):
        if hasattr(obj, 'user_subscription') and obj.user_subscription:
            return SubscriptionSerializer(obj.user_subscription).data
        return None


class InitiatePaymentSerializer(serializers.Serializer):
    """Serializer for initiating payment"""
    plan_id = serializers.IntegerField(required=True)
    billing_cycle = serializers.ChoiceField(choices=['MONTHLY', 'YEARLY'], required=True)

    def validate_plan_id(self, value):
        try:
            plan = SubscriptionPlan.objects.get(id=value, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            raise serializers.ValidationError("Invalid or inactive subscription plan")
        return value


class VerifyPaymentSerializer(serializers.Serializer):
    """Serializer for verifying payment"""
    razorpay_order_id = serializers.CharField(required=True)
    razorpay_payment_id = serializers.CharField(required=True)
    razorpay_signature = serializers.CharField(required=True)
    plan_id = serializers.IntegerField(required=True)
    billing_cycle = serializers.ChoiceField(choices=['MONTHLY', 'YEARLY'], required=True)
