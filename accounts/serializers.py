# backend/apps/accounts/serializers.py
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from .models import User, KYCVerification


class UserRegistrationSerializer(serializers.ModelSerializer):
    """SIMPLIFIED registration serializer - working version"""
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('email', 'phone', 'password', 'password2', 
                 'first_name', 'last_name', 'country', 'city', 'county')
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
        
        # Handle phone
        phone = validated_data.get('phone')
        if phone:
            # Format phone
            phone = phone.strip()
            if phone.startswith('0') and len(phone) == 10:
                validated_data['phone'] = '+254' + phone[1:]
            elif phone.startswith('+254'):
                validated_data['phone'] = phone
            elif not phone:  # If empty string
                validated_data['phone'] = None
        
        # Set default country
        if not validated_data.get('country'):
            validated_data['country'] = 'KE'
        
        # Create user
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True, required=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        phone = attrs.get('phone')
        password = attrs.get('password')
        
        # Require either email or phone
        if not email and not phone:
            raise serializers.ValidationError("Either email or phone number is required.")
        
        # Find user by email or phone
        user = None
        if email:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError({"email": "No user found with this email address."})
        elif phone:
            # Format phone for lookup
            formatted_phone = phone
            if phone.startswith('0'):
                formatted_phone = '+254' + phone[1:]
            elif phone.startswith('7') and not phone.startswith('+254'):
                formatted_phone = '+254' + phone
                
            try:
                user = User.objects.get(phone=formatted_phone)
            except User.DoesNotExist:
                raise serializers.ValidationError({"phone": "No user found with this phone number."})
        
        # Check password
        if user and not user.check_password(password):
            raise serializers.ValidationError({"password": "Incorrect password."})
        
        # Check if user is active
        if user and not user.is_active:
            raise serializers.ValidationError({"account": "This account is inactive."})
        
        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    kyc_status = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'phone', 'first_name', 'last_name', 'full_name',
            'date_of_birth', 'avatar', 'bio', 'country', 'city', 'county',
            'id_number', 'mpesa_number', 'is_organizer', 'is_verified',
            'language', 'currency', 'timezone_field', 'date_joined', 'kyc_status'  # FIXED: timezone_field
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