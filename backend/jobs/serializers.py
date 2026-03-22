from rest_framework import serializers
from .models import JobApplication, SheetConfig


class JobApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ["id", "title", "company", "url", "notes", "required_skills",
                  "nice_to_have_skills", "job_summary", "status", "created_at",
                  "updated_at", "author"]
        extra_kwargs = {
            "author": {"read_only": True},
            "url":    {"required": False, "allow_blank": True, "allow_null": True},
        }


class JobApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ["id", "status"]


class SheetConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SheetConfig
        fields = ["spreadsheet_id", "service_account_json", "updated_at"]
        extra_kwargs = {
            "service_account_json": {"write_only": True},
            "updated_at": {"read_only": True},
        }
