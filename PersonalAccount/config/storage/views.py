import logging
import os
import random


from rest_framework import status

from rest_framework.response import Response
from datetime import date
import hashlib
from rest_framework.views import APIView
import json

import requests

from config import settings
from storage.models import ItemCompany, StorageItem
from storage.serializer import StorageItemSerializer, OrderSerializer
from django.core.cache import cache


def getkey():
    data = date.today()
    digest = hashlib.md5(f'{data}'.encode('utf-8')).hexdigest()
    return digest

token = os.getenv('API_PHONE_SEND')
logger = logging.getLogger(__name__)

class StorageView(APIView):
    def get(self, request , slug):
        try :
            company = ItemCompany.objects.get(slug=slug)
        except ItemCompany.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        items = StorageItem.objects.filter(gr=company)
        serializer = StorageItemSerializer(items, many=True)
        return Response(serializer.data)


def generate_token(phone):
    code = f"{random.randint(0, 999999):06d}"

    cache.set(f"phone:code:{phone}", code, timeout=settings.REDIS_TTL)
    return code


class Order(APIView):
    def post(self, request):
        user = request.user if request.user.is_authenticated else None
        cart = request.data.get('cart')
        phone = request.data.get('phone') if not user else getattr(user, 'phone_number', None)
        code_from_client = request.data.get('code')

        if user:
            if not phone:
                return Response({"error": "User phone not set"}, status=status.HTTP_400_BAD_REQUEST)
            if not cart:
                return Response({"error": "cart is required"}, status=status.HTTP_400_BAD_REQUEST)


            logger.info(f"Order from authenticated user {user.id}: {cart}")
            return Response({"status": "ok","phone": str(phone),"authenticated": True,"skip_verification": True}, status=status.HTTP_200_OK)


        if not phone or not cart:
            return Response({"error": "Phone and cart are required"}, status=status.HTTP_400_BAD_REQUEST)

        true_code = cache.get(f"phone:code:{phone}")

        if not code_from_client:

            code = generate_token(phone)
            cache.set(f"phone:code:{phone}", code, timeout=1000)
            payload = {
                "messages": [{"recipient": str(phone), "text": f"Код для подтверждения номера телефона: {code}"}]
            }
            headers = {"X-Token": token, "Content-Type": "application/json"}

            try:
                response = requests.post(
                    'https://lcab.smsprofi.ru/json/v1.0/sms/send/text',
                    headers=headers,
                    data=json.dumps(payload),

                )
            except requests.exceptions.RequestException as e:
                logger.error(f"Network error sending SMS: {str(e)}")
                return Response({"error": "Failed to send SMS"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            logger.info(f"SMS sent to guest {phone}: {response.text}")
            return Response({"status": "ok","phone": str(phone),"authenticated": False,"verification_required": True,"message": "Code sent"}, status=status.HTTP_200_OK)


        if not true_code:
            return Response({"error": "Code expired or not found"}, status=status.HTTP_400_BAD_REQUEST)
        if code_from_client != true_code:
            return Response({"error": "Invalid code"}, status=status.HTTP_400_BAD_REQUEST)


        logger.info(f"Order from guest user {phone}: {cart} | verified successfully")
        cache.delete(f"phone:code:{phone}")


        return Response({"status": "ok","phone": str(phone),"authenticated": False,"verification_required": False}, status=status.HTTP_200_OK)



class OrderLine(APIView):
    def post(self,request):
        data = request.data 
        obj_param = json.dumps(data)
        url = f"https://parus.ohelp.ru/api_lk?f=newapp&obj={obj_param}"
        headers = {
            "Content-Type": "application/json",
            "KEY": getkey()
        }
        response = requests.post(url,headers=headers)
        logger.info(response.text)
        return Response(response.text or "", status=response.status_code)

        
        

    
    


















