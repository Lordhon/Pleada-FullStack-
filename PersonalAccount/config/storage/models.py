from django.db import models
from transliterate import translit
from django.utils.text import slugify

class ItemCompany(models.Model):
    id = models.CharField(unique=True, primary_key=True)
    name = models.CharField(unique=True)
    slug = models.SlugField(unique=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            slug_text = translit(self.name, "ru", reversed=True)
            self.slug = slugify(slug_text)
        super().save(*args, **kwargs)


class StorageItem(models.Model):
    art = models.CharField(unique=True)
    kl = models.IntegerField()
    price = models.FloatField()
    price1 = models.FloatField()
    price2 = models.FloatField()
    price3 = models.FloatField()
    name = models.CharField()
    gr = models.ForeignKey(ItemCompany, on_delete=models.CASCADE)
    publ = models.BooleanField(default=False)

