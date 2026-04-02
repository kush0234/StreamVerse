from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Fix missing token_blacklist tables by running migrations directly'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'token_blacklist_outstandingtoken'
                );
            """)
            exists = cursor.fetchone()[0]

            if not exists:
                self.stdout.write('Tables missing — deleting stale migration records...')
                cursor.execute("DELETE FROM django_migrations WHERE app = 'token_blacklist';")
                # Drop any partial tables that may exist
                cursor.execute("DROP TABLE IF EXISTS token_blacklist_blacklistedtoken CASCADE;")
                cursor.execute("DROP TABLE IF EXISTS token_blacklist_outstandingtoken CASCADE;")
                self.stdout.write(self.style.SUCCESS('Cleared. migrate will recreate them.'))
            else:
                self.stdout.write(self.style.SUCCESS('Tables exist, nothing to do.'))
