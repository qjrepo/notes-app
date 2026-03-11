from django.urls import include, path
from . import views

urlpatterns = [
    path("notes/", views.NoteListCreate.as_view(), name = "note-list"),
    path("notes/delete/<int:pk>/", views.NoteDelete.as_view(), name = "delete-note"),
    path("notes/update/<int:pk>/", views.NoteUpdate.as_view(), name = "update-note"),
    path("change-password/", views.UpdatePassword.as_view(), name = "update-password"),
]

