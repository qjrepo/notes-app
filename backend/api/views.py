from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, views, status
from .serializers import UserSerializer, NoteSerializer, CustomTokenObtainPairSerializer, ChangePasswordSerializer, ChangeUsernameSerializer,ForgotPasswordSerializer, ForgotPasswordConfirmSerializer, ChangeUserEmailSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Note
from django.utils import timezone
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.conf import settings

class ValidateUserView(TokenObtainPairView):
    # return username and userid as well
    serializer_class = CustomTokenObtainPairSerializer

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        # username = serializer.validated_data.get("username")
        # print("Username:", username)
        serializer.save()
        
class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user).order_by('-is_pinned', '-pinned_at', '-created_at')

    def perform_create(self, serializer):
        print(type(serializer))
        print(serializer.validated_data)
        serializer.save(author=self.request.user)

class NoteDelete(generics.DestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author = user)
    
class NoteUpdate(generics.UpdateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author = user)
    
    def perform_update(self, serializer):
        is_pinned = serializer.validated_data.get('is_pinned')
        instance = self.get_object()
        pinned_at = instance.pinned_at
        if is_pinned is True and not instance.is_pinned:
            pinned_at = timezone.now()
        elif is_pinned is False:
            pinned_at = None
        serializer.save(updated_at=timezone.now(), pinned_at=pinned_at)

class UpdatePassword(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data = request.data,
            context = {"request" : request}
        )
        if serializer.is_valid():
            user = request.user
            new_password = serializer.validated_data["new_password"]
            user.set_password(new_password)
            user.save()
            return Response(
                {"detail": "Password changed successfully"},
                status = status.HTTP_200_OK
            )
        return Response(
            {"details":serializer.errors },
            status = status.HTTP_400_BAD_REQUEST
        )
    
class UpdateUsername(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangeUsernameSerializer(
            data = request.data,
            context = {"request": request}
        )

        if serializer.is_valid():
            user = request.user
            new_username = serializer.validated_data["new_username"]
            print(new_username)
            user.username = new_username
            user.save()

            return Response(
                {"detail": "Username changed successfully"},
                status = status.HTTP_200_OK
            )
        return Response(
            {"details": serializer.errors},
            status = status.HTTP_400_BAD_REQUEST
        )

class UpdateUserEmail(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangeUserEmailSerializer(
            data = request.data,
            context = {"request": request}
        )

        if serializer.is_valid():
            user = request.user
            new_email = serializer.validated_data["new_email"]
            print(new_email)
            user.email = new_email
            user.save()

            return Response(
                {"detail": "Email changed successfully"},
                status = status.HTTP_200_OK
            )
        return Response(
            {"details": serializer.errors},
            status = status.HTTP_400_BAD_REQUEST
        )
    
class ForgotPasswordView(views.APIView):
    permission_classes = []

    def post(self, request):
        serializer = ForgotPasswordSerializer(data = request.data)
        if not serializer.is_valid():
            return Response(
            {"details": serializer.errors},
            status = status.HTTP_400_BAD_REQUEST
        )

        email = serializer.validated_data["email_address"].strip().lower()
        user = User.objects.filter(email__iexact= email).first()

        if user and user.has_usable_password():
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

            send_mail(
                subject="Reset your password",
                message=f"""
                        We received a request to reset your password.

                        Click the link below to reset it:
                        {reset_url}

                        If you did not request this, you can ignore this email.
                        """,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
        )

        return Response(
            {"message": "If an account with that email exists, a reset link has been sent."},
            status=status.HTTP_200_OK
        )

class ForgotPasswordConfirmView(views.APIView):
    permission_classes = []

    def post(self, request):
        #get user from token
        uid = request.data.get("uid")
        token = request.data.get("token")
        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)
        except(TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Invalid reset link."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not default_token_generator.check_token(user, token):
            return Response(
                {"error": "Reset link is invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ForgotPasswordConfirmSerializer(
            data = request.data,
            context = {"user": user}
        )
        serializer.is_valid(raise_exception=True)
        new_password = serializer.validated_data["new_password"]

        user.set_password(new_password)
        user.save()

        return Response(
                {"message": "Password reset successfully"},
                status=status.HTTP_200_OK
        )












            












