
import requests
from celery import shared_task
from .models import StorageItem, ItemCompany
from datetime import date
import hashlib

def key():
    data = date.today()
    digest = hashlib.md5(f'{data}'.encode('utf-8')).hexdigest()
    return digest

@shared_task
def fetch_and_update_storage():
    response = requests.get(
        "https://parus.ohelp.ru/api_lk?f=sklad",
        headers={"KEY": key()}
    )


    data_company = response.json().get("list_gr", [])
    data_items = response.json().get("list", [])

   
    group_publ_map = {}
    for item in data_company:
        company_id = item["id"]
        name = item["nm"]
        publ = item.get("publ")

        obj, created = ItemCompany.objects.get_or_create(
            id=company_id,
            defaults={"name": name},
        )

        
        if not created and obj.name != name:
            obj.name = name
            obj.save()

        group_publ_map[company_id] = bool(publ)


    for item in data_items:
        art = item["art"]
        kl = int(item["kl"])
        price = item["price"]
        price1 = item["price1"]
        price2 = item["price2"]
        price3 = item["price3"]
        name = item["nm"]
        gr = item["gr"]
        gr_obj = ItemCompany.objects.get(id=gr)
        is_published = bool(group_publ_map.get(gr, False))
        obj, created = StorageItem.objects.get_or_create(
            art=art,
            defaults={
                'kl': kl,
                'price': price,
                'price1': price1,
                'price2': price2,
                'price3': price3,
                'name': name,
                'gr': gr_obj,
                'publ': is_published,
            },
        )

        updated = False

        if not created:
            if obj.kl != kl:

                obj.kl = kl
                updated = True

            if obj.price != price:

                obj.price = price
                updated = True

            if obj.price1 != price1:

                obj.price1 = price1
                updated = True
            if obj.price2 != price2:

                obj.price2 = price2
                updated = True
            if obj.price3 != price3:

                obj.price3 = price3
                updated = True

            if obj.name != name:

                obj.name = name
                updated = True

            if obj.gr != gr_obj:
                obj.gr = gr_obj
                updated = True

            if obj.publ != is_published:
                obj.publ = is_published
                updated = True

            if updated:
                obj.save()



