from django.urls import path
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    UserInfoView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    DeleteAccountView,
    ProfileListCreateView,
    ProfileUpdateView,
    ProfileDeleteView,
    # Subscription views
    SubscriptionPlanListView,
    UserSubscriptionView,
    CreateSubscriptionView,
    CancelSubscriptionView,
    ChangeSubscriptionPlanView,
    PaymentHistoryListView,
    # Payment views
    InitiatePaymentView,
    VerifyPaymentView,
    RazorpayWebhookView,
    RazorpayKeyView,
)

urlpatterns = [
    # Auth
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", CustomTokenObtainPairView.as_view(), name="login"),
    path("user-info/", UserInfoView.as_view(), name="user-info"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path("password-reset-confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("delete-account/", DeleteAccountView.as_view(), name="delete-account"),
    # Profile APIs
    path("profiles/", ProfileListCreateView.as_view(), name="profiles"),
    path("profiles/<int:pk>/", ProfileUpdateView.as_view(), name="update-profile"),
    path("profiles/<int:pk>/delete/", ProfileDeleteView.as_view(), name="delete-profile"),
    # Subscription APIs
    path("subscription/plans/", SubscriptionPlanListView.as_view(), name="subscription-plans"),
    path("subscription/", UserSubscriptionView.as_view(), name="user-subscription"),
    path("subscription/create/", CreateSubscriptionView.as_view(), name="create-subscription"),
    path("subscription/cancel/", CancelSubscriptionView.as_view(), name="cancel-subscription"),
    path("subscription/change-plan/", ChangeSubscriptionPlanView.as_view(), name="change-subscription-plan"),
    path("payments/history/", PaymentHistoryListView.as_view(), name="payment-history"),
    # Payment APIs
    path("payment/initiate/", InitiatePaymentView.as_view(), name="initiate-payment"),
    path("payment/verify/", VerifyPaymentView.as_view(), name="verify-payment"),
    path("payment/webhook/", RazorpayWebhookView.as_view(), name="razorpay-webhook"),
    path("payment/razorpay-key/", RazorpayKeyView.as_view(), name="razorpay-key"),
]
