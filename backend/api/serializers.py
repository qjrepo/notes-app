from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Note
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        # Add extra fields to response
        data["username"] = self.user.username
        data["user_id"] = self.user.id
        data["email"] = self.user.email
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password", "email"]
        extra_kwargs = {"password": {"write_only": True}}
    
    def validate_username(self, value):
        print(value)
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value
    
    def validate_email(self, value):
        print(value)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
        
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "title", "content", "created_at", "updated_at", "author"]
        extra_kwargs = {"author":{"read_only": True}}
    
class ForgotPasswordSerializer(serializers.Serializer):
    email_address = serializers.EmailField(write_only = True)

class ForgotPasswordConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only = True)
    confirm_password = serializers.CharField(write_only = True)

    def validate(self, attrs):
        user = self.context["user"]
        new_password = attrs.get("new_password")
        confirm_password = attrs.get("confirm_password")

        if new_password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match"
            })
        if user.check_password(new_password):
            raise serializers.ValidationError({
                "error": "New password cannot be the same as the old password."
           })
        
        validate_password(new_password)
        return attrs

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only = True)
    new_password = serializers.CharField(write_only = True)
    confirm_password = serializers.CharField(write_only = True)

    def validate(self, attrs):
        user = self.context["request"].user
        current_password = attrs.get("current_password")
        new_password = attrs.get("new_password")
        confirm_password = attrs.get("confirm_password")

        if not user.check_password(current_password):
            raise serializers.ValidationError({
                "current_password": "Current password is incorrect"
        })

        if new_password == current_password:
            raise serializers.ValidationError({
                "new_password" : "New password can't be the same as the current password"
            })
        if new_password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "New passwords don't match"
            })
        
        validate_password(new_password, user = user)
        return attrs

class ChangeUsernameSerializer(serializers.Serializer):
    new_username = serializers.CharField(write_only = True)

    def validate(self, attrs):
        user = self.context["request"].user
        new_username = attrs.get("new_username")
        if new_username == user.username:
            raise serializers.ValidationError({
                "username": "New username is the same as the old one."
            })
        return attrs

class ChangeUserEmailSerializer(serializers.Serializer):
    new_email = serializers.CharField(write_only = True)

    def validate(self, attrs):
        user = self.context["request"].user
        new_email = attrs.get("new_email")
        if new_email == user.email:
            raise serializers.ValidationError({
                "email": "New email is the same as the old one."
            })
        return attrs




        
        
    











    


