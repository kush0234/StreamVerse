from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Profile, SubscriptionPlan, Subscription, PaymentHistory


class SubscriptionInline(admin.TabularInline):
    model = Subscription
    extra = 0
    can_delete = False


class CustomUserAdmin(UserAdmin):
    inlines = [SubscriptionInline]
    list_display = ['id','username', 'email', 'role', 'is_subscribed', 'subscription_plan']
    list_filter = UserAdmin.list_filter + ('role',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Role & Subscription', {'fields': ('role',)}),
    )
    
    def is_subscribed(self, obj):
        return obj.is_subscribed
    is_subscribed.boolean = True
    is_subscribed.short_description = 'Subscribed'
    
    def subscription_plan(self, obj):
        return obj.subscription_plan.display_name if obj.subscription_plan else 'None'
    subscription_plan.short_description = 'Plan'


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'name', 'monthly_price', 'yearly_price', 'max_profiles', 'video_quality', 'is_active']
    list_filter = ['is_active', 'video_quality']
    search_fields = ['display_name', 'name']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'billing_cycle', 'status', 'start_date', 'end_date', 'auto_renew']
    list_filter = ['status', 'billing_cycle', 'auto_renew', 'plan']
    search_fields = ['user__username', 'user__email']
    date_hierarchy = 'created_at'
    
    actions = ['cancel_subscriptions', 'activate_subscriptions']
    
    def cancel_subscriptions(self, request, queryset):
        for subscription in queryset:
            subscription.cancel()
        self.message_user(request, f'{queryset.count()} subscriptions cancelled.')
    cancel_subscriptions.short_description = 'Cancel selected subscriptions'
    
    def activate_subscriptions(self, request, queryset):
        queryset.update(status='ACTIVE')
        self.message_user(request, f'{queryset.count()} subscriptions activated.')
    activate_subscriptions.short_description = 'Activate selected subscriptions'


@admin.register(PaymentHistory)
class PaymentHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'subscription_plan', 'amount', 'payment_method', 'payment_status', 'transaction_id', 'razorpay_payment_id', 'created_at']
    list_filter = ['payment_status', 'payment_method', 'created_at']
    search_fields = ['user__username', 'user__email', 'transaction_id', 'razorpay_payment_id', 'razorpay_order_id']
    date_hierarchy = 'created_at'
    readonly_fields = ['transaction_id', 'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'payment_gateway_response', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('user', 'subscription', 'amount', 'currency', 'payment_method', 'payment_status')
        }),
        ('Razorpay Details', {
            'fields': ('razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'transaction_id')
        }),
        ('Additional Information', {
            'fields': ('payment_gateway_response', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_success', 'mark_as_failed', 'export_payments']
    
    def subscription_plan(self, obj):
        if obj.subscription:
            return obj.subscription.plan.display_name
        return 'N/A'
    subscription_plan.short_description = 'Plan'
    
    def mark_as_success(self, request, queryset):
        queryset.update(payment_status='SUCCESS')
        self.message_user(request, f'{queryset.count()} payments marked as successful.')
    mark_as_success.short_description = 'Mark as Success'
    
    def mark_as_failed(self, request, queryset):
        queryset.update(payment_status='FAILED')
        self.message_user(request, f'{queryset.count()} payments marked as failed.')
    mark_as_failed.short_description = 'Mark as Failed'
    
    def export_payments(self, request, queryset):
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="payments.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['ID', 'User', 'Amount', 'Currency', 'Method', 'Status', 'Transaction ID', 'Date'])
        
        for payment in queryset:
            writer.writerow([
                payment.id,
                payment.user.username,
                payment.amount,
                payment.currency,
                payment.payment_method,
                payment.payment_status,
                payment.transaction_id,
                payment.created_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    export_payments.short_description = 'Export to CSV'


admin.site.register(User, CustomUserAdmin)
admin.site.register(Profile)
