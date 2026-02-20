from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Organization, OrganizationMember, Event, Transaction, TicketType, DashboardMetric
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class OrganizationMemberSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    
    class Meta:
        model = OrganizationMember
        fields = [
            'id', 'user_id', 'user_email', 'user_name', 'role',
            'can_create_events', 'can_manage_tickets', 
            'can_manage_team', 'can_view_analytics',
            'is_active', 'joined_at'
        ]
        read_only_fields = [
            'id', 'user_id', 'user_email', 'user_name',
            'can_create_events', 'can_manage_tickets',
            'can_manage_team', 'can_view_analytics',
            'joined_at'
        ]


class OrganizationSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    member_count = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = [
            # Basic info
            'id', 'name', 'slug', 'org_type', 'status',
            
            # Contact
            'email', 'phone', 'website', 'description',
            
            # Business details
            'tax_id', 'registration_number', 'address',
            
            # Branding
            'logo', 'banner_image',
            
            # Payment
            'bank_name', 'bank_account', 'mpesa_paybill',
            
            # Metadata
            'owner', 'owner_email', 'owner_name',
            'is_verified', 'created_at', 'updated_at',
            
            # Computed
            'member_count', 'is_owner',
            'is_personal', 'is_business'  # Properties
        ]
        read_only_fields = [
            'id', 'slug', 'status', 'is_verified',
            'created_at', 'updated_at',
            'owner_email', 'owner_name', 'member_count',
            'is_owner', 'is_personal', 'is_business'
        ]
        extra_kwargs = {
            'owner': {'write_only': True},
        }
    
    def get_member_count(self, obj):
        return obj.members.filter(is_active=True).count()
    
    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.owner == request.user
        return False
    
    def validate(self, data):
        # Business orgs require more details
        if data.get('org_type') == Organization.OrganizationType.BUSINESS:
            required_fields = ['tax_id', 'address', 'phone', 'email']
            missing = [field for field in required_fields if not data.get(field)]
            if missing:
                raise serializers.ValidationError(
                    f"Business organizations require: {', '.join(missing)}"
                )
        return data
    
    def create(self, validated_data):
        # Set the owner to the current user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['owner'] = request.user
        
        # Business orgs start as pending
        if validated_data.get('org_type') == Organization.OrganizationType.BUSINESS:
            validated_data['status'] = Organization.Status.PENDING
        
        organization = super().create(validated_data)
        
        # Add creator as OWNER member
        OrganizationMember.objects.create(
            organization=organization,
            user=organization.owner,
            role=OrganizationMember.Role.OWNER
        )
        
        return organization


class OrganizationCreateSerializer(OrganizationSerializer):
    """
    Special serializer for creation with different validation
    """
    class Meta(OrganizationSerializer.Meta):
        read_only_fields = [
            'id', 'slug', 'status', 'is_verified',
            'created_at', 'updated_at',
            'owner_email', 'owner_name', 'member_count',
            'is_owner', 'is_personal', 'is_business'
        ]


class OrganizationUpdateSerializer(OrganizationSerializer):
    """
    Serializer for updates (different field permissions)
    """
    class Meta(OrganizationSerializer.Meta):
        read_only_fields = OrganizationSerializer.Meta.read_only_fields + [
            'org_type', 'owner'
        ]


class EventSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    is_live = serializers.BooleanField(read_only=True)
    days_until = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type',
            'organization', 'organization_name',
            'total_revenue', 'total_tickets_sold', 'attendees_count',
            'venue_name', 'city', 'county',
            'status', 'is_live', 'days_until',
            'start_date', 'end_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'organization_name', 'is_live', 'days_until',
            'total_revenue', 'total_tickets_sold', 'attendees_count',
            'created_at', 'updated_at'
        ]


class TransactionSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    is_income = serializers.BooleanField(read_only=True)
    is_expense = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_id',
            'organization', 'organization_name',
            'event', 'event_title',
            'amount', 'transaction_type', 'status', 'payment_method',
            'description', 'metadata',
            'is_income', 'is_expense',
            'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'transaction_id', 'organization_name', 'event_title',
            'is_income', 'is_expense', 'created_at', 'updated_at', 'completed_at'
        ]


class TicketTypeSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)
    available_quantity = serializers.IntegerField(read_only=True)
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = TicketType
        fields = [
            'id', 'name', 'description',
            'event', 'event_title',
            'price', 'currency',
            'quantity', 'sold_count', 'available_quantity', 'revenue',
            'sale_start', 'sale_end',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'event_title', 'available_quantity', 'revenue',
            'sold_count', 'created_at', 'updated_at'
        ]


# Dashboard-specific serializers
class DashboardMetricsSerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    active_events = serializers.IntegerField(default=0)
    total_attendees = serializers.IntegerField(default=0)
    avg_ticket_price = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    conversion_rate = serializers.FloatField(default=0)
    revenue_growth = serializers.FloatField(default=0)
    transaction_volume = serializers.IntegerField(default=0)


class RevenueChartDataSerializer(serializers.Serializer):
    date = serializers.DateField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    tickets_sold = serializers.IntegerField()
    avg_ticket_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class EventTypeDistributionSerializer(serializers.Serializer):
    event_type = serializers.CharField()
    count = serializers.IntegerField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    percentage = serializers.FloatField()


class RecentTransactionSerializer(serializers.Serializer):
    id = serializers.CharField()
    description = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    type = serializers.CharField()  # 'income' or 'expense'
    date = serializers.DateTimeField()
    status = serializers.CharField()


class UpcomingEventSerializer(serializers.Serializer):
    id = serializers.CharField()
    title = serializers.CharField()
    date = serializers.DateTimeField()
    attendees = serializers.IntegerField()
    status = serializers.CharField()
    revenue = serializers.DecimalField(max_digits=12, decimal_places=2)


class QuickStatsSerializer(serializers.Serializer):
    today_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    week_revenue = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    pending_payouts = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    live_events = serializers.IntegerField(default=0)
    total_events = serializers.IntegerField(default=0)