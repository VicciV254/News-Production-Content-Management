from django.conf import settings
from django.db import models
from django.utils import timezone

from .utils import sanitize_html, compute_word_count, unique_slug


class NewsCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    color_hex = models.CharField(max_length=7, default='#3B82F6')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'name']
        verbose_name_plural = 'news categories'

    def __str__(self):
        return self.name


class BroadcastSlot(models.Model):
    name = models.CharField(max_length=150)
    scheduled_time = models.TimeField()
    days_of_week = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['scheduled_time']

    def __str__(self):
        return self.name


class NewsDeadline(models.Model):
    category = models.ForeignKey(NewsCategory, on_delete=models.CASCADE, related_name='deadlines')
    broadcast_slot = models.ForeignKey(BroadcastSlot, on_delete=models.CASCADE, related_name='deadlines')
    submission_deadline = models.DateTimeField()
    is_recurring = models.BooleanField(default=False)
    recurrence_days = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_deadlines',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['submission_deadline']

    def __str__(self):
        return f'{self.category.name} — {self.submission_deadline}'


class StoryTag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


class NewsStory(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SUBMITTED = 'submitted', 'Submitted'
        UNDER_REVIEW = 'under_review', 'Under Review'
        CHANGES_REQUESTED = 'changes_requested', 'Changes Requested'
        APPROVED = 'approved', 'Approved'
        PUBLISHED = 'published', 'Published'
        ARCHIVED = 'archived', 'Archived'
        REJECTED = 'rejected', 'Rejected'

    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=320, unique=True, blank=True)
    journalist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='stories',
    )
    category = models.ForeignKey(NewsCategory, on_delete=models.PROTECT, related_name='stories')
    body = models.TextField(blank=True)
    summary = models.CharField(max_length=300, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    word_count = models.PositiveIntegerField(default=0)
    is_breaking = models.BooleanField(default=False)
    is_late = models.BooleanField(default=False)
    tags = models.ManyToManyField(StoryTag, through='StoryTagLink', blank=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name_plural = 'news stories'

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        self.body = sanitize_html(self.body)
        self.word_count = compute_word_count(self.body)
        if not self.slug:
            self.slug = unique_slug(NewsStory, self.title, self.pk)
        super().save(*args, **kwargs)

    def check_late_submission(self):
        if not self.submitted_at:
            return
        deadline = NewsDeadline.objects.filter(
            category=self.category,
            submission_deadline__gte=self.submitted_at - timezone.timedelta(days=7),
        ).order_by('submission_deadline').first()
        if deadline and self.submitted_at > deadline.submission_deadline:
            self.is_late = True
            NewsStory.objects.filter(pk=self.pk).update(is_late=True)


class StoryTagLink(models.Model):
    story = models.ForeignKey(NewsStory, on_delete=models.CASCADE)
    tag = models.ForeignKey(StoryTag, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['story', 'tag']


class EditorialReview(models.Model):
    class Action(models.TextChoices):
        SUBMITTED = 'submitted', 'Submitted'
        APPROVED = 'approved', 'Approved'
        CHANGES_REQUESTED = 'changes_requested', 'Changes Requested'
        REJECTED = 'rejected', 'Rejected'
        PUBLISHED = 'published', 'Published'
        ARCHIVED = 'archived', 'Archived'

    story = models.ForeignKey(NewsStory, on_delete=models.CASCADE, related_name='reviews')
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reviews_given',
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    comment = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-reviewed_at']

    def __str__(self):
        return f'{self.story.title} — {self.action}'
