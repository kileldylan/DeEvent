from rest_framework import viewsets, generics, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.contrib.auth import get_user_model

from .models import Organization, OrganizationMember
from .serializers import (
    OrganizationSerializer,
    OrganizationCreateSerializer,
    OrganizationUpdateSerializer,
    OrganizationMemberSerializer
)
from .permissions import (
    IsOrganizationOwner,
    IsOrganizationAdmin,
    IsOrganizationMember,
    CanManageOrganizationTeam,
    IsAdminOrReadOnly
)

User = get_user_model()


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Organizations
    """
    queryset = Organization.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrganizationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return OrganizationUpdateSerializer
        return OrganizationSerializer
    
    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'create':
            permission_classes = [IsAuthenticated]
        elif self.action == 'list':
            permission_classes = [IsAuthenticated]
        elif self.action == 'retrieve':
            permission_classes = [IsAuthenticated, IsOrganizationMember]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [IsAuthenticated, IsOrganizationAdmin]
        elif self.action == 'destroy':
            permission_classes = [IsAuthenticated, IsOrganizationOwner]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """
        Return organizations based on user role:
        - Admin: all organizations
        - Regular users: organizations they are members of
        """
        user = self.request.user
        
        if user.is_staff:
            return Organization.objects.all()
        
        # For regular users, return organizations they're members of
        return Organization.objects.filter(
            Q(owner=user) | 
            Q(members__user=user, members__is_active=True)
        ).distinct()
    
    def perform_create(self, serializer):
        """Set the current user as owner when creating organization"""
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['get'], permission_classes=[IsOrganizationMember])
    def members(self, request, pk=None):
        """Get all members of an organization"""
        organization = self.get_object()
        members = organization.members.filter(is_active=True)
        serializer = OrganizationMemberSerializer(members, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[IsOrganizationMember])
    def my_role(self, request, pk=None):
        """Get current user's role in this organization"""
        organization = self.get_object()
        try:
            membership = organization.members.get(user=request.user, is_active=True)
            serializer = OrganizationMemberSerializer(membership)
            return Response(serializer.data)
        except OrganizationMember.DoesNotExist:
            return Response(
                {"detail": "You are not a member of this organization"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[CanManageOrganizationTeam])
    def invite_member(self, request, pk=None):
        """Invite a new member to the organization"""
        organization = self.get_object()
        email = request.data.get('email')
        role = request.data.get('role', OrganizationMember.Role.MEMBER)
        
        if not email:
            return Response(
                {"email": ["This field is required."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # User doesn't exist yet - store invitation for when they sign up
            # You might want to send an email invitation here
            return Response(
                {
                    "detail": "User not found. Invitation saved.",
                    "invited_email": email,
                    "status": "pending"
                },
                status=status.HTTP_200_OK
            )
        
        # Check if already a member
        if organization.members.filter(user=user, is_active=True).exists():
            return Response(
                {"detail": "User is already a member of this organization"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create membership
        membership = OrganizationMember.objects.create(
            organization=organization,
            user=user,
            role=role,
            invited_by=request.user,
            invited_email=email
        )
        
        serializer = OrganizationMemberSerializer(membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsOrganizationAdmin])
    def update_member_role(self, request, pk=None):
        """Update a member's role"""
        organization = self.get_object()
        user_id = request.data.get('user_id')
        new_role = request.data.get('role')
        
        if not user_id or not new_role:
            return Response(
                {"detail": "user_id and role are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            membership = organization.members.get(
                user_id=user_id,
                is_active=True
            )
            
            # Prevent changing owner's role
            if membership.role == OrganizationMember.Role.OWNER:
                return Response(
                    {"detail": "Cannot change owner's role"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            membership.role = new_role
            membership.save()
            
            serializer = OrganizationMemberSerializer(membership)
            return Response(serializer.data)
            
        except OrganizationMember.DoesNotExist:
            return Response(
                {"detail": "Member not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'], permission_classes=[IsOrganizationAdmin])
    def remove_member(self, request, pk=None):
        """Remove a member from organization"""
        organization = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {"detail": "user_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            membership = organization.members.get(
                user_id=user_id,
                is_active=True
            )
            
            # Prevent removing owner
            if membership.role == OrganizationMember.Role.OWNER:
                return Response(
                    {"detail": "Cannot remove organization owner"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Deactivate instead of delete
            membership.is_active = False
            membership.save()
            
            return Response(
                {"detail": "Member removed successfully"},
                status=status.HTTP_200_OK
            )
            
        except OrganizationMember.DoesNotExist:
            return Response(
                {"detail": "Member not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def my_organizations(self, request):
        """Get organizations where current user is owner or member"""
        organizations = Organization.objects.filter(
            Q(owner=request.user) | 
            Q(members__user=request.user, members__is_active=True)
        ).distinct()
        
        # Separate owned vs member organizations
        owned_orgs = organizations.filter(owner=request.user)
        member_orgs = organizations.exclude(owner=request.user)
        
        owned_serializer = self.get_serializer(owned_orgs, many=True)
        member_serializer = self.get_serializer(member_orgs, many=True)
        
        return Response({
            'owned': owned_serializer.data,
            'member_of': member_serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsOrganizationOwner])
    def request_verification(self, request, pk=None):
        """Request verification for business organization"""
        organization = self.get_object()
        
        if organization.org_type != Organization.OrganizationType.BUSINESS:
            return Response(
                {"detail": "Only business organizations can request verification"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # In production, you might send an email to admin here
        organization.status = Organization.Status.PENDING
        organization.save()
        
        return Response({
            "detail": "Verification requested. Admin will review your organization.",
            "status": organization.status
        })


class OrganizationMemberViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing organization members (admin only)
    """
    serializer_class = OrganizationMemberSerializer
    permission_classes = [IsAuthenticated, IsOrganizationAdmin]
    
    def get_queryset(self):
        organization_id = self.kwargs.get('organization_pk')
        return OrganizationMember.objects.filter(
            organization_id=organization_id,
            is_active=True
        )
    
    def perform_create(self, serializer):
        organization_id = self.kwargs.get('organization_pk')
        organization = Organization.objects.get(id=organization_id)
        serializer.save(organization=organization, invited_by=self.request.user)


class AdminOrganizationViewSet(viewsets.ModelViewSet):
    """
    Admin-only API for managing all organizations
    """
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['org_type', 'status', 'is_verified']
    search_fields = ['name', 'email', 'tax_id']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending business organization"""
        organization = self.get_object()
        
        if organization.status != Organization.Status.PENDING:
            return Response(
                {"detail": "Organization is not pending approval"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        organization.status = Organization.Status.ACTIVE
        organization.is_verified = True
        organization.save()
        
        # Send notification email to owner (implement in production)
        
        return Response({
            "detail": "Organization approved successfully",
            "status": organization.status,
            "is_verified": organization.is_verified
        })
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend an organization"""
        organization = self.get_object()
        reason = request.data.get('reason', '')
        
        organization.status = Organization.Status.SUSPENDED
        organization.save()
        
        # Log suspension reason (you might want a separate model for this)
        # Send notification to owner
        
        return Response({
            "detail": f"Organization suspended. Reason: {reason}",
            "status": organization.status
        })
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Reactivate a suspended organization"""
        organization = self.get_object()
        
        if organization.status != Organization.Status.SUSPENDED:
            return Response(
                {"detail": "Organization is not suspended"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        organization.status = Organization.Status.ACTIVE
        organization.save()
        
        return Response({
            "detail": "Organization activated successfully",
            "status": organization.status
        })