import requests
import hashlib
import logging
from datetime import date

from celery import shared_task
from django.db import IntegrityError, transaction

from .models import StorageItem, ItemCompany

logger = logging.getLogger(__name__)


def key():
    return hashlib.md5(str(date.today()).encode("utf-8")).hexdigest()


@shared_task(bind=True, autoretry_for=(Exception,), retry_kwargs={"max_retries": 3, "countdown": 5})
def fetch_and_update_storage(self):
    response = requests.get(
        "https://parus.ohelp.ru/api_lk?f=sklad",
        headers={"KEY": key()},
        timeout=15,
    )
    response.raise_for_status()

    payload = response.json()
    data_company = payload.get("list_gr", [])
    data_items = payload.get("list", [])

    
    group_publ_map = {}

    for item in data_company:
        company_id = item.get("id")
        name = item.get("nm")
        publ = bool(item.get("publ", False))

        if company_id is None or not name:
            continue

        
        company_id_str = str(company_id)
    
        with transaction.atomic():
            obj, created = ItemCompany.objects.get_or_create(
                id=company_id_str,
                defaults={"name": name},
            )

            if not created and obj.name != name:
                obj.name = name
                obj.save(update_fields=["name"])

        group_publ_map[company_id_str] = publ

  
    
    companies = {
        str(c.id): c
        for c in ItemCompany.objects.all()
    }

  
    for item in data_items:
        art = item.get("art")
        if not art:
            logger.warning(f"SKIP: item without art: {item}")
            continue

        name = item.get("nm", "")
        gr_id = item.get("gr")

        if gr_id is None:
            logger.warning(f"SKIP: item without gr_id: art={art}")
            continue

       
        gr_id_str = str(gr_id)
        gr_obj = companies.get(gr_id_str)
        
        if not gr_obj:
            
            try:
                with transaction.atomic():
                    gr_obj, created = ItemCompany.objects.get_or_create(
                        id=gr_id_str,
                        defaults={"name": f"Unknown Company {gr_id}"},
                    )
                    if created:
                        logger.info(f"Created missing company id={gr_id} with default name")
                    companies[gr_id_str] = gr_obj
            except Exception as e:
                logger.error(f"Failed to create company id={gr_id} for art={art}: {e}")
                continue

        
        art_str = str(art)
        
        defaults = {
            "kl": int(item.get("kl", 0)),
            "price": item.get("price", 0),
            "price1": item.get("price1", 0),
            "price2": item.get("price2", 0),
            "price3": item.get("price3", 0),
            "name": name,
            "gr": gr_obj,
            "publ": bool(group_publ_map.get(gr_id_str, False)),
        }

        try:
            
            obj, created = StorageItem.objects.update_or_create(
                art=art_str,
                defaults=defaults,
            )

            logger.info(
                f"{'Created' if created else 'Updated'} StorageItem: "
                f"{name} (art={art_str}, gr={gr_id_str})"
            )

        except IntegrityError as e:
            logger.error(f"IntegrityError for item name={name}, art={art_str}: {e}")

           
            try:
                obj = StorageItem.objects.get(art=art_str)
                for field, value in defaults.items():
                    setattr(obj, field, value)
                obj.save()
                logger.info(f"Recovered StorageItem: art={art_str}, name={name}")
            except StorageItem.DoesNotExist:
                logger.critical(f"FATAL: StorageItem art={art_str} still not found")
                raise
            except Exception as e:
                logger.error(f"Unexpected error recovering StorageItem art={art_str}: {e}")
                raise
