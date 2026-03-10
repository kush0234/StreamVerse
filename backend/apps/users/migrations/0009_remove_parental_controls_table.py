# Generated migration to properly remove parental controls table

from django.db import migrations


def remove_parental_controls_data(apps, schema_editor):
    """Remove any existing parental control data before dropping the table"""
    db_alias = schema_editor.connection.alias
    
    # Try to delete all records from the parental controls table if it exists
    try:
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("DELETE FROM parental_controls_profileparentalcontrol;")
    except Exception:
        # Table might not exist, which is fine
        pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0008_profile_age_restriction'),
    ]

    operations = [
        # First, clean up any existing data
        migrations.RunPython(
            remove_parental_controls_data,
            reverse_code=migrations.RunPython.noop,
        ),
        
        # Then drop the foreign key constraint and table
        migrations.RunSQL(
            sql=[
                # Drop the foreign key constraint first
                "ALTER TABLE parental_controls_profileparentalcontrol DROP CONSTRAINT IF EXISTS parental_controls_pr_profile_id_19616630_fk_users_pro;",
                # Drop any other constraints that might exist
                "ALTER TABLE parental_controls_profileparentalcontrol DROP CONSTRAINT IF EXISTS parental_controls_profileparentalcontrol_pkey;",
                # Drop the table
                "DROP TABLE IF EXISTS parental_controls_profileparentalcontrol CASCADE;",
            ],
            reverse_sql=[
                # This is irreversible
                "SELECT 1;",
            ]
        ),
    ]