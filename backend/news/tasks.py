from datetime import timedelta

from background_task import background
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

from .models import NewsDeadline, NewsStory

User = get_user_model()


@background(schedule=60)
def send_deadline_reminders():
    """Send reminder emails 1 hour before each upcoming deadline."""
    now = timezone.now()
    window_start = now + timedelta(hours=1)
    window_end = now + timedelta(hours=1, minutes=5)

    deadlines = NewsDeadline.objects.filter(
        submission_deadline__gte=window_start,
        submission_deadline__lt=window_end,
    ).select_related('category')

    journalists = User.objects.filter(role=User.Role.JOURNALIST, is_active=True)

    for deadline in deadlines:
        for journalist in journalists:
            has_draft = NewsStory.objects.filter(
                journalist=journalist,
                category=deadline.category,
                status__in=[
                    NewsStory.Status.DRAFT,
                    NewsStory.Status.CHANGES_REQUESTED,
                ],
            ).exists()
            if has_draft:
                send_mail(
                    f"Deadline reminder: {deadline.category.name}",
                    f"Deadline for {deadline.category.name} stories is in 1 hour — submit now.",
                    settings.DEFAULT_FROM_EMAIL,
                    [journalist.email or f'{journalist.username}@broadcast-media.local'],
                    fail_silently=True,
                )

    send_deadline_reminders(schedule=300)


def schedule_deadline_reminders():
    send_deadline_reminders(schedule=0)
