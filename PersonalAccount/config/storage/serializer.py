from rest_framework import serializers


from storage.models import StorageItem


class StorageItemSerializer(serializers.ModelSerializer):
    class Meta:
        model =     StorageItem
        fields = ['art', 'name', 'price', 'price1', 'price2', 'price3', 'kl']


class OrderSerializer(serializers.Serializer):
    phone = serializers.CharField(required=True)
    cart = serializers.JSONField()

class SearchItemSerializer(serializers.ModelSerializer):
    company_slug = serializers.CharField(source="gr.slug" , read_only=True)
    company_name = serializers.CharField(source="gr.name" , read_only=True)

    class Meta:
        model = StorageItem
        fields = ["art" , "name" , "company_slug" , "company_name"]
