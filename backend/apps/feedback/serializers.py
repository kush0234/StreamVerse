from rest_framework import serializers
from .models import FeedbackCategory, Feedback, FeedbackVote, FeedbackComment, FeedbackAttachment
from django.contrib.auth import get_user_model

User = get_user_model()


class FeedbackCategorySerializer(serializers.ModelSerializer):
    feedback_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FeedbackCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'color', 'is_active', 'feedback_count']
    
    def get_feedback_count(self, obj):
        return obj.feedbacks.filter(is_public=True).count()


class FeedbackCommentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    class Meta:
        model = FeedbackComment
        fields = ['id', 'feedback', 'user_id', 'username', 'comment', 'is_admin', 'created_at', 'updated_at']
        read_only_fields = ['user', 'is_admin', 'created_at', 'updated_at']


class FeedbackAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = FeedbackAttachment
        fields = ['id', 'file_url', 'file_name', 'file_type', 'file_size', 'uploaded_at']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None


class FeedbackListSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    vote_score = serializers.IntegerField(read_only=True)
    comments_count = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    
    class Meta:
        model = Feedback
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'username', 'category_name', 'category_icon',
            'upvotes', 'downvotes', 'vote_score', 'views_count',
            'comments_count', 'user_vote', 'is_pinned',
            'created_at', 'updated_at'
        ]
    
    def get_comments_count(self, obj):
        return obj.comments.count()
    
    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            return vote.vote_type if vote else None
        return None


class FeedbackDetailSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    vote_score = serializers.IntegerField(read_only=True)
    comments = FeedbackCommentSerializer(many=True, read_only=True)
    attachments = FeedbackAttachmentSerializer(many=True, read_only=True)
    user_vote = serializers.SerializerMethodField()
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True, allow_null=True)
    
    class Meta:
        model = Feedback
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'user_id', 'username', 'category', 'category_name', 'category_icon',
            'upvotes', 'downvotes', 'vote_score', 'views_count',
            'admin_response', 'admin_notes', 'assigned_to', 'assigned_to_username',
            'is_public', 'is_pinned', 'comments', 'attachments', 'user_vote',
            'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['user', 'upvotes', 'downvotes', 'views_count', 'created_at', 'updated_at']
    
    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            return vote.vote_type if vote else None
        return None


class FeedbackCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['title', 'description', 'category']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class FeedbackVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedbackVote
        fields = ['vote_type']
