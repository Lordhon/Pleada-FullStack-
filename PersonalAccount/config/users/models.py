from django.contrib.auth.base_user import BaseUserManager, AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email обязателен")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True )
    inn =  models.CharField(max_length=12 , blank=True, null=True)
    objects = UserManager()
    first_name = models.CharField(max_length=100, null=True, blank=True)
    phone_number = PhoneNumberField(unique=True )
    is_active = models.BooleanField(default=False)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []



class UserProfile(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    inn = models.CharField(max_length=12 , blank=True, null=True)
    company = models.CharField()







