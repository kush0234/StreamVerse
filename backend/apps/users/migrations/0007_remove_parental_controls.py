# Generated migration to remove parental controls

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_alter_paymenthistory_subscription'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='profile',
            name='age_restriction',
        ),
    ]
