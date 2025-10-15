from django.contrib import admin
from django.urls import path

from storage.views import StorageView, Order , OrderLine
from users.views import UserRegister, UserLogin, ActivateUserCode, ActivateUserLink , VerifyJWTToken

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/' , UserRegister.as_view() ),
    path('api/login/', UserLogin.as_view()),
    path('api/account/activate-code/' , ActivateUserCode.as_view() ),
    path('api/activate/<str:token>/', ActivateUserLink.as_view()),
    path('api/catalog/<slug:slug>/' , StorageView.as_view() ),
    path('api/order/', Order.as_view()),
    path('api/verify/' , VerifyJWTToken.as_view()),
    path('api/order-line/' , OrderLine.as_view()),





]
