import requests
import hashlib
import logging
from datetime import date

from celery import shared_task
from django.db import IntegrityError, transaction, connection

from .models import StorageItem, ItemCompany

logger = logging.getLogger(__name__)


def key():
    return hashlib.md5(str(date.today()).encode("utf-8")).hexdigest()


@shared_task(bind=True, autoretry_for=(Exception,), retry_kwargs={"max_retries": 3, "countdown": 5})
def fetch_and_update_storage(self):
    try:
        response = requests.get(
            "https://parus.ohelp.ru/api_lk?f=sklad",
            headers={"KEY": key()},
            timeout=15,
        )
        response.raise_for_status()
    except requests.RequestException as e:
        logger.error(f"Ошибка API: {e}")
        raise

    payload = response.json()
    data_company = payload.get("list_gr", [])
    data_items = payload.get("list", [])

    if not data_items:
        logger.warning("API вернула пустой список, обновление отменено")
        return

    with transaction.atomic():
        
        group_publ_map = {}

        for item in data_company:
            company_id = item.get("id")
            name = item.get("nm")
            publ = bool(item.get("publ", False))

            if company_id is None or not name:
                continue

            company_id_str = str(company_id)
        
            obj, created = ItemCompany.objects.get_or_create(
                id=company_id_str,
                defaults={"name": name},
            )

            if not created and obj.name != name:
                obj.name = name
                obj.save(update_fields=["name"])

            group_publ_map[company_id_str] = publ

        logger.info(f"Обновлено компаний: {len(data_company)}")

      

        with connection.cursor() as cursor:
            cursor.execute("TRUNCATE TABLE storage_storageitem CASCADE;")
            cursor.execute("ALTER SEQUENCE storage_storageitem_id_seq RESTART WITH 1;")
        logger.info("Очищена таблица StorageItem и сброшен ID на 1")

 
        companies = {str(c.id): c for c in ItemCompany.objects.all()}

        # Создаём товары
        for item in data_items:
            art = item.get("art")
            if not art:
                logger.warning(f"Пропущен товар без артикула: {item}")
                continue

            name = item.get("nm", "")
            gr_id = item.get("gr")

            if gr_id is None:
                logger.warning(f"Пропущен товар без группы: art={art}")
                continue

            gr_id_str = str(gr_id)
            gr_obj = companies.get(gr_id_str)
            
            if not gr_obj:
                logger.warning(f"Компания {gr_id} не найдена для товара art={art}, товар пропущен")
                continue

            art_str = str(art)
            
            try:
                obj = StorageItem.objects.create(
                    art=art_str,
                    name=name,
                    kl=int(item.get("kl", 0)),
                    price=item.get("price", 0),
                    price1=item.get("price1", 0),
                    price2=item.get("price2", 0),
                    price3=item.get("price3", 0),
                    gr=gr_obj,
                    publ=bool(group_publ_map.get(gr_id_str, False)),
                )

                logger.info(f"Создан товар: {name} (art={art_str}, gr={gr_id_str})")

            except IntegrityError as e:
                logger.error(f"Ошибка при создании товара: name={name}, art={art_str}, {e}")
                raise

        logger.info(f"Создано товаров: {len(data_items)}")