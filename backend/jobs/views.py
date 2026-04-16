from django.db.models import Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User, Job, Application, Category, Message, Review, Cart, CartItem, Order, OrderItem
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    ProductSerializer,
    ApplicationSerializer,
    CategorySerializer,
    MessageSerializer,
    ReviewSerializer,
    CartSerializer,
    OrderSerializer,
)
from .permissions import IsClient, IsWorker, IsOwnerOrReadOnly


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['location', 'title', 'description']
    ordering_fields = ['price', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Job.objects.all().order_by('-created_at')
        user = self.request.user
        if self.action == 'list' and user.is_authenticated and user.role == 'client':
            queryset = queryset.filter(created_by=user)

        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__id=category)

        return queryset

    def get_permissions(self):
        if self.action in ['create', 'partial_update', 'update', 'destroy', 'applications']:
            return [IsAuthenticated(), IsClient()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        product = self.get_object()
        if product.created_by != request.user:
            return Response({'detail': 'Only the product owner can update this product.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        if product.created_by != request.user:
            return Response({'detail': 'Only the product owner can delete this product.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def applications(self, request, pk=None):
        product = self.get_object()
        if product.created_by != request.user:
            return Response({'detail': 'Only the product owner can view applications.'}, status=status.HTTP_403_FORBIDDEN)
        applications = product.applications.all().order_by('-created_at')
        serializer = ApplicationSerializer(applications, many=True)
        return Response(serializer.data)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all().order_by('-created_at')
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Message.objects.filter(Q(sender=user) | Q(recipient=user))
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product__id=product_id)
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        product = serializer.validated_data['product']
        recipient = serializer.validated_data['recipient']
        sender = self.request.user

        if recipient == sender:
            raise PermissionDenied('Recipient must be different from sender.')

        if sender.role == 'worker' and recipient != product.created_by:
            raise PermissionDenied('Buyers can only message the product seller.')

        if sender.role == 'client' and product.created_by != sender:
            raise PermissionDenied('Only the product owner can message buyers about this product.')

        # ensure message corresponds to this product and user role
        if sender.role not in ['worker', 'client']:
            raise PermissionDenied('Invalid user role for sending messages.')

        serializer.save(sender=sender)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().order_by('-created_at')
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Review.objects.all().order_by('-created_at')
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product__id=product_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def create(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        try:
            product = Job.objects.get(id=product_id)
        except Job.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        if product.created_by == request.user:
            return Response({'detail': 'You cannot add your own product to the cart.'}, status=status.HTTP_400_BAD_REQUEST)

        if quantity <= 0:
            return Response({'detail': 'Quantity must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        item, created = CartItem.objects.get_or_create(cart=cart, product=product)
        if not created:
            item.quantity += quantity
        else:
            item.quantity = quantity
        item.save()

        return Response(CartSerializer(cart).data)

    def update(self, request, pk=None):
        cart = Cart.objects.filter(user=request.user).first()
        if not cart:
            return Response({'detail': 'Cart not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            item = cart.items.get(id=pk)
        except CartItem.DoesNotExist:
            return Response({'detail': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)
        item.quantity = int(request.data.get('quantity', item.quantity))
        if item.quantity <= 0:
            item.delete()
        else:
            item.save()
        return Response(CartSerializer(cart).data)

    def destroy(self, request, pk=None):
        cart = Cart.objects.filter(user=request.user).first()
        if not cart:
            return Response({'detail': 'Cart not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            item = cart.items.get(id=pk)
            item.delete()
        except CartItem.DoesNotExist:
            return Response({'detail': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(CartSerializer(cart).data)


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.filter(user=user).order_by('-created_at')
        status_filter = self.request.query_params.get('status')
        if status_filter in [Order.STATUS_PENDING, Order.STATUS_COMPLETED, Order.STATUS_CANCELLED]:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def create(self, request):
        user = request.user
        cart = Cart.objects.filter(user=user).first()
        if not cart or not cart.items.exists():
            return Response({'detail': 'Cart is empty.'}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.create(user=user, status=Order.STATUS_PENDING, total=0)
        total = 0
        for item in cart.items.all():
            OrderItem.objects.create(order=order, product=item.product, quantity=item.quantity, price=item.product.price)
            total += item.product.price * item.quantity
        order.total = total
        order.save()
        cart.items.all().delete()

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def status(self, request, pk=None):
        order = self.get_object()
        status_value = request.data.get('status')
        if status_value not in [Order.STATUS_PENDING, Order.STATUS_COMPLETED, Order.STATUS_CANCELLED]:
            return Response({'detail': 'Invalid status value.'}, status=status.HTTP_400_BAD_REQUEST)

        order.status = status_value
        order.save()
        return Response(self.get_serializer(order).data)


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'worker':
            return Application.objects.filter(user=user).order_by('-created_at')
        return Application.objects.filter(job__created_by=user).order_by('-created_at')

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsWorker()]
        if self.action in ['accept', 'reject']:
            return [IsAuthenticated(), IsClient()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        if self.request.user.role != 'worker':
            raise PermissionDenied('Only buyers can request products.')
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        application = self.get_object()
        if application.job.created_by != request.user:
            return Response({'detail': 'Only the product owner can accept this request.'}, status=status.HTTP_403_FORBIDDEN)
        application.status = Application.STATUS_ACCEPTED
        application.save()
        application.job.status = Job.STATUS_IN_PROGRESS
        application.job.save()
        return Response(self.get_serializer(application).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        application = self.get_object()
        if application.job.created_by != request.user:
            return Response({'detail': 'Only the product owner can reject this request.'}, status=status.HTTP_403_FORBIDDEN)
        application.status = Application.STATUS_REJECTED
        application.save()
        return Response(self.get_serializer(application).data)
