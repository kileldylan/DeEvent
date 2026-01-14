# backend/apps/accounts/serializers.py
from django.utils import timezone
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from .models import User, KYCVerification, UserNote, UserActivityLog

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Registration serializer with role support"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    is_organizer = serializers.BooleanField(required=False, default=False, write_only=True)
    
    class Meta:
        model = User
        fields = ('email', 'phone', 'password', 'password2', 
                 'first_name', 'last_name', 'country', 'city', 'county', 
                 'is_organizer') 
        extra_kwargs = {
            'phone': {'required': False, 'allow_null': True, 'allow_blank': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match."})
        return data
    
    def create(self, validated_data):
        # Remove password2
        password = validated_data.pop('password')
        validated_data.pop('password2')
        
        # Get is_organizer value
        is_organizer = validated_data.pop('is_organizer', False)
        
        # Handle phone
        phone = validated_data.get('phone')
        if phone:
            phone = phone.strip()
            if phone.startswith('0') and len(phone) == 10:
                validated_data['phone'] = '+254' + phone[1:]
            elif phone.startswith('+254'):
                validated_data['phone'] = phone
            elif not phone:
                validated_data['phone'] = None
        
        # Set default country
        if not validated_data.get('country'):
            validated_data['country'] = 'KE'
        
        # Create user using create_user method
        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            first_name=validated_data.get('first_name'),
            last_name=validated_data.get('last_name'),
            phone=validated_data.get('phone'),
            country=validated_data.get('country'),
            city=validated_data.get('city'),
            county=validated_data.get('county'),
            is_organizer=is_organizer,  # Pass is_organizer to create_user
        )
        
        return user
    
class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField(required=True)  # Make email required
    password = serializers.CharField(write_only=True, required=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError("Both email and password are required.")
        
        # Authenticate user - IMPORTANT: pass email as username
        user = authenticate(
            request=self.context.get('request'),
            username=email,  # This is the key! Django expects 'username' parameter
            password=password
        )
        
        if not user:
            # Check if user exists but password is wrong
            try:
                user_exists = User.objects.get(email=email)
                raise serializers.ValidationError({"password": "Incorrect password."})
            except User.DoesNotExist:
                raise serializers.ValidationError({"email": "No user found with this email address."})
        
        # Check if user is active
        if not user.is_active:
            raise serializers.ValidationError({"account": "This account is inactive."})
        
        attrs['user'] = user
        return attrs


# serializers.py
class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    kyc_status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'phone', 'first_name', 'last_name', 'full_name',
            'date_of_birth', 'avatar', 'bio', 'country', 'city', 'county',
            'id_number', 'mpesa_number',
            'is_organizer', 'is_staff', 'is_superuser', 'is_verified',
            'language', 'currency', 'timezone_field', 'date_joined', 'kyc_status'
        )
        read_only_fields = ('id', 'email', 'is_verified', 'date_joined')
    
    def get_kyc_status(self, obj):
        try:
            kyc = obj.kyc_verification
            return {
                'status': kyc.status,
                'submitted_at': kyc.submitted_at,
                'verified_at': kyc.verified_at,
                'expires_at': kyc.expires_at,
            }
        except KYCVerification.DoesNotExist:
            return None


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "New passwords don't match."})
        return attrs


class KYCSerializer(serializers.ModelSerializer):
    """Serializer for KYC submission"""
    
    class Meta:
        model = KYCVerification
        fields = ('document_type', 'document_number', 'document_front', 
                 'document_back', 'selfie_with_document')
        
# --- Admin/User Management Serializers ---

class UserListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    last_login_ago = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'first_name', 'last_name',
            'phone', 'country', 'city', 'county',
            'is_organizer', 'is_staff', 'is_superuser', 'is_verified', 'is_active',
            'date_joined', 'last_login', 'last_login_ago', 'login_count'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'login_count']

    def get_last_login_ago(self, obj):
        if obj.last_login:
            delta = timezone.now() - obj.last_login
            if delta.days > 0:
                return f"{delta.days}d ago"
            elif delta.seconds // 3600 > 0:
                return f"{delta.seconds // 3600}h ago"
            else:
                return f"{delta.seconds // 60}m ago"
        return "Never"


class UserDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    recent_activity = serializers.SerializerMethodField()
    admin_notes = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'country', 'city', 'county', 'id_number', 'mpesa_number',
            'avatar', 'bio', 'date_of_birth',
            'is_organizer', 'is_staff', 'is_superuser', 'is_verified', 'is_active',
            'date_joined', 'last_login', 'login_count',
            'recent_activity', 'admin_notes'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'login_count']

    def get_recent_activity(self, obj):
        logs = obj.activity_logs.order_by('-timestamp')[:5]
        return [
            {
                'action': log.action,
                'by': log.performed_by.email if log.performed_by else 'System',
                'when': log.timestamp.strftime('%Y-%m-%d %H:%M'),
                'extra': log.extra_data
            } for log in logs
        ]

    def get_admin_notes(self, obj):
        notes = obj.admin_notes.order_by('-created_at')[:5]
        return [
            {
                'note': note.note[:100] + '...' if len(note.note) > 100 else note.note,
                'by': note.created_by.email if note.created_by else 'Unknown',
                'when': note.created_at.strftime('%Y-%m-%d')
            } for note in notes
        ]


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'country', 'city', 'county',
            'bio', 'avatar', 'date_of_birth', 'mpesa_number', 'id_number',
            'is_active', 'is_organizer', 'is_verified'
        ]
        read_only_fields = ['is_superuser']  # only superuser can promote to superuser


class UserActivityLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    performed_by_email = serializers.CharField(source='performed_by.email', read_only=True, allow_null=True)

    class Meta:
        model = UserActivityLog
        fields = [
            'id', 'user', 'user_email', 'action', 'performed_by', 'performed_by_email',
            'ip_address', 'user_agent', 'extra_data', 'timestamp'
        ]
        read_only_fields = fields


class UserNoteSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True, allow_null=True)

    class Meta:
        model = UserNote
        fields = [
            'id', 'user', 'user_email', 'note', 'created_by', 'created_by_email',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)