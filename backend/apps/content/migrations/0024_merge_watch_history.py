from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0023_remove_episode_video_file_and_more'),
        ('users', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Step 1: Create new unified WatchHistory table
        migrations.CreateModel(
            name='WatchHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content_type', models.CharField(choices=[('VIDEO', 'Video'), ('MUSIC', 'Music')], default='VIDEO', max_length=10)),
                ('duration_watched', models.IntegerField(default=0)),
                ('completed', models.BooleanField(default=False)),
                ('play_count', models.IntegerField(default=1)),
                ('created_at', models.DateTimeField(auto_now_add=True, null=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('profile', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='users.profile')),
                ('video', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='watch_history_new', to='content.videocontent')),
                ('episode', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='watch_history_new', to='content.episode')),
                ('music', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='listen_history_new', to='content.music')),
            ],
            options={
                'verbose_name_plural': 'Watch Histories',
                'ordering': ['-updated_at'],
            },
        ),

        # Step 2: Migrate data from VideoWatchHistory
        migrations.RunSQL(
            sql="""
                INSERT INTO content_watchhistory
                    (content_type, user_id, profile_id, video_id, episode_id, music_id,
                     duration_watched, completed, play_count, updated_at)
                SELECT
                    'VIDEO', user_id, profile_id, video_id, episode_id, NULL,
                    duration_watched, completed, 1, updated_at
                FROM content_videowatchhistory;
            """,
            reverse_sql="DELETE FROM content_watchhistory WHERE content_type = 'VIDEO';"
        ),

        # Step 3: Migrate data from MusicListenHistory
        migrations.RunSQL(
            sql="""
                INSERT INTO content_watchhistory
                    (content_type, user_id, profile_id, video_id, episode_id, music_id,
                     duration_watched, completed, play_count, updated_at)
                SELECT
                    'MUSIC', user_id, profile_id, NULL, NULL, music_id,
                    duration_listened, completed, play_count, updated_at
                FROM content_musiclistenhistory;
            """,
            reverse_sql="DELETE FROM content_watchhistory WHERE content_type = 'MUSIC';"
        ),

        # Step 4: Drop old tables
        migrations.DeleteModel(name='VideoWatchHistory'),
        migrations.DeleteModel(name='MusicListenHistory'),

        # Step 5: Rename related_name on new table to match what code expects
        migrations.AlterField(
            model_name='watchhistory',
            name='video',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='watch_history', to='content.videocontent'),
        ),
        migrations.AlterField(
            model_name='watchhistory',
            name='episode',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='watch_history', to='content.episode'),
        ),
        migrations.AlterField(
            model_name='watchhistory',
            name='music',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='listen_history', to='content.music'),
        ),
    ]
