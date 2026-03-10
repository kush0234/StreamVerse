"""
Tag Management Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count

from .models import Tag, VideoContent
from .serializers import TagSerializer
from .utils.auto_tagger import AutoTagger
from apps.admin_dashboard.permissions import IsAdminOrSuperAdmin


class TagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for tag management
    """
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    lookup_field = 'slug'
    
    def get_permissions(self):
        """
        Allow anyone to view tags, but only admins can create/update/delete
        """
        if self.action in ['list', 'retrieve', 'popular', 'by_category']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAdminOrSuperAdmin]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        queryset = Tag.objects.all()
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by auto-generated
        auto_generated = self.request.query_params.get('auto_generated')
        if auto_generated is not None:
            queryset = queryset.filter(auto_generated=auto_generated.lower() == 'true')
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset.order_by('-usage_count', 'name')
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular tags"""
        limit = int(request.query_params.get('limit', 20))
        popular_tags = Tag.objects.order_by('-usage_count')[:limit]
        serializer = self.get_serializer(popular_tags, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get tags grouped by category"""
        categories = Tag.TAG_CATEGORIES
        result = {}
        
        for category_code, category_name in categories:
            tags = Tag.objects.filter(category=category_code).order_by('-usage_count', 'name')[:10]
            result[category_code] = {
                'name': category_name,
                'tags': TagSerializer(tags, many=True).data
            }
        
        return Response(result)
    
    @action(detail=True, methods=['get'])
    def videos(self, request, slug=None):
        """Get all videos with this tag"""
        tag = self.get_object()
        videos = tag.videos.filter(approval_status='APPROVED').order_by('-created_at')
        
        # Import here to avoid circular import
        from .serializers import VideoContentSerializer
        serializer = VideoContentSerializer(videos, many=True, context={'request': request})
        
        return Response({
            'tag': TagSerializer(tag).data,
            'count': videos.count(),
            'videos': serializer.data
        })
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrSuperAdmin])
    def generate_for_content(self, request):
        """Generate tags for a specific content"""
        content_id = request.data.get('content_id')
        
        if not content_id:
            return Response(
                {'error': 'content_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            content = VideoContent.objects.get(id=content_id)
        except VideoContent.DoesNotExist:
            return Response(
                {'error': 'Content not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate and apply tags
        tags = AutoTagger.apply_tags_to_content(content)
        
        return Response({
            'message': f'Generated {len(tags)} tags for "{content.title}"',
            'tags': TagSerializer(tags, many=True).data
        })
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdminOrSuperAdmin])
    def generate_for_all(self, request):
        """Generate tags for all content without tags"""
        contents = VideoContent.objects.filter(tags__isnull=True)
        count = 0
        
        for content in contents:
            AutoTagger.apply_tags_to_content(content)
            count += 1
        
        return Response({
            'message': f'Generated tags for {count} content items',
            'count': count
        })
