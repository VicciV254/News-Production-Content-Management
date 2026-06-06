from django.utils import timezone
from django.utils.text import slugify
from rest_framework import serializers

from accounts.models import User
from accounts.serializers import UserSerializer
from .models import (
    NewsCategory, BroadcastSlot, NewsDeadline, NewsStory,
    EditorialReview, StoryTag, StoryTagLink,
)
from .utils import sanitize_html


class NewsCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsCategory
        fields = ['id', 'name', 'slug', 'color_hex', 'description', 'is_active', 'order']


class BroadcastSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = BroadcastSlot
        fields = ['id', 'name', 'scheduled_time', 'days_of_week', 'is_active']


class NewsDeadlineSerializer(serializers.ModelSerializer):
    category = NewsCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=NewsCategory.objects.all(),
        source='category',
        write_only=True,
    )
    broadcast_slot = BroadcastSlotSerializer(read_only=True)
    broadcast_slot_id = serializers.PrimaryKeyRelatedField(
        queryset=BroadcastSlot.objects.all(),
        source='broadcast_slot',
        write_only=True,
    )
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = NewsDeadline
        fields = [
            'id', 'category', 'category_id', 'broadcast_slot', 'broadcast_slot_id',
            'submission_deadline', 'is_recurring', 'recurrence_days', 'created_by', 'created_at',
        ]
        read_only_fields = ['created_by', 'created_at']


class StoryTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoryTag
        fields = ['id', 'name', 'slug']


class EditorialReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)

    class Meta:
        model = EditorialReview
        fields = ['id', 'story', 'reviewer', 'action', 'comment', 'reviewed_at']
        read_only_fields = ['reviewer', 'reviewed_at']


class NewsStoryListSerializer(serializers.ModelSerializer):
    category = NewsCategorySerializer(read_only=True)
    journalist = UserSerializer(read_only=True)
    tags = StoryTagSerializer(many=True, read_only=True)
    reviewer_initials = serializers.SerializerMethodField()
    latest_review_comment = serializers.SerializerMethodField()

    class Meta:
        model = NewsStory
        fields = [
            'id', 'title', 'slug', 'journalist', 'category', 'summary', 'status',
            'created_at', 'updated_at', 'submitted_at', 'published_at', 'word_count',
            'is_breaking', 'is_late', 'tags', 'reviewer_initials', 'latest_review_comment',
        ]

    def get_reviewer_initials(self, obj):
        if obj.status not in (NewsStory.Status.UNDER_REVIEW, NewsStory.Status.SUBMITTED):
            return None
        review = obj.reviews.first()
        if review and review.reviewer:
            return review.reviewer.get_initials()
        return None

    def get_latest_review_comment(self, obj):
        if obj.status != NewsStory.Status.CHANGES_REQUESTED:
            return None
        review = obj.reviews.filter(action=EditorialReview.Action.CHANGES_REQUESTED).first()
        return review.comment if review else None


class NewsStoryDetailSerializer(NewsStoryListSerializer):
    body = serializers.CharField()
    editorial_note = serializers.SerializerMethodField()

    class Meta(NewsStoryListSerializer.Meta):
        fields = NewsStoryListSerializer.Meta.fields + ['body', 'editorial_note']

    def get_editorial_note(self, obj):
        review = obj.reviews.first()
        if review and obj.status in (
            NewsStory.Status.CHANGES_REQUESTED,
            NewsStory.Status.REJECTED,
            NewsStory.Status.UNDER_REVIEW,
        ):
            return {
                'action': review.action,
                'comment': review.comment,
                'reviewer': UserSerializer(review.reviewer).data if review.reviewer else None,
                'reviewed_at': review.reviewed_at,
            }
        return None


class NewsStoryWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=NewsCategory.objects.filter(is_active=True),
        source='category',
    )
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        write_only=True,
    )
    tags = StoryTagSerializer(many=True, read_only=True)

    class Meta:
        model = NewsStory
        fields = [
            'id', 'title', 'category_id', 'body', 'summary', 'is_breaking',
            'tag_names', 'tags', 'status', 'word_count', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'word_count', 'updated_at']

    def validate_body(self, value):
        return sanitize_html(value)

    def validate_summary(self, value):
        if len(value) > 300:
            raise serializers.ValidationError('Summary must be 300 characters or fewer.')
        return value

    def _set_tags(self, story, tag_names):
        StoryTagLink.objects.filter(story=story).delete()
        for name in tag_names:
            name = name.strip()
            if not name:
                continue
            tag, _ = StoryTag.objects.get_or_create(
                slug=slugify(name) or 'tag',
                defaults={'name': name},
            )
            StoryTagLink.objects.get_or_create(story=story, tag=tag)

    def create(self, validated_data):
        tag_names = validated_data.pop('tag_names', [])
        validated_data['journalist'] = self.context['request'].user
        validated_data['status'] = NewsStory.Status.DRAFT
        story = super().create(validated_data)
        self._set_tags(story, tag_names)
        return story

    def update(self, instance, validated_data):
        tag_names = validated_data.pop('tag_names', None)
        story = super().update(instance, validated_data)
        if tag_names is not None:
            self._set_tags(story, tag_names)
        return story


class ReviewActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=EditorialReview.Action.choices)
    comment = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        action = data['action']
        comment = data.get('comment', '')
        if action in (
            EditorialReview.Action.CHANGES_REQUESTED,
            EditorialReview.Action.REJECTED,
        ) and not comment.strip():
            raise serializers.ValidationError({'comment': 'Comment is required for this action.'})
        return data

    def create(self, validated_data):
        story = self.context['story']
        reviewer = self.context['request'].user
        action = validated_data['action']

        if story.status == NewsStory.Status.SUBMITTED:
            NewsStory.objects.filter(pk=story.pk).update(
                status=NewsStory.Status.UNDER_REVIEW,
            )

        return EditorialReview.objects.create(
            story=story,
            reviewer=reviewer,
            action=action,
            comment=validated_data.get('comment', ''),
        )


class PublicStorySerializer(serializers.ModelSerializer):
    category = NewsCategorySerializer(read_only=True)
    journalist_name = serializers.SerializerMethodField()
    tags = StoryTagSerializer(many=True, read_only=True)

    class Meta:
        model = NewsStory
        fields = [
            'id', 'title', 'slug', 'summary', 'body', 'category', 'journalist_name',
            'published_at', 'word_count', 'is_breaking', 'tags',
        ]

    def get_journalist_name(self, obj):
        return obj.journalist.get_full_name() or obj.journalist.username

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['body'] = sanitize_html(data.get('body', ''))
        return data
