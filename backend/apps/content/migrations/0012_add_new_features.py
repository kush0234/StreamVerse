# Generated migration for new features: Coming Soon, Approval Workflow, Auto-Tagging

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0011_alter_watchlist_unique_together_alter_music_duration_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Create Tag model
        migrations.CreateModel(
            name='Tag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('slug', models.SlugField(blank=True, max_length=100, unique=True)),
                ('category', models.CharField(
                    choices=[
                        ('GENRE', 'Genre'),
                        ('MOOD', 'Mood'),
                        ('THEME', 'Theme'),
                        ('ERA', 'Era'),
                        ('DURATION', 'Duration'),
                        ('OTHER', 'Other')
                    ],
                    default='OTHER',
                    max_length=20
                )),
                ('auto_generated', models.BooleanField(default=False, help_text='Tag was auto-generated')),
                ('usage_count', models.IntegerField(default=0, help_text='Number of times this tag is used')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-usage_count', 'name'],
            },
        ),
        
        # Add new fields to VideoContent
        migrations.AddField(
            model_name='videocontent',
            name='is_coming_soon',
            field=models.BooleanField(
                default=False,
                help_text="If True, content is marked as 'Coming Soon' and video upload is optional"
            ),
        ),
        migrations.AddField(
            model_name='videocontent',
            name='expected_release_date',
            field=models.DateField(
                blank=True,
                null=True,
                help_text='Expected release date for coming soon content'
            ),
        ),
        migrations.AddField(
            model_name='videocontent',
            name='approval_status',
            field=models.CharField(
                choices=[
                    ('PENDING', 'Pending Approval'),
                    ('APPROVED', 'Approved'),
                    ('REJECTED', 'Rejected'),
                    ('NEEDS_CHANGES', 'Needs Changes')
                ],
                default='APPROVED',
                help_text='Content approval status',
                max_length=20
            ),
        ),
        migrations.AddField(
            model_name='videocontent',
            name='submitted_for_approval_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='videocontent',
            name='tags',
            field=models.ManyToManyField(blank=True, related_name='videos', to='content.tag'),
        ),
        
        # Create ContentApproval model
        migrations.CreateModel(
            name='ContentApproval',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(
                    choices=[
                        ('PENDING', 'Pending Review'),
                        ('APPROVED', 'Approved'),
                        ('REJECTED', 'Rejected'),
                        ('NEEDS_CHANGES', 'Needs Changes')
                    ],
                    default='PENDING',
                    max_length=20
                )),
                ('submission_notes', models.TextField(blank=True, help_text='Notes from the content uploader')),
                ('review_notes', models.TextField(blank=True, help_text='Feedback from the reviewer')),
                ('submitted_at', models.DateTimeField(auto_now_add=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('content', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='approval_history',
                    to='content.videocontent'
                )),
                ('reviewed_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='reviewed_content',
                    to=settings.AUTH_USER_MODEL
                )),
                ('submitted_by', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='submitted_content',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'verbose_name': 'Content Approval',
                'verbose_name_plural': 'Content Approvals',
                'ordering': ['-submitted_at'],
            },
        ),
    ]
