from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FeedbackCategoryViewSet, FeedbackViewSet

router = DefaultRouter()
router.register(r'categories', FeedbackCategoryViewSet, basename='feedback-category')
router.register(r'', FeedbackViewSet, basename='feedback')

urlpatterns = [
    path('', include(router.urls)),
]
