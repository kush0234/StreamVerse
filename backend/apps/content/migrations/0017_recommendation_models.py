# Generated manually for recommendation system models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0009_remove_parental_controls_table'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('content', '0016_delete_contentapproval'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserInteraction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('interaction_type', models.CharField(choices=[('VIEW', 'View'), ('LIKE', 'Like'), ('DISLIKE', 'Dislike'), ('SHARE', 'Share'), ('WATCHLIST_ADD', 'Added to Watchlist'), ('WATCHLIST_REMOVE', 'Removed from Watchlist'), ('PLAY', 'Play'), ('PAUSE', 'Pause'), ('SKIP', 'Skip'), ('COMPLETE', 'Complete'), ('SEARCH', 'Search')], max_length=20)),
                ('interaction_value', models.FloatField(default=1.0, help_text='Weight of interaction (1.0 = normal, 2.0 = strong positive, -1.0 = negative)')),
                ('duration', models.IntegerField(default=0, help_text='Duration of interaction in seconds')),
                ('session_id', models.CharField(blank=True, max_length=100, null=True)),
                ('device_type', models.CharField(blank=True, max_length=50, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('episode', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='content.episode')),
                ('music', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='content.music')),
                ('profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='users.profile')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('video', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='content.videocontent')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='MusicListenHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('duration_listened', models.IntegerField(default=0, help_text='Duration listened in seconds')),
                ('completed', models.BooleanField(default=False)),
                ('play_count', models.IntegerField(default=1)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('music', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='listen_history', to='content.music')),
                ('profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='users.profile')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
        migrations.CreateModel(
            name='ContentSimilarity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('similarity_type', models.CharField(choices=[('GENRE', 'Genre Similarity'), ('TAG', 'Tag Similarity'), ('COLLABORATIVE', 'Collaborative Filtering'), ('HYBRID', 'Hybrid Score')], max_length=20)),
                ('similarity_score', models.FloatField(help_text='Similarity score between 0.0 and 1.0')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('music_a', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='similarity_a', to='content.music')),
                ('music_b', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='similarity_b', to='content.music')),
                ('video_a', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='similarity_a', to='content.videocontent')),
                ('video_b', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='similarity_b', to='content.videocontent')),
            ],
        ),
        migrations.AddIndex(
            model_name='userinteraction',
            index=models.Index(fields=['user', 'interaction_type', '-created_at'], name='content_use_user_id_b8b8c5_idx'),
        ),
        migrations.AddIndex(
            model_name='userinteraction',
            index=models.Index(fields=['profile', 'video', '-created_at'], name='content_use_profile_b8b8c5_idx'),
        ),
        migrations.AddIndex(
            model_name='userinteraction',
            index=models.Index(fields=['profile', 'music', '-created_at'], name='content_use_profile_music_b8b8c5_idx'),
        ),
        migrations.AddIndex(
            model_name='musiclistenhistory',
            index=models.Index(fields=['user', '-updated_at'], name='content_mus_user_id_b8b8c5_idx'),
        ),
        migrations.AddIndex(
            model_name='musiclistenhistory',
            index=models.Index(fields=['profile', '-updated_at'], name='content_mus_profile_b8b8c5_idx'),
        ),
        migrations.AddIndex(
            model_name='musiclistenhistory',
            index=models.Index(fields=['music', '-updated_at'], name='content_mus_music_id_b8b8c5_idx'),
        ),
        migrations.AddIndex(
            model_name='contentsimilarity',
            index=models.Index(fields=['video_a', 'similarity_type', '-similarity_score'], name='content_con_video_a_b8b8c5_idx'),
        ),
        migrations.AddIndex(
            model_name='contentsimilarity',
            index=models.Index(fields=['music_a', 'similarity_type', '-similarity_score'], name='content_con_music_a_b8b8c5_idx'),
        ),
        migrations.AddConstraint(
            model_name='contentsimilarity',
            constraint=models.UniqueConstraint(condition=models.Q(('video_a__isnull', False), ('video_b__isnull', False)), fields=('video_a', 'video_b', 'similarity_type'), name='unique_video_similarity'),
        ),
        migrations.AddConstraint(
            model_name='contentsimilarity',
            constraint=models.UniqueConstraint(condition=models.Q(('music_a__isnull', False), ('music_b__isnull', False)), fields=('music_a', 'music_b', 'similarity_type'), name='unique_music_similarity'),
        ),
    ]