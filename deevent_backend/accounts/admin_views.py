from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from django.contrib.auth import get_user_model
from .models import UserActivityLog, UserNote
from .serializers import (
    UserListSerializer, UserDetailSerializer, UserUpdateSerializer,
    UserActivityLogSerializer, UserNoteSerializer
)

User = get_user_model()

class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin-only endpoints for managing users.
    """
    queryset = User.objects.all()
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_organizer', 'is_staff', 'is_superuser', 'is_active', 'is_verified', 'country', 'county']
    search_fields = ['email', 'first_name', 'last_name', 'phone', 'id_number']
    ordering_fields = ['date_joined', 'last_login', 'login_count', 'is_active']
    ordering = ['-date_joined']

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        if self.action in ['retrieve', 'partial_update', 'update']:
            return UserDetailSerializer
        return UserUpdateSerializer

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])

        # Log the action
        UserActivityLog.objects.create(
            user=user,
            action='user_activated' if user.is_active else 'user_deactivated',
            performed_by=request.user,
            extra_data={'is_active': user.is_active}
        )

        return Response({
            'status': 'active' if user.is_active else 'inactive',
            'message': f'User {"activated" if user.is_active else "deactivated"} successfully'
        })

    @action(detail=True, methods=['post'], url_path='make-organizer')
    def make_organizer(self, request, pk=None):
        user = self.get_object()
        if user.is_organizer:
            return Response({'message': 'User is already an organizer'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_organizer = True
        user.save(update_fields=['is_organizer'])

        UserActivityLog.objects.create(
            user=user,
            action='made_organizer',
            performed_by=request.user
        )

        return Response({'message': 'User promoted to organizer'})

    @action(detail=False, methods=['post'], url_path='bulk-toggle-active')
    def bulk_toggle_active(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No user IDs provided'}, status=status.HTTP_400_BAD_REQUEST)

        users = User.objects.filter(id__in=ids)
        active_count = users.filter(is_active=True).count()
        inactive_count = users.filter(is_active=False).count()

        # Toggle all
        for user in users:
            user.is_active = not user.is_active
            user.save(update_fields=['is_active'])

        return Response({
            'message': f'Toggled {len(ids)} users: {inactive_count} activated, {active_count} deactivated'
        })

    # More actions can be added later: bulk make organizer, reset password, etc.

class AdminUserActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserActivityLog.objects.all()
    serializer_class = UserActivityLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user__id', 'action', 'performed_by__id', 'timestamp']
    ordering = ['-timestamp']


class AdminUserNoteViewSet(viewsets.ModelViewSet):
    queryset = UserNote.objects.all()
    serializer_class = UserNoteSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)