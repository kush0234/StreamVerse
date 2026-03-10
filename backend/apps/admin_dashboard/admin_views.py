"""
Custom views for Django Admin dashboard
"""
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta

from apps.users.models import User, Subscription, PaymentHistory, SubscriptionPlan
from apps.content.models import VideoContent, Episode, Music
from .models import ActivityLog


@staff_member_required
def admin_dashboard(request):
    """Custom admin dashboard with statistics"""
    
    # Date calculations
    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # User Statistics
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    new_users_today = User.objects.filter(date_joined__gte=today_start).count()
    new_users_this_month = User.objects.filter(date_joined__gte=month_start).count()
    
    # Content Statistics
    total_videos = VideoContent.objects.count()
    total_episodes = Episode.objects.count()
    total_music = Music.objects.count()
    total_content = total_videos + total_episodes + total_music
    
    # Subscription Statistics
    total_subscriptions = Subscription.objects.count()
    active_subscriptions = Subscription.objects.filter(
        status__in=['ACTIVE', 'TRIAL']
    ).count()
    trial_subscriptions = Subscription.objects.filter(status='TRIAL').count()
    cancelled_subscriptions = Subscription.objects.filter(status='CANCELLED').count()
    
    # Subscription by Plan
    subscriptions_by_plan = Subscription.objects.filter(
        status__in=['ACTIVE', 'TRIAL']
    ).values('plan__display_name').annotate(count=Count('id')).order_by('-count')
    
    # Payment Statistics
    total_payments = PaymentHistory.objects.count()
    successful_payments = PaymentHistory.objects.filter(payment_status='SUCCESS').count()
    failed_payments = PaymentHistory.objects.filter(payment_status='FAILED').count()
    pending_payments = PaymentHistory.objects.filter(
        payment_status__in=['INITIATED', 'PENDING']
    ).count()
    
    # Revenue Statistics
    total_revenue = PaymentHistory.objects.filter(
        payment_status='SUCCESS'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    revenue_today = PaymentHistory.objects.filter(
        payment_status='SUCCESS',
        created_at__gte=today_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    revenue_this_month = PaymentHistory.objects.filter(
        payment_status='SUCCESS',
        created_at__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    revenue_this_year = PaymentHistory.objects.filter(
        payment_status='SUCCESS',
        created_at__gte=year_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Revenue by Payment Method
    revenue_by_method = PaymentHistory.objects.filter(
        payment_status='SUCCESS'
    ).values('payment_method').annotate(
        total=Sum('amount'),
        count=Count('id')
    ).order_by('-total')
    
    # Recent Payments (Last 10)
    recent_payments = PaymentHistory.objects.select_related(
        'user', 'subscription'
    ).order_by('-created_at')[:10]
    
    # Recent Subscriptions (Last 10)
    recent_subscriptions = Subscription.objects.select_related(
        'user', 'plan'
    ).order_by('-created_at')[:10]
    
    # Recent Activities (Last 10)
    recent_activities = ActivityLog.objects.select_related('user').order_by('-created_at')[:10]
    
    # Most Viewed Content
    most_viewed_videos = VideoContent.objects.order_by('-view_count')[:5]
    most_played_music = Music.objects.order_by('-play_count')[:5]
    
    # Expiring Soon (Next 7 days)
    seven_days_later = now + timedelta(days=7)
    expiring_soon = Subscription.objects.filter(
        status='ACTIVE',
        end_date__lte=seven_days_later,
        end_date__gte=now
    ).select_related('user', 'plan').order_by('end_date')[:10]
    
    context = {
        # User Stats
        'total_users': total_users,
        'active_users': active_users,
        'new_users_today': new_users_today,
        'new_users_this_month': new_users_this_month,
        
        # Content Stats
        'total_videos': total_videos,
        'total_episodes': total_episodes,
        'total_music': total_music,
        'total_content': total_content,
        
        # Subscription Stats
        'total_subscriptions': total_subscriptions,
        'active_subscriptions': active_subscriptions,
        'trial_subscriptions': trial_subscriptions,
        'cancelled_subscriptions': cancelled_subscriptions,
        'subscriptions_by_plan': subscriptions_by_plan,
        
        # Payment Stats
        'total_payments': total_payments,
        'successful_payments': successful_payments,
        'failed_payments': failed_payments,
        'pending_payments': pending_payments,
        
        # Revenue Stats
        'total_revenue': total_revenue,
        'revenue_today': revenue_today,
        'revenue_this_month': revenue_this_month,
        'revenue_this_year': revenue_this_year,
        'revenue_by_method': revenue_by_method,
        
        # Recent Data
        'recent_payments': recent_payments,
        'recent_subscriptions': recent_subscriptions,
        'recent_activities': recent_activities,
        'most_viewed_videos': most_viewed_videos,
        'most_played_music': most_played_music,
        'expiring_soon': expiring_soon,
        
        # Page Info
        'title': 'Dashboard Overview',
    }
    
    return render(request, 'admin/dashboard.html', context)

