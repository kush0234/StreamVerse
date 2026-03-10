from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
from django.db.models import Q, F
from .models import FeedbackCategory, Feedback, FeedbackVote, FeedbackComment
from .serializers import (
    FeedbackCategorySerializer,
    FeedbackListSerializer,
    FeedbackDetailSerializer,
    FeedbackCreateSerializer,
    FeedbackVoteSerializer,
    FeedbackCommentSerializer
)
from apps.admin_dashboard.models import ActivityLog


class FeedbackCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """Public endpoint for feedback categories"""
    queryset = FeedbackCategory.objects.filter(is_active=True)
    serializer_class = FeedbackCategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class FeedbackViewSet(viewsets.ModelViewSet):
    """Main feedback viewset with voting and commenting"""
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'upvotes', 'views_count']
    
    def get_queryset(self):
        queryset = Feedback.objects.select_related('user', 'category').prefetch_related('comments', 'votes')
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        
        # Filter by user's own feedback
        my_feedback = self.request.query_params.get('my_feedback')
        if my_feedback and self.request.user.is_authenticated:
            queryset = queryset.filter(user=self.request.user)
        
        # Public feedback only for non-authenticated or non-owner
        if not self.request.user.is_authenticated or not self.request.user.is_staff:
            queryset = queryset.filter(is_public=True)
        
        # Sort by vote score
        sort_by = self.request.query_params.get('sort_by')
        if sort_by == 'popular':
            queryset = queryset.annotate(vote_score=F('upvotes') - F('downvotes')).order_by('-vote_score')
        elif sort_by == 'recent':
            queryset = queryset.order_by('-created_at')
        else:
            queryset = queryset.order_by('-is_pinned', '-created_at')
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FeedbackListSerializer
        elif self.action == 'create':
            return FeedbackCreateSerializer
        return FeedbackDetailSerializer
    
    def perform_create(self, serializer):
        feedback = serializer.save(user=self.request.user)
        
        # Log activity
        ActivityLog.log_activity(
            activity_type='FEEDBACK_SUBMITTED',
            user=self.request.user,
            description=f'New feedback submitted: "{feedback.title}"',
            metadata={'feedback_id': feedback.id, 'category': feedback.category.name if feedback.category else None},
            request=self.request
        )
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        instance.views_count = F('views_count') + 1
        instance.save(update_fields=['views_count'])
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def vote(self, request, pk=None):
        """Vote on feedback (upvote/downvote)"""
        feedback = self.get_object()
        vote_type = request.data.get('vote_type')
        
        if vote_type not in ['UP', 'DOWN']:
            return Response({'error': 'Invalid vote type'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already voted
        existing_vote = FeedbackVote.objects.filter(feedback=feedback, user=request.user).first()
        
        if existing_vote:
            if existing_vote.vote_type == vote_type:
                # Remove vote if clicking same vote again
                if vote_type == 'UP':
                    feedback.upvotes = F('upvotes') - 1
                else:
                    feedback.downvotes = F('downvotes') - 1
                feedback.save()
                existing_vote.delete()
                message = 'Vote removed'
            else:
                # Change vote
                if vote_type == 'UP':
                    feedback.upvotes = F('upvotes') + 1
                    feedback.downvotes = F('downvotes') - 1
                else:
                    feedback.downvotes = F('downvotes') + 1
                    feedback.upvotes = F('upvotes') - 1
                feedback.save()
                existing_vote.vote_type = vote_type
                existing_vote.save()
                message = 'Vote changed'
        else:
            # New vote
            FeedbackVote.objects.create(feedback=feedback, user=request.user, vote_type=vote_type)
            if vote_type == 'UP':
                feedback.upvotes = F('upvotes') + 1
            else:
                feedback.downvotes = F('downvotes') + 1
            feedback.save()
            message = 'Vote recorded'
        
        feedback.refresh_from_db()
        return Response({
            'message': message,
            'upvotes': feedback.upvotes,
            'downvotes': feedback.downvotes,
            'vote_score': feedback.vote_score
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def comment(self, request, pk=None):
        """Add comment to feedback"""
        feedback = self.get_object()
        comment_text = request.data.get('comment')
        
        if not comment_text:
            return Response({'error': 'Comment text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        comment = FeedbackComment.objects.create(
            feedback=feedback,
            user=request.user,
            comment=comment_text,
            is_admin=request.user.is_staff
        )
        
        serializer = FeedbackCommentSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_feedback(self, request):
        """Get current user's feedback"""
        feedbacks = self.get_queryset().filter(user=request.user)
        serializer = FeedbackListSerializer(feedbacks, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get feedback statistics"""
        total = Feedback.objects.filter(is_public=True).count()
        by_status = {}
        for status_choice, _ in Feedback.STATUS_CHOICES:
            by_status[status_choice] = Feedback.objects.filter(status=status_choice, is_public=True).count()
        
        by_category = {}
        for category in FeedbackCategory.objects.filter(is_active=True):
            by_category[category.name] = category.feedbacks.filter(is_public=True).count()
        
        return Response({
            'total_feedback': total,
            'by_status': by_status,
            'by_category': by_category
        })
