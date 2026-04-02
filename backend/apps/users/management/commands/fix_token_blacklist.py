from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Fix missing token_blacklist tables by running migrations directly'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Check if table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'token_blacklist_outstandingtoken'
                );
            """)
            exists = cursor.fetchone()[0]

            if not exists:
                self.stdout.write('Table missing — deleting stale migration records...')
                cursor.execute("""
                    DELETE FROM django_migrations WHERE app = 'token_blacklist';
                """)
                self.stdout.write(self.style.SUCCESS('Cleared. Running migrations now...'))
            else:
                self.stdout.write(self.style.SUCCESS('Table already exists, nothing to do.'))
