from celery import shared_task
from users.models import User
from dadata import Dadata
import os
from django.core.cache import cache
from django.core.mail import send_mail
import logging
import random
import uuid
from rest_framework import status
from config import settings
from rest_framework.response import Response
from users.models import  UserProfile
logger = logging.getLogger(__name__)
@shared_task
def delete_user():
    deluser = User.objects.filter(is_active=False)
    deluser.delete()





@shared_task
def SearchInn(inn  , profile_id):
    api_dadata=os.getenv("DADATA_API_KEY")
    logger.info(api_dadata)
    try:
        dadata = Dadata(api_dadata)
        result = dadata.find_by_id("party", inn)
        profile = UserProfile.objects.get(id =profile_id)
        company_name = result[0]['value'] if result else ''
        profile.company = company_name
        profile.save()
        profile.save()
        return result
    except Exception as e:
        logger.error(f"Dadata error: {e}")


@shared_task
def SendEmail(email):
    def generate_token(email):
        code = f"{random.randint(0, 999999):06d}"
        token = str(uuid.uuid4())
        cache.set(f"email:code:{email}", code, timeout=settings.REDIS_TTL)
        cache.set(f"email:token:{token}", email, timeout=settings.REDIS_TTL)
        return code , token


    code, token = generate_token(email)
    link = f"https://zpnn.ru/activate?token={token}"

        
    send_mail(
        'Активация Аккаунта',
        f'Перейди по ссылке для активации:\n{link} или введите код {code}',
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False
        )

    


        
 


