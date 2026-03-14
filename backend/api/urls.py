from django.urls import include, path
from . import views

urlpatterns = [
    path("notes/", views.NoteListCreate.as_view(), name = "note-list"),
    path("notes/delete/<int:pk>/", views.NoteDelete.as_view(), name = "delete-note"),
    path("notes/update/<int:pk>/", views.NoteUpdate.as_view(), name = "update-note"),
    path("change-password/", views.UpdatePassword.as_view(), name = "update-password"),
    path("update-username/", views.UpdateUsername.as_view(), name = "update-username"),
    path("forgot-password/", views.ForgotPasswordView.as_view(), name = "forgot-password"),
    path("reset-password-confirm/", views.ForgotPasswordConfirmView.as_view(), name = "reset-password-confirm")
]

