from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Job, Application, Category, Message

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Profile', {'fields': ('role',)}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    list_display = ('username', 'email', 'role', 'is_staff')
    search_fields = ('username', 'email')

@admin.register(Job)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'location', 'category', 'price', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'location', 'category')
    search_fields = ('title', 'description', 'location')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'recipient', 'product', 'created_at')
    search_fields = ('sender__username', 'recipient__username', 'product__title', 'content')

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('user', 'job', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('user__username', 'job__title')
