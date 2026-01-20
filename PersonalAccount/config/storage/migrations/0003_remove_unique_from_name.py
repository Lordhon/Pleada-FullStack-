
from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('storage', '0002_storageitem_publ'),  
    ]

    operations = [
        migrations.AlterField(
            model_name='storageitem',
            name='name',
            field=models.CharField(max_length=255), 
        ),
    ]
