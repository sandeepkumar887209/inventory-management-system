from rest_framework import serializers
from .models import Laptop

class LaptopSerializer(serializers.ModelSerializer):
    class Meta:
        model = Laptop
        fields = '__all__'
        read_only_fields = (
            'created_by', 'updated_by', 'created_at', 'updated_at'
        )



from rest_framework import serializers
from .models import StockMovement

class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = "__all__"

    def create(self, validated_data):
        laptop = validated_data["laptop"]
        movement_type = validated_data["movement_type"]

        # Update laptop status based on movement
        if movement_type == "IN":
            laptop.status = "AVAILABLE"

        elif movement_type == "OUT":
            laptop.status = "RENTED"

        elif movement_type == "RETURN":
            laptop.status = "AVAILABLE"

        elif movement_type == "DAMAGE":
            laptop.status = "SCRAP"

        laptop.save()
        return super().create(validated_data)
