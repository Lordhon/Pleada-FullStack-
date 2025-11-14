from django.contrib import admin
from django.urls import path

from storage.views import StorageView, Order , OrderLine, SearchItem , HelpSearchItem , HistoryOrder
from users.views import UserRegister, UserLogin, ActivateUserCode, ActivateUserLink , VerifyJWTToken , MeApiView ,  CallBack , SendEmailApi

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
    path('api/me/' , MeApiView.as_view()),
    path('api/search/' , SearchItem.as_view()),
    path('api/callback/' , CallBack.as_view()),
    path('api/search-help/' , HelpSearchItem.as_view()),
    path('api/email-send/' , SendEmailApi.as_view()),
    path('api/history-orders/' , HistoryOrder.as_view()),

    

    






]
