from datetime import datetime

from django.db.models import Avg, Count, F, ExpressionWrapper, DurationField, Q
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from .models import NewsCategory, NewsDeadline, NewsStory, EditorialReview, BroadcastSlot
from .permissions import IsEditorOrAdmin, IsAdmin, IsStoryOwnerOrEditor, CanEditStory, CanDeleteStory
from .serializers import (
    NewsCategorySerializer, NewsDeadlineSerializer, NewsStoryListSerializer,
    NewsStoryDetailSerializer, NewsStoryWriteSerializer, EditorialReviewSerializer,
    ReviewActionSerializer, PublicStorySerializer,
)


class FeedPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 50


class EditorPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class PublicFeedView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PublicStorySerializer
    pagination_class = FeedPagination

    def get_queryset(self):
        qs = NewsStory.objects.filter(status=NewsStory.Status.PUBLISHED).select_related(
            'category', 'journalist'
        ).prefetch_related('tags')

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__slug=category)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(summary__icontains=search) | Q(body__icontains=search)
            )

        date_from = self.request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(published_at__date__gte=date_from)

        date_to = self.request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(published_at__date__lte=date_to)

        return qs.order_by('-published_at')


class PublicStoryDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = PublicStorySerializer
    lookup_field = 'slug'
    queryset = NewsStory.objects.filter(status=NewsStory.Status.PUBLISHED)


class CategoryListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = NewsCategorySerializer
    queryset = NewsCategory.objects.filter(is_active=True)
    pagination_class = None


class NewsStoryViewSet(viewsets.ModelViewSet):
    pagination_class = EditorPagination

    def get_queryset(self):
        user = self.request.user
        qs = NewsStory.objects.select_related('category', 'journalist').prefetch_related('tags', 'reviews')

        if user.role == User.Role.JOURNALIST:
            qs = qs.filter(journalist=user)
        elif user.role == User.Role.EDITOR:
            qs = qs.exclude(status=NewsStory.Status.DRAFT)
        elif user.role not in (User.Role.EDITOR, User.Role.ADMIN):
            return NewsStory.objects.none()

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category_id=category)

        journalist = self.request.query_params.get('journalist')
        if journalist:
            qs = qs.filter(journalist_id=journalist)

        tag = self.request.query_params.get('tag')
        if tag:
            qs = qs.filter(tags__name=tag)

        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(created_at__date=date)

        sort = self.request.query_params.get('sort', '-updated_at')
        allowed = ['updated_at', '-updated_at', 'submitted_at', '-submitted_at', 'title', '-title']
        if sort in allowed:
            qs = qs.order_by(sort)

        return qs

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return NewsStoryWriteSerializer
        if self.action == 'retrieve':
            return NewsStoryDetailSerializer
        return NewsStoryListSerializer

    def get_permissions(self):
        if self.action in ('list', 'create'):
            return [IsAuthenticated()]
        if self.action in ('update', 'partial_update'):
            return [IsAuthenticated(), CanEditStory()]
        if self.action == 'destroy':
            return [IsAuthenticated(), CanDeleteStory()]
        return [IsAuthenticated(), IsStoryOwnerOrEditor()]

    def perform_create(self, serializer):
        serializer.save(journalist=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        story = self.get_object()
        if story.journalist_id != request.user.id and request.user.role not in (
            User.Role.EDITOR, User.Role.ADMIN
        ):
            return Response({'detail': 'Not permitted.'}, status=status.HTTP_403_FORBIDDEN)

        if story.status not in (
            NewsStory.Status.DRAFT,
            NewsStory.Status.CHANGES_REQUESTED,
        ):
            return Response(
                {'detail': 'Only draft or changes-requested stories can be submitted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        story.status = NewsStory.Status.SUBMITTED
        story.submitted_at = timezone.now()
        story.save()
        return Response({'detail': 'Story submitted for review.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsEditorOrAdmin])
    def start_review(self, request, pk=None):
        story = self.get_object()
        if story.status != NewsStory.Status.SUBMITTED:
            return Response(
                {'detail': 'Only submitted stories can be put under review.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        story.status = NewsStory.Status.UNDER_REVIEW
        story.save()
        return Response({'detail': 'Story is now under review.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsEditorOrAdmin])
    def stop_review(self, request, pk=None):
        story = self.get_object()
        if story.status != NewsStory.Status.UNDER_REVIEW:
            return Response(
                {'detail': 'Only under-review stories can be stopped from reviewing.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        story.status = NewsStory.Status.SUBMITTED
        story.save()
        return Response({'detail': 'Review stopped. Story is back in submitted queue.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsEditorOrAdmin])
    def review(self, request, pk=None):
        story = self.get_object()
        if story.status not in (
            NewsStory.Status.SUBMITTED,
            NewsStory.Status.UNDER_REVIEW,
            NewsStory.Status.APPROVED,
        ):
            return Response(
                {'detail': 'Story is not in a reviewable state.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReviewActionSerializer(
            data=request.data,
            context={'request': request, 'story': story},
        )
        serializer.is_valid(raise_exception=True)
        review = serializer.save()

        if review.action == EditorialReview.Action.APPROVED:
            story.refresh_from_db()

        return Response(EditorialReviewSerializer(review).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        story = self.get_object()
        reviews = story.reviews.select_related('reviewer').all()
        return Response(EditorialReviewSerializer(reviews, many=True).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def publish(self, request, pk=None):
        story = self.get_object()
        if story.status != NewsStory.Status.APPROVED:
            return Response(
                {'detail': 'Only approved stories can be published.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if story.journalist_id != request.user.id and request.user.role not in (
            User.Role.EDITOR, User.Role.ADMIN
        ):
            return Response({'detail': 'Not permitted.'}, status=status.HTTP_403_FORBIDDEN)

        story.status = NewsStory.Status.PUBLISHED
        story.published_at = timezone.now()
        story.save(update_fields=['status', 'published_at', 'updated_at'])

        EditorialReview.objects.create(
            story=story,
            reviewer=request.user,
            action=EditorialReview.Action.PUBLISHED,
            comment=request.data.get('comment', 'Published to news feed'),
        )

        return Response(NewsStoryDetailSerializer(story, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        story = self.get_object()
        if request.user.role not in (User.Role.EDITOR, User.Role.ADMIN):
            if story.journalist_id != request.user.id:
                return Response({'detail': 'Not permitted.'}, status=status.HTTP_403_FORBIDDEN)

        story.status = NewsStory.Status.ARCHIVED
        story.save(update_fields=['status', 'updated_at'])

        EditorialReview.objects.create(
            story=story,
            reviewer=request.user,
            action=EditorialReview.Action.ARCHIVED,
            comment=request.data.get('comment', 'Archived'),
        )

        return Response(NewsStoryDetailSerializer(story, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsEditorOrAdmin])
    def unpublish(self, request, pk=None):
        story = self.get_object()
        if story.status != NewsStory.Status.PUBLISHED:
            return Response(
                {'detail': 'Only published stories can be unpublished.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        story.status = NewsStory.Status.UNDER_REVIEW
        story.save(update_fields=['status', 'updated_at'])

        EditorialReview.objects.create(
            story=story,
            reviewer=request.user,
            action=EditorialReview.Action.CHANGES_REQUESTED,
            comment=request.data.get('comment', 'Unpublished and sent back to review'),
        )

        return Response({'detail': 'Story unpublished and sent back to review.'})


class DeadlineListCreateView(generics.ListCreateAPIView):
    serializer_class = NewsDeadlineSerializer
    pagination_class = None

    def get_queryset(self):
        return NewsDeadline.objects.filter(
            submission_deadline__gte=timezone.now()
        ).select_related('category', 'broadcast_slot', 'created_by').order_by('submission_deadline')

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class NewsReportsView(APIView):
    permission_classes = [IsAuthenticated, IsEditorOrAdmin]

    def get(self, request):
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        journalist = request.query_params.get('journalist')
        tag = request.query_params.get('tag')
        is_breaking = request.query_params.get('is_breaking')
        category_id = request.query_params.get('category_id')

        base_qs = NewsStory.objects.filter(status=NewsStory.Status.PUBLISHED, published_at__gte=month_start)

        # Get all journalists
        all_journalists = User.objects.filter(role=User.Role.JOURNALIST)

        # Build detailed journalist data with their stories
        journalist_data = []
        for journalist_obj in all_journalists:
            journalist_stories = base_qs.filter(journalist=journalist_obj).select_related('category').prefetch_related('tags')

            stories_list = []
            for story in journalist_stories:
                stories_list.append({
                    'id': story.id,
                    'title': story.title,
                    'category': story.category.name if story.category else 'None',
                    'tags': [tag.name for tag in story.tags.all()],
                    'published_at': story.published_at.strftime('%Y-%m-%d %H:%M') if story.published_at else 'None',
                    'is_breaking': story.is_breaking,
                })

            journalist_data.append({
                'username': journalist_obj.username,
                'name': f"{journalist_obj.first_name} {journalist_obj.last_name}".strip() or journalist_obj.username,
                'count': len(stories_list),
                'stories': stories_list,
            })

        # Apply filters for the main query
        if journalist:
            base_qs = base_qs.filter(journalist__username=journalist)
        if tag:
            base_qs = base_qs.filter(tags__name=tag)
        if is_breaking:
            base_qs = base_qs.filter(is_breaking=True)
        if category_id:
            base_qs = base_qs.filter(category_id=category_id)

        total_count = base_qs.count()

        return Response({
            'journalist_data': journalist_data,
            'total_count': total_count,
            'period': month_start.strftime('%B %Y'),
        })
