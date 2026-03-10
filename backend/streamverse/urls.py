"""
URL configuration for streamverse project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static
from apps.content.video_views import stream_video
from apps.admin_dashboard.admin_views import admin_dashboard

urlpatterns = [
    # Custom Admin Dashboard
    path("superadmin/dashboard/", admin_dashboard, name="admin_dashboard"),
    
    # Django Admin Panel (Superadmin only)
    path("superadmin/", admin.site.urls),

    # Public/Auth endpoints (accessible to all)
    path("api/auth/", include("apps.users.urls")),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # User endpoints (authenticated users)
    path("api/user/", include("apps.content.urls")),
    path("api/feedback/", include("apps.feedback.urls")),

    # Admin endpoints (admin and superadmin)
    path("api/admin-dashboard/", include("apps.admin_dashboard.urls")),
]

if settings.DEBUG:
    # Custom video streaming with range request support
    urlpatterns += [
        re_path(r'^media/(?P<path>videos/.+)$', stream_video, name='stream_video'),
        re_path(r'^media/(?P<path>episodes/.+)$', stream_video, name='stream_episode'),
    ]
    # Serve other media files normally
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
