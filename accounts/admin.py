# backend/apps/accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, KYCVerification


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model"""
    
    # Fields to display in list view
    list_display = ('email', 'first_name', 'last_name', 'phone', 
                    'country', 'is_organizer', 'is_verified', 
                    'is_active', 'is_staff', 'date_joined')
    
    # Filters in sidebar
    list_filter = ('is_staff', 'is_superuser', 'is_active', 
                   'is_organizer', 'is_verified', 'country', 'date_joined')
    
    # Search fields
    search_fields = ('email', 'first_name', 'last_name', 'phone', 'id_number')
    
    # Ordering
    ordering = ('-date_joined',)
    
    # Fieldsets for edit view
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Personal Info'), {'fields': ('first_name', 'last_name', 
                                         'date_of_birth', 'avatar', 'bio')}),
        (_('Contact Info'), {'fields': ('phone', 'country', 'city', 
                                        'county', 'id_number', 'mpesa_number')}),
        (_('Preferences'), {'fields': ('language', 'currency', 'timezone')}),
        (_('Status'), {'fields': ('is_verified', 'is_organizer', 
                                  'is_active', 'is_staff', 'is_superuser')}),
        (_('Permissions'), {'fields': ('groups', 'user_permissions')}),  # ADD THIS LINE
        (_('Important Dates'), {'fields': ('last_login', 'date_joined', 'updated_at')}),
    )
    
    # Fields for add view
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'phone',
                       'password1', 'password2', 'country'),
        }),
    )
    
    # Readonly fields
    readonly_fields = ('last_login', 'date_joined', 'updated_at')
    
    # Filter horizontal for permissions (FIXED - now User has these fields from PermissionsMixin)
    filter_horizontal = ('groups', 'user_permissions',)


@admin.register(KYCVerification)
class KYCVerificationAdmin(admin.ModelAdmin):
    """Admin for KYC verifications"""
    
    list_display = ('user', 'document_type', 'document_number',
                    'status', 'submitted_at', 'verified_at')
    
    list_filter = ('status', 'document_type', 'submitted_at')
    
    search_fields = ('user__email', 'user__first_name', 
                     'user__last_name', 'document_number')
    
    readonly_fields = ('submitted_at', 'updated_at')
    
    # Add custom actions
    actions = ['approve_selected_kyc', 'reject_selected_kyc']
    
    def approve_selected_kyc(self, request, queryset):
        for kyc in queryset:
            kyc.approve(request.user)
        self.message_user(request, f"{queryset.count()} KYC submissions approved.")
    
    def reject_selected_kyc(self, request, queryset):
        for kyc in queryset:
            kyc.reject("Bulk rejection by admin", request.user)
        self.message_user(request, f"{queryset.count()} KYC submissions rejected.")
    
    approve_selected_kyc.short_description = "Approve selected KYC"
    reject_selected_kyc.short_description = "Reject selected KYC"