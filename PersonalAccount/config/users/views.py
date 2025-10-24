
import random
from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
import uuid
from config import settings
from users.models import User, UserProfile
from users.serializer import UserSerializer, UserLoginSerializer
from dadata import Dadata
import requests
import os
import json
import logging

logger = logging.getLogger(__name__)

def generate_token(email):
    code = f"{random.randint(0, 999999):06d}"
    token = str(uuid.uuid4())
    cache.set(f"email:code:{email}", code, timeout=settings.REDIS_TTL)
    cache.set(f"email:token:{token}", email, timeout=settings.REDIS_TTL)
    return code , token


class UserRegister(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        inn = serializer.validated_data['inn']
        phone = serializer.validated_data.get('phone_number', '')

        
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            if existing_user.is_active:
                return Response(
                    {'error': 'Пользователь с этим email уже зарегистрирован'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            existing_user.delete()

        
        user = serializer.save(is_active=False)

        
        profile = UserProfile.objects.create(user=user)

        
        user.inn = inn
        user.phone_number = phone
        user.save()

        
        try:
            dadata = Dadata(os.getenv("DADATA_API_KEY"))
            result = dadata.find_by_id("party", inn)
            profile.company = result[0]['value'] if result else ''
            profile.save()
        except Exception as e:
            logger.error(f"Dadata error: {e}")

        
        code, token = generate_token(email)
        link = f"https://zpnn.ru/activate?token={token}"

        
        send_mail(
            'Активация Аккаунта',
            f'Перейди по ссылке для активации:\n{link} или введите код {code}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False
        )

        return Response({'message': 'Код активации отправлен на почту'}, status=status.HTTP_201_CREATED)


class UserLogin(APIView):
    def post(self, request ):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)


        recaptcha_token = request.data.get('recaptcha')
        a = {"secret": settings.RECAPTCHA_SECRET_KEY , 'response': recaptcha_token}
        r = requests.post("https://www.google.com/recaptcha/api/siteverify", data=a)
        jr = r.json()
        if not jr.get("success"):
            return Response({'error':'Неверная капча'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=serializer.validated_data['email'])
        except User.DoesNotExist:
            return Response( status=status.HTTP_404_NOT_FOUND)

        if not user.check_password(serializer.validated_data['password']):
            return Response({'error': 'Неправильный email или пароль'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'Пользователь не активен'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response({'refresh': str(refresh),'access': str(refresh.access_token)}, status=status.HTTP_200_OK)



class ActivateUserCode(APIView):
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        if not email or not code:
            return Response({"detail": "Email и код обязательны"}, status=status.HTTP_400_BAD_REQUEST)


        true_code = cache.get(f"email:code:{email}")
        if true_code != str(code):
            return Response({'error':'Неверный код'}  , status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.get(email=email)
        user.is_active = True
        user.save()
        cache.delete(f"email:code:{email}")
        return Response({'message':'аккаунт активирован'} , status=status.HTTP_200_OK)



class ActivateUserLink(APIView):
    def get(self, request , token):
        email = cache.get(f"email:token:{token}")

        if not email:
            return Response({'error':'Срок действия ссылки закончен'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            cache.delete(f"email:token:{token}")
            cache.delete(f"email:code:{email}")
            return Response({'error':'Пользователь не найден'})
        user.is_active = True
        user.save()

        cache.delete(f"email:token:{token}")
        cache.delete(f"email:code:{email}")
        return Response({'message':'Аккаунт активирован'})



class VerifyJWTToken(APIView):
    permission_classes = [IsAuthenticated]
    def get(self , request ):
        return Response({'message':'ok'} , status=status.HTTP_200_OK)

class MeApiView(APIView):
    permission_classes = [IsAuthenticated]
    def get (self ,request):
        user = request.user
        company = user.userprofile.company
        return Response({'company':company})
    

class CallBack(APIView):
    def post(self ,request):
        a = request.data
        b = json.dumps(a)
        logger.info(f'телефон: {b}')
        return Response(status=200)
        

        
    