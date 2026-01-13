from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Organization, OrganizationMember

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