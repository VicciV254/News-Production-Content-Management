from datetime import time, timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model

from news.models import NewsCategory, BroadcastSlot, NewsDeadline, NewsStory, StoryTag, StoryTagLink

User = get_user_model()

CATEGORIES = [
    ('Local', 'local', '#3B82F6', 1),
    ('National', 'national', '#8B5CF6', 2),
    ('Sport', 'sport', '#10B981', 3),
    ('Entertainment', 'entertainment', '#F59E0B', 4),
    ('Features', 'features', '#06B6D4', 5),
    ('Breaking', 'breaking', '#EF4444', 6),
]

SLOTS = [
    ('Morning News 07:00', time(7, 0), [0, 1, 2, 3, 4]),
    ('Midday Update 12:00', time(12, 0), [0, 1, 2, 3, 4]),
    ('Evening Bulletin 18:00', time(18, 0), [0, 1, 2, 3, 4, 5, 6]),
]

USERS = [
    ('journalist1', 'journalist1@example.com', 'Alex', 'Rivera', User.Role.JOURNALIST),
    ('journalist2', 'journalist2@example.com', 'Sam', 'Chen', User.Role.JOURNALIST),
    ('editor1', 'editor1@example.com', 'Jordan', 'Blake', User.Role.EDITOR),
    ('admin', 'admin@example.com', 'Admin', 'User', User.Role.ADMIN),
]


class Command(BaseCommand):
    help = 'Seed demo data for the news module'

    def handle(self, *args, **options):
        for username, email, first, last, role in USERS:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'email': email, 'first_name': first, 'last_name': last, 'role': role},
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'Created user: {username}')

        for name, slug, color, order in CATEGORIES:
            NewsCategory.objects.get_or_create(
                slug=slug,
                defaults={'name': name, 'color_hex': color, 'order': order, 'is_active': True},
            )

        for name, sched_time, days in SLOTS:
            BroadcastSlot.objects.get_or_create(
                name=name,
                defaults={'scheduled_time': sched_time, 'days_of_week': days, 'is_active': True},
            )

        admin = User.objects.get(username='admin')
        local = NewsCategory.objects.get(slug='local')
        slot = BroadcastSlot.objects.first()

        NewsDeadline.objects.get_or_create(
            category=local,
            broadcast_slot=slot,
            submission_deadline=timezone.now() + timedelta(hours=3),
            defaults={
                'is_recurring': True,
                'recurrence_days': [0, 1, 2, 3, 4],
                'created_by': admin,
            },
        )

        journalist = User.objects.get(username='journalist1')
        sport = NewsCategory.objects.get(slug='sport')

        story, created = NewsStory.objects.get_or_create(
            title='City Council Approves New Transit Hub',
            defaults={
                'journalist': journalist,
                'category': local,
                'summary': 'The city council voted unanimously to approve funding for a new downtown transit hub expected to open in 2027.',
                'body': '<p>The city council voted unanimously Tuesday to approve <strong>$45 million</strong> in funding for a new downtown transit hub.</p>'
                        '<h2>Project Timeline</h2><p>Construction is expected to begin next spring, with completion targeted for late 2027.</p>'
                        '<blockquote>Residents have waited decades for improved public transit infrastructure.</blockquote>',
                'status': NewsStory.Status.PUBLISHED,
                'published_at': timezone.now() - timedelta(days=1),
                'is_breaking': False,
            },
        )

        if created:
            tag, _ = StoryTag.objects.get_or_create(slug='transit', defaults={'name': 'Transit'})
            StoryTagLink.objects.get_or_create(story=story, tag=tag)

        breaking, created = NewsStory.objects.get_or_create(
            title='BREAKING: Major Storm Warning Issued for Coastal Region',
            defaults={
                'journalist': User.objects.get(username='journalist2'),
                'category': NewsCategory.objects.get(slug='breaking'),
                'summary': 'Meteorologists have issued a severe storm warning affecting the entire coastal region through Friday evening.',
                'body': '<p><strong>Breaking:</strong> A major storm system is approaching the coast with winds expected to exceed 80 mph.</p>'
                        '<p>Residents are urged to secure outdoor items and prepare emergency kits.</p>',
                'status': NewsStory.Status.PUBLISHED,
                'published_at': timezone.now() - timedelta(hours=2),
                'is_breaking': True,
            },
        )

        NewsStory.objects.get_or_create(
            title='Draft: Interview with Local Artist',
            defaults={
                'journalist': journalist,
                'category': NewsCategory.objects.get(slug='features'),
                'summary': 'A profile piece on emerging local artist Maya Torres and her upcoming gallery exhibition.',
                'body': '<p>Maya Torres has been painting the streets of our city for over a decade...</p>',
                'status': NewsStory.Status.DRAFT,
            },
        )

        NewsStory.objects.get_or_create(
            title='Regional Sports Roundup',
            defaults={
                'journalist': journalist,
                'category': sport,
                'summary': 'Highlights from this weekends regional championship games across all divisions.',
                'body': '<p>The weekend brought thrilling finishes across multiple sports...</p>',
                'status': NewsStory.Status.SUBMITTED,
                'submitted_at': timezone.now() - timedelta(hours=1),
            },
        )

        from news.tasks import schedule_deadline_reminders
        schedule_deadline_reminders()

        self.stdout.write(self.style.SUCCESS('Seed data created successfully.'))
        self.stdout.write('Login credentials: journalist1/password123, editor1/password123, admin/password123')
