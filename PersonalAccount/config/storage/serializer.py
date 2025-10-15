from rest_framework import serializers


from storage.models import StorageItem


class StorageItemSerializer(serializers.ModelSerializer):
    class Meta:
        model =     StorageItem
        fields = ['art', 'name', 'price', 'price1', 'price2', 'price3', 'kl']


class OrderSerializer(serializers.Serializer):
    phone = serializers.CharField(required=True)
    cart = serializers.JSONField()