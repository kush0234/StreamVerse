from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0008_profile_age_restriction'),
    ]

    operations = [
        migrations.RunSQL(
            sql="SELECT 1;",
            reverse_sql="SELECT 1;",
        ),
    ]
