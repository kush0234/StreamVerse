from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    ProfileSerializer,
    UserInfoSerializer,
    ChangePasswordSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User, Profile
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.admin_dashboard.models import ActivityLog
import uuid
from django.conf import settings


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        # Log user registration activity
        ActivityLog.log_activity(
            activity_type='USER_REGISTERED',
            user=user,
            description=f'New user "{user.username}" registered to the platform',
            request=self.request
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserInfoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserInfoSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password updated successfully"},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(
                    {"message": "Password reset email sent successfully"},
                    status=status.HTTP_200_OK
                )
            except Exception as e:
                return Response(
                    {"error": f"Failed to send email: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Password reset successfully"},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            user = request.user
            user_id = user.id
            user.delete()
            return Response(
                {"message": "Account deleted successfully", "user_id": user_id},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProfileListCreateView(generics.ListCreateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        user = self.request.user

        # Check profile limit based on subscription plan
        current_profile_count = user.profiles.count()
        max_profiles = 2  # Default limit

        if user.is_subscribed and user.subscription_plan:
            max_profiles = user.subscription_plan.max_profiles

        if current_profile_count >= max_profiles:
            raise ValidationError(
                f"Profile limit reached. Your plan allows maximum {max_profiles} profiles."
            )

        try:
            serializer.save(user=user)
        except Exception as e:
            # Catch Cloudinary upload errors and return a proper 400 response
            error_msg = str(e)
            if 'Invalid image' in error_msg or 'BadRequest' in error_msg:
                raise ValidationError("Invalid image file. Please upload a valid image.")
            raise ValidationError(f"Failed to create profile: {error_msg}")


class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ProfileDeleteView(generics.DestroyAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        from django.db import transaction

        user = self.request.user
        profile_count = user.profiles.count()

        # Prevent deleting the last profile
        if profile_count <= 1:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Cannot delete the last profile. At least one profile is required.")

        try:
            with transaction.atomic():
                # Delete related data first to avoid foreign key issues
                instance.watchlist.all().delete()
                # Delete the profile
                instance.delete()
        except Exception as e:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(f"Error deleting profile: {str(e)}")


# Subscription Views
from .models import SubscriptionPlan, Subscription, PaymentHistory
from .serializers import (
    SubscriptionPlanSerializer,
    SubscriptionSerializer,
    CreateSubscriptionSerializer,
    PaymentHistorySerializer,
)
from django.utils import timezone
from datetime import timedelta


class SubscriptionPlanListView(generics.ListAPIView):
    """List all active subscription plans"""
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]


class UserSubscriptionView(APIView):
    """Get current user's subscription details"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            subscription = Subscription.objects.get(user=request.user)
            serializer = SubscriptionSerializer(subscription)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Subscription.DoesNotExist:
            return Response(
                {"message": "No active subscription found", "subscription": None},
                status=status.HTTP_200_OK
            )


class CreateSubscriptionView(APIView):
    """Create a new subscription for the user"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateSubscriptionSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already has an active subscription
        if hasattr(request.user, 'user_subscription') and request.user.user_subscription:
            existing_sub = request.user.user_subscription
            if existing_sub.is_active:
                return Response(
                    {"error": "You already have an active subscription"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        plan = SubscriptionPlan.objects.get(id=serializer.validated_data['plan_id'])
        billing_cycle = serializer.validated_data['billing_cycle']
        payment_method = serializer.validated_data['payment_method']

        # Calculate amount based on billing cycle
        amount = plan.monthly_price if billing_cycle == 'MONTHLY' else plan.yearly_price

        # Calculate end date
        start_date = timezone.now()
        if billing_cycle == 'MONTHLY':
            end_date = start_date + timedelta(days=30)
        else:
            end_date = start_date + timedelta(days=365)

        # Check if user already has a subscription
        existing_subscription = Subscription.objects.filter(user=request.user).first()

        if existing_subscription:
            # Update existing subscription instead of creating new one
            existing_subscription.plan = plan
            existing_subscription.billing_cycle = billing_cycle
            existing_subscription.status = 'ACTIVE'
            existing_subscription.start_date = start_date
            existing_subscription.end_date = end_date
            existing_subscription.next_billing_date = end_date
            existing_subscription.last_payment_date = start_date
            existing_subscription.auto_renew = True
            existing_subscription.save()
            subscription = existing_subscription
        else:
            # Create new subscription
            subscription = Subscription.objects.create(
                user=request.user,
                plan=plan,
                billing_cycle=billing_cycle,
                status='ACTIVE',
                start_date=start_date,
                end_date=end_date,
                next_billing_date=end_date,
                last_payment_date=start_date
            )

        # Create payment record
        payment = PaymentHistory.objects.create(
            subscription=subscription,
            user=request.user,
            amount=amount,
            payment_method=payment_method,
            payment_status='SUCCESS',
            transaction_id=f'TXN{uuid.uuid4().hex[:12].upper()}'
        )

        # Log subscription purchase activity
        ActivityLog.log_activity(
            activity_type='SUBSCRIPTION_PURCHASED',
            user=request.user,
            description=f'User "{request.user.username}" purchased {plan.display_name} subscription',
            metadata={
                'plan_name': plan.display_name,
                'billing_cycle': billing_cycle,
                'amount': float(amount),
                'transaction_id': payment.transaction_id
            },
            request=request
        )

        # Log payment success activity
        ActivityLog.log_activity(
            activity_type='PAYMENT_SUCCESS',
            user=request.user,
            description=f'Payment of ₹{amount} processed successfully for {plan.display_name}',
            metadata={
                'amount': float(amount),
                'transaction_id': payment.transaction_id,
                'payment_method': payment_method
            },
            request=request
        )

        return Response(
            {
                "message": "Subscription created successfully",
                "subscription": SubscriptionSerializer(subscription).data,
                "payment": PaymentHistorySerializer(payment).data
            },
            status=status.HTTP_201_CREATED
        )


class CancelSubscriptionView(APIView):
    """Cancel user's subscription"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            subscription = Subscription.objects.get(user=request.user)
            subscription.cancel()

            # Log subscription cancellation activity
            ActivityLog.log_activity(
                activity_type='SUBSCRIPTION_CANCELLED',
                user=request.user,
                description=f'User "{request.user.username}" cancelled {subscription.plan.display_name} subscription',
                metadata={
                    'plan_name': subscription.plan.display_name,
                    'billing_cycle': subscription.billing_cycle
                },
                request=request
            )

            return Response(
                {"message": "Subscription cancelled successfully"},
                status=status.HTTP_200_OK
            )
        except Subscription.DoesNotExist:
            return Response(
                {"error": "No subscription found"},
                status=status.HTTP_404_NOT_FOUND
            )


class ChangeSubscriptionPlanView(APIView):
    """Change user's subscription plan"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            subscription = Subscription.objects.get(user=request.user)

            if not subscription.is_active:
                return Response(
                    {"error": "Cannot change plan for inactive subscription"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            new_plan_id = request.data.get('plan_id')
            new_billing_cycle = request.data.get('billing_cycle', subscription.billing_cycle)

            try:
                new_plan = SubscriptionPlan.objects.get(id=new_plan_id, is_active=True)
            except SubscriptionPlan.DoesNotExist:
                return Response(
                    {"error": "Invalid plan selected"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update subscription
            subscription.plan = new_plan
            subscription.billing_cycle = new_billing_cycle
            subscription.save()

            return Response(
                {
                    "message": "Subscription plan changed successfully",
                    "subscription": SubscriptionSerializer(subscription).data
                },
                status=status.HTTP_200_OK
            )
        except Subscription.DoesNotExist:
            return Response(
                {"error": "No subscription found"},
                status=status.HTTP_404_NOT_FOUND
            )


class PaymentHistoryListView(generics.ListAPIView):
    """List user's payment history"""
    serializer_class = PaymentHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PaymentHistory.objects.filter(user=self.request.user)



# Razorpay Payment Views
from .serializers import InitiatePaymentSerializer, VerifyPaymentSerializer
from .razorpay_utils import create_razorpay_order, verify_payment_signature, verify_webhook_signature, fetch_payment_details
import json


class InitiatePaymentView(APIView):
    """Initiate payment by creating Razorpay order"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InitiatePaymentSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check if user already has an active subscription
        if hasattr(request.user, 'user_subscription') and request.user.user_subscription:
            existing_sub = request.user.user_subscription
            if existing_sub.is_active:
                return Response(
                    {"error": "You already have an active subscription"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        plan = SubscriptionPlan.objects.get(id=serializer.validated_data['plan_id'])
        billing_cycle = serializer.validated_data['billing_cycle']

        # Calculate amount based on billing cycle
        amount = plan.monthly_price if billing_cycle == 'MONTHLY' else plan.yearly_price

        # Create receipt ID
        receipt_id = f"SUB_{request.user.id}_{uuid.uuid4().hex[:8].upper()}"

        try:
            # Create Razorpay order
            order = create_razorpay_order(
                amount=float(amount),
                currency='INR',
                receipt=receipt_id
            )

            # Create payment record with INITIATED status
            payment = PaymentHistory.objects.create(
                subscription=None,  # Will be linked after successful payment
                user=request.user,
                amount=amount,
                currency='INR',
                payment_method='CARD',  # Will be updated after payment
                payment_status='INITIATED',
                razorpay_order_id=order['id'],
                transaction_id=receipt_id,
                payment_gateway_response=order
            )

            # Log activity
            ActivityLog.log_activity(
                activity_type='PAYMENT_INITIATED',
                user=request.user,
                description=f'Payment initiated for {plan.display_name} subscription',
                metadata={
                    'plan_name': plan.display_name,
                    'billing_cycle': billing_cycle,
                    'amount': float(amount),
                    'order_id': order['id']
                },
                request=request
            )

            return Response(
                {
                    "order_id": order['id'],
                    "amount": int(amount * 100),  # Amount in paise
                    "currency": "INR",
                    "key_id": settings.RAZORPAY_KEY_ID,
                    "plan_name": plan.display_name,
                    "user_name": request.user.username,
                    "user_email": request.user.email,
                    "payment_id": payment.id
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to create payment order: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyPaymentView(APIView):
    """Verify payment and create subscription"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        razorpay_order_id = serializer.validated_data['razorpay_order_id']
        razorpay_payment_id = serializer.validated_data['razorpay_payment_id']
        razorpay_signature = serializer.validated_data['razorpay_signature']
        plan_id = serializer.validated_data['plan_id']
        billing_cycle = serializer.validated_data['billing_cycle']

        # Verify payment signature
        is_valid = verify_payment_signature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        )

        if not is_valid:
            # Update payment status to FAILED
            try:
                payment = PaymentHistory.objects.get(razorpay_order_id=razorpay_order_id)
                payment.payment_status = 'FAILED'
                payment.save()
            except PaymentHistory.DoesNotExist:
                pass

            return Response(
                {"error": "Invalid payment signature"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Fetch payment details from Razorpay
            payment_details = fetch_payment_details(razorpay_payment_id)

            # Get plan
            plan = SubscriptionPlan.objects.get(id=plan_id)

            # Calculate dates
            start_date = timezone.now()
            if billing_cycle == 'MONTHLY':
                end_date = start_date + timedelta(days=30)
            else:
                end_date = start_date + timedelta(days=365)

            # Check if user already has a subscription
            existing_subscription = Subscription.objects.filter(user=request.user).first()

            if existing_subscription:
                # Update existing subscription
                existing_subscription.plan = plan
                existing_subscription.billing_cycle = billing_cycle
                existing_subscription.status = 'ACTIVE'
                existing_subscription.start_date = start_date
                existing_subscription.end_date = end_date
                existing_subscription.next_billing_date = end_date
                existing_subscription.last_payment_date = start_date
                existing_subscription.auto_renew = True
                existing_subscription.save()
                subscription = existing_subscription
            else:
                # Create new subscription
                subscription = Subscription.objects.create(
                    user=request.user,
                    plan=plan,
                    billing_cycle=billing_cycle,
                    status='ACTIVE',
                    start_date=start_date,
                    end_date=end_date,
                    next_billing_date=end_date,
                    last_payment_date=start_date
                )

            # Update payment record
            payment = PaymentHistory.objects.get(razorpay_order_id=razorpay_order_id)
            payment.subscription = subscription
            payment.payment_status = 'SUCCESS'
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.payment_method = payment_details.get('method', 'CARD').upper()
            payment.payment_gateway_response = payment_details
            payment.save()

            # Log subscription purchase activity
            ActivityLog.log_activity(
                activity_type='SUBSCRIPTION_PURCHASED',
                user=request.user,
                description=f'User "{request.user.username}" purchased {plan.display_name} subscription',
                metadata={
                    'plan_name': plan.display_name,
                    'billing_cycle': billing_cycle,
                    'amount': float(payment.amount),
                    'transaction_id': payment.transaction_id,
                    'razorpay_payment_id': razorpay_payment_id
                },
                request=request
            )

            # Log payment success activity
            ActivityLog.log_activity(
                activity_type='PAYMENT_SUCCESS',
                user=request.user,
                description=f'Payment of ₹{payment.amount} processed successfully for {plan.display_name}',
                metadata={
                    'amount': float(payment.amount),
                    'transaction_id': payment.transaction_id,
                    'payment_method': payment.payment_method,
                    'razorpay_payment_id': razorpay_payment_id
                },
                request=request
            )

            return Response(
                {
                    "message": "Payment verified and subscription created successfully",
                    "subscription": SubscriptionSerializer(subscription).data,
                    "payment": PaymentHistorySerializer(payment).data
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"error": f"Failed to verify payment: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@method_decorator(csrf_exempt, name='dispatch')
class RazorpayWebhookView(APIView):
    """Handle Razorpay webhook notifications"""
    permission_classes = [AllowAny]

    def post(self, request):
        # Get webhook signature from header
        webhook_signature = request.headers.get('X-Razorpay-Signature', '')
        webhook_body = request.body.decode('utf-8')

        # Verify webhook signature
        if not verify_webhook_signature(webhook_body, webhook_signature):
            return Response(
                {"error": "Invalid webhook signature"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            webhook_data = json.loads(webhook_body)
            event = webhook_data.get('event')
            payload = webhook_data.get('payload', {}).get('payment', {}).get('entity', {})

            if event == 'payment.captured':
                # Payment was successful
                payment_id = payload.get('id')
                order_id = payload.get('order_id')

                try:
                    payment = PaymentHistory.objects.get(razorpay_order_id=order_id)
                    if payment.payment_status != 'SUCCESS':
                        payment.payment_status = 'SUCCESS'
                        payment.razorpay_payment_id = payment_id
                        payment.payment_gateway_response = payload
                        payment.save()
                except PaymentHistory.DoesNotExist:
                    pass

            elif event == 'payment.failed':
                # Payment failed
                order_id = payload.get('order_id')

                try:
                    payment = PaymentHistory.objects.get(razorpay_order_id=order_id)
                    payment.payment_status = 'FAILED'
                    payment.payment_gateway_response = payload
                    payment.save()
                except PaymentHistory.DoesNotExist:
                    pass

            return Response({"status": "success"}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RazorpayKeyView(APIView):
    """Get Razorpay public key"""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {"key_id": settings.RAZORPAY_KEY_ID},
            status=status.HTTP_200_OK
        )
