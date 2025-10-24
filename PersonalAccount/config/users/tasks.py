from celery import shared_task
from users.models import User


@shared_task
def delete_user():
    deluser = User.objects.filter(is_active=False)
    deluser.delete()