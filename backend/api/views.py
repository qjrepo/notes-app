from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, views, status
from .serializers import UserSerializer, NoteSerializer, CustomTokenObtainPairSerializer, ChangePasswordSerializer, ChangeUsernameSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Note
from django.utils import timezone
from rest_framework_simplejwt.views import TokenObtainPairView

class ValidateUserView(TokenObtainPairView):
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
        return Note.objects.filter(author = user)
    
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
        serializer.save(updated_at = timezone.now())

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
            new_username = serializer.validated_data("new_username")
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
    
            












