

from django.core.cache import cache
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from config import settings
from users.models import User, UserProfile
from users.serializer import UserSerializer, UserLoginSerializer

import requests

import json
import logging
from datetime import date
import hashlib
from .tasks import SearchInn , SendEmail
logger = logging.getLogger(__name__)
def getkey():
    data = date.today()
    digest = hashlib.md5(f'{data}'.encode('utf-8')).hexdigest()
    return digest





class UserRegister(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        inn = serializer.validated_data['inn']
        first_name = serializer.validated_data['first_name']
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

        
        profile = UserProfile.objects.create(user=user , inn=inn)


        
        user.inn = inn
        user.phone_number = phone
        user.save()

        
        SearchInn.delay(inn,profile.id)
        SendEmail.delay(email)
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
        phone = str(user.phone_number)
        id = user.id
        email =  user.email
        first_name = user.first_name
        profile = user.userprofile_set.first()
        company = profile.company if profile else None
        return Response({'company':company , 'inn':user.inn , 'phone':phone , 'id':id , 'email':email ,'first_name': first_name  })
    

class CallBack(APIView):
    def post(self ,request):
        a = request.data
        a["type"]="CallBack"
        b = json.dumps(a , ensure_ascii=False)
        headers = {
                "Content-Type": "application/json",
                "KEY": getkey()
            }
        r = requests.get(f'https://parus.ohelp.ru/api_lk?f=callback&obj={b}' , headers=headers)

        logger.info(f'response: {r.json()}')
        
        return Response( status=200)
        

class SendEmailApi(APIView):
    def post(self , request):
        data = request.data
        data["type"]="SendSMS"
        try:
            obj_param = json.dumps(data)
            headers = {
                "Content-Type": "application/json",
                "KEY": getkey()
            }
            logger.info(obj_param)
            r = requests.get(f'https://parus.ohelp.ru/api_lk?f=callback&obj={obj_param}' , headers=headers)

            logger.info(r.json())
            return Response(status=200)

        except Exception as e : 
            logger.error(e)
            return Response(status=400)



class AddInn(APIView):
    def post(self, request):
        inn = request.data.get("inn")
        if not inn:
            return Response({"error": "ИНН обязателен"}, status=400)

        profile = UserProfile.objects.create(user=request.user, inn=inn)
        SearchInn.delay(inn, profile.id)

        return Response({"status": "ИНН добавлен", "id": profile.id}, status=201)

class SeeINN(APIView):
     def get(self, request):
         user = request.user
         profiles  = UserProfile.objects.filter(user=user ).values("inn", "company")
         return Response(list(profiles))
         

class DeleteINN(APIView):
    def delete(self , request):
        try:
            inn = request.data.get('inn')

            userinn = UserProfile.objects.filter(user=request.user,inn=inn).first()
            userinn.delete()
            return Response({'code':'200' } , status=200)
        except Exception as e:
            return Response({'error': str(e)}, status=500)



class Rename(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        name = request.data.get("name")
        try:
            user.first_name = name
            user.save(update_fields=["first_name"])
            return Response({"status": "ok", "first_name": user.first_name})
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
