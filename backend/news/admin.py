from django.contrib import admin
from .models import (
    NewsCategory, BroadcastSlot, NewsDeadline, NewsStory,
    EditorialReview, StoryTag, StoryTagLink,
)


@admin.register(NewsCategory)
class NewsCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'color_hex', 'is_active', 'order']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(BroadcastSlot)
class BroadcastSlotAdmin(admin.ModelAdmin):
    list_display = ['name', 'scheduled_time', 'is_active']


@admin.register(NewsDeadline)
class NewsDeadlineAdmin(admin.ModelAdmin):
    list_display = ['category', 'broadcast_slot', 'submission_deadline', 'is_recurring']


@admin.register(NewsStory)
class NewsStoryAdmin(admin.ModelAdmin):
    list_display = ['title', 'journalist', 'category', 'status', 'word_count', 'is_breaking', 'is_late']
    list_filter = ['status', 'category', 'is_breaking']
    search_fields = ['title', 'summary']


@admin.register(EditorialReview)
class EditorialReviewAdmin(admin.ModelAdmin):
    list_display = ['story', 'reviewer', 'action', 'reviewed_at']


admin.site.register(StoryTag)
admin.site.register(StoryTagLink)
