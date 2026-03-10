# Generated migration for Cloudinary video fields

import cloudinary.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('content', '0006_alter_music_audio_file_alter_music_thumbnail'),
    ]

    operations = [
        migrations.AddField(
            model_name='episode',
            name='description',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='episode',
            name='thumbnail',
            field=cloudinary.models.CloudinaryField(blank=True, max_length=255, null=True, verbose_name='image'),
        ),
        migrations.AddField(
            model_name='videocontent',
            name='trailer_url',
            field=cloudinary.models.CloudinaryField(blank=True, max_length=255, null=True, verbose_name='video'),
        ),
        migrations.AlterField(
            model_name='episode',
            name='video_url',
            field=cloudinary.models.CloudinaryField(blank=True, max_length=255, null=True, verbose_name='video'),
        ),
        migrations.AlterField(
            model_name='videocontent',
            name='thumbnail',
            field=cloudinary.models.CloudinaryField(blank=True, max_length=255, null=True, verbose_name='image'),
        ),
        migrations.AlterField(
            model_name='videocontent',
            name='video_url',
            field=cloudinary.models.CloudinaryField(blank=True, max_length=255, null=True, verbose_name='video'),
        ),
    ]
