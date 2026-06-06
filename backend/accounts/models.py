from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        JOURNALIST = 'journalist', 'Journalist'
        EDITOR = 'editor', 'Editor'
        ADMIN = 'admin', 'Admin'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.JOURNALIST,
    )

    @property
    def is_editor(self):
        return self.role in (self.Role.EDITOR, self.Role.ADMIN)

    @property
    def is_journalist(self):
        return self.role == self.Role.JOURNALIST

    def get_initials(self):
        parts = (self.get_full_name() or self.username).split()
        if len(parts) >= 2:
            return (parts[0][0] + parts[-1][0]).upper()
        return (parts[0][:2] if parts else self.username[:2]).upper()
