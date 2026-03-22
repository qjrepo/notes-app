import uuid
from django.db import models
from django.contrib.auth.models import User


class JobApplication(models.Model):
    class Status(models.TextChoices):
        SAVED     = "Saved",     "Saved"
        APPLIED   = "Applied",   "Applied"
        INTERVIEW = "Interview", "Interview"
        OFFER     = "Offer",     "Offer"
        REJECTED  = "Rejected",  "Rejected"

    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title               = models.CharField(max_length=500)
    company             = models.CharField(max_length=500)
    url                 = models.URLField(max_length=2000, blank=True, null=True)
    notes               = models.TextField(blank=True)
    required_skills     = models.JSONField(default=list)
    nice_to_have_skills = models.JSONField(default=list)
    job_summary         = models.TextField(blank=True)
    status              = models.CharField(max_length=20, choices=Status.choices, default=Status.SAVED)
    interview_prep      = models.TextField(blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)
    author              = models.ForeignKey(User, on_delete=models.CASCADE, related_name="job_applications")

    def __str__(self):
        return f"{self.title} at {self.company}"


class SyncLog(models.Model):
    synced_at = models.DateTimeField(auto_now_add=True)
    created   = models.IntegerField()
    updated   = models.IntegerField()
    skipped   = models.IntegerField()
    author    = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sync_logs")

    def __str__(self):
        return f"SyncLog({self.author}, {self.synced_at})"


class SheetConfig(models.Model):
    author             = models.OneToOneField(User, on_delete=models.CASCADE, related_name="sheet_config")
    spreadsheet_id     = models.CharField(max_length=500)
    service_account_json = models.TextField()
    updated_at         = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"SheetConfig({self.author})"
