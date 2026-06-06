from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings

from .models import NewsStory, EditorialReview


def send_story_email(subject, message, recipient_email):
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [recipient_email],
        fail_silently=True,
    )


@receiver(post_save, sender=NewsStory)
def handle_story_submission(sender, instance, created, **kwargs):
    update_fields = kwargs.get('update_fields')
    if update_fields is not None and 'submitted_at' not in update_fields:
        return
    if instance.status == NewsStory.Status.SUBMITTED and instance.submitted_at:
        journalist = instance.journalist
        send_story_email(
            f"Story submitted: {instance.title}",
            f"Your story '{instance.title}' has been submitted for editorial review.",
            journalist.email or f'{journalist.username}@broadcast-media.local',
        )


@receiver(post_save, sender=EditorialReview)
def handle_editorial_review(sender, instance, created, **kwargs):
    if not created:
        return

    story = instance.story
    journalist = story.journalist
    email = journalist.email or f'{journalist.username}@broadcast-media.local'

    if instance.action == EditorialReview.Action.APPROVED:
        story.status = NewsStory.Status.APPROVED
        story.save(update_fields=['status', 'updated_at'])
        send_story_email(
            f"Story approved: {story.title}",
            "Your story has been approved and is ready for publishing.",
            email,
        )
    elif instance.action == EditorialReview.Action.CHANGES_REQUESTED:
        story.status = NewsStory.Status.CHANGES_REQUESTED
        story.save(update_fields=['status', 'updated_at'])
        send_story_email(
            f"Changes requested: {story.title}",
            f"Changes have been requested on your story '{story.title}'.\n\n"
            f"Reviewer comment:\n{instance.comment}",
            email,
        )
    elif instance.action == EditorialReview.Action.REJECTED:
        story.status = NewsStory.Status.REJECTED
        story.save(update_fields=['status', 'updated_at'])
        send_story_email(
            f"Story rejected: {story.title}",
            f"Your story '{story.title}' has been rejected.\n\n"
            f"Reviewer comment:\n{instance.comment}",
            email,
        )
    elif instance.action == EditorialReview.Action.PUBLISHED:
        from django.utils import timezone
        story.status = NewsStory.Status.PUBLISHED
        story.published_at = timezone.now()
        story.save(update_fields=['status', 'published_at', 'updated_at'])
    elif instance.action == EditorialReview.Action.ARCHIVED:
        story.status = NewsStory.Status.ARCHIVED
        story.save(update_fields=['status', 'updated_at'])
