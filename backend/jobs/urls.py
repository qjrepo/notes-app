from django.urls import path
from . import views

urlpatterns = [
    path("jobs/", views.JobListCreate.as_view(), name="job-list"),
    path("jobs/delete/<uuid:pk>/", views.JobDelete.as_view(), name="job-delete"),
    path("jobs/update/<uuid:pk>/", views.JobUpdate.as_view(), name="job-update"),
    path("jobs/update/<uuid:pk>/status/", views.JobStatusUpdate.as_view(), name="job-status-update"),
    path("jobs/extract/", views.JobExtractView.as_view(), name="job-extract"),
    path("jobs/import-sheet/", views.JobImportSheetView.as_view(), name="job-import-sheet"),
    path("jobs/sync-status/", views.JobSyncStatusView.as_view(), name="job-sync-status"),
    path("jobs/<uuid:pk>/interview-prep/", views.JobInterviewPrepView.as_view(), name="job-interview-prep"),
    path("jobs/sheet-config/", views.SheetConfigView.as_view(), name="job-sheet-config"),
]
