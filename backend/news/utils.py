import re
import bleach
from django.utils.text import slugify

ALLOWED_TAGS = ['p', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'h2', 'h3', 'a', 'blockquote']
ALLOWED_ATTRIBUTES = {'a': ['href', 'title']}


def sanitize_html(html):
    if not html:
        return ''
    return bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True,
    )


def strip_html_tags(html):
    if not html:
        return ''
    return re.sub(r'<[^>]+>', ' ', html)


def compute_word_count(html):
    text = strip_html_tags(html)
    words = [w for w in text.split() if w.strip()]
    return len(words)


def unique_slug(model_class, title, instance_id=None):
    base = slugify(title) or 'story'
    slug = base
    counter = 1
    qs = model_class.objects.filter(slug=slug)
    if instance_id:
        qs = qs.exclude(pk=instance_id)
    while qs.exists():
        slug = f'{base}-{counter}'
        counter += 1
        qs = model_class.objects.filter(slug=slug)
        if instance_id:
            qs = qs.exclude(pk=instance_id)
    return slug
