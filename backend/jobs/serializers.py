from django.db.models import Avg
from rest_framework import serializers
from .models import User, Job, Application, Category, Message, Review, Cart, CartItem, Order, OrderItem


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ProductSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False,
        allow_null=True,
    )
    image = serializers.ImageField(required=False, allow_null=True)
    image_url = serializers.SerializerMethodField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id',
            'title',
            'description',
            'price',
            'location',
            'category',
            'category_id',
            'image',
            'image_url',
            'status',
            'created_at',
            'created_by',
            'avg_rating',
            'review_count',
        ]
        read_only_fields = ['created_at', 'created_by', 'avg_rating', 'review_count']

    def get_avg_rating(self, obj):
        rating = obj.reviews.aggregate(avg=Avg('rating'))['avg']
        return round(rating, 2) if rating else None

    def get_review_count(self, obj):
        return obj.reviews.count()
    
    def get_image_url(self, obj):
        if obj.image_url:
            return obj.image_url
        if obj.image:
            # Return the media file path - frontend will construct the full URL
            return f"/media/{obj.image.name}"
        return None


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)
    recipient_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='recipient',
        write_only=True,
    )
    product = ProductSerializer(read_only=True, source='product')
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(),
        source='product',
        write_only=True,
    )

    class Meta:
        model = Message
        fields = ['id', 'sender', 'recipient', 'recipient_id', 'product', 'product_id', 'content', 'created_at']
        read_only_fields = ['sender', 'recipient', 'product', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(),
        source='product',
        write_only=True,
    )

    class Meta:
        model = Review
        fields = ['id', 'user', 'product', 'product_id', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'product', 'created_at']


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Job.objects.all(), source='product', write_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'user', 'items']
        read_only_fields = ['user', 'items']


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price']


class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'status', 'total', 'created_at', 'order_items']
        read_only_fields = ['user', 'status', 'total', 'created_at', 'order_items']


class ApplicationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    product = ProductSerializer(read_only=True, source='job')
    product_id = serializers.PrimaryKeyRelatedField(queryset=Job.objects.all(), source='job', write_only=True)

    class Meta:
        model = Application
        fields = ['id', 'user', 'product', 'product_id', 'status', 'created_at']
        read_only_fields = ['user', 'status', 'created_at', 'product']
