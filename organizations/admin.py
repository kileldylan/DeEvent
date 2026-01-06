from django.contrib import admin
from .models import Organization, OrganizationMember


class OrganizationMemberInline(admin.TabularInline):
    model = OrganizationMember
    extra = 1
    readonly_fields = ['joined_at', 'updated_at']


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'org_type', 'status', 'owner', 'is_verified', 'created_at']
    list_filter = ['org_type', 'status', 'is_verified', 'created_at']
    search_fields = ['name', 'email', 'tax_id', 'owner__email']
    readonly_fields = ['created_at', 'updated_at', 'slug']
    inlines = [OrganizationMemberInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'owner', 'org_type', 'status')
        }),
        ('Contact Details', {
            'fields': ('email', 'phone', 'website', 'description', 'address')
        }),
        ('Business Details', {
            'fields': ('tax_id', 'registration_number', 'is_verified'),
            'classes': ('collapse',)
        }),
        ('Branding', {
            'fields': ('logo', 'banner_image'),
            'classes': ('collapse',)
        }),
        ('Payment Information', {
            'fields': ('bank_name', 'bank_account', 'mpesa_paybill'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_organizations', 'suspend_organizations']
    
    def approve_organizations(self, request, queryset):
        updated = queryset.update(status=Organization.Status.ACTIVE, is_verified=True)
        self.message_user(request, f"{updated} organization(s) approved.")
    approve_organizations.short_description = "Approve selected organizations"
    
    def suspend_organizations(self, request, queryset):
        updated = queryset.update(status=Organization.Status.SUSPENDED)
        self.message_user(request, f"{updated} organization(s) suspended.")
    suspend_organizations.short_description = "Suspend selected organizations"


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'organization', 'role', 'is_active', 'joined_at']
    list_filter = ['role', 'is_active', 'organization']
    search_fields = ['user__email', 'organization__name']
    readonly_fields = ['joined_at', 'updated_at']