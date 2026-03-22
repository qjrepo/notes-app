import json
import os
import anthropic
from rest_framework import generics, views, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import JobApplication, SyncLog, SheetConfig
from .serializers import JobApplicationSerializer, JobApplicationStatusSerializer, SheetConfigSerializer
from .sheets import get_sheet_data, map_row_to_job

EXTRACT_SYSTEM_PROMPT = (
    "You are a job description parser. Extract information from the job description "
    "and return ONLY a valid JSON object with no preamble or markdown formatting with "
    "these exact keys: title (string), company (string), location (string), "
    "salary_range (string or null), required_skills (array of strings), "
    "nice_to_have_skills (array of strings), job_summary (string, 2-3 sentences max). "
    "If a field cannot be determined, use null for strings or empty array for lists."
)


class JobListCreate(generics.ListCreateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(author=self.request.user)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class JobDelete(generics.DestroyAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(author=self.request.user)


class JobUpdate(generics.UpdateAPIView):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(author=self.request.user)



class JobStatusUpdate(generics.UpdateAPIView):
    serializer_class = JobApplicationStatusSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(author=self.request.user)


class JobExtractView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        job_description = request.data.get("job_description", "").strip()
        if not job_description:
            return Response(
                {"error": "job_description is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=EXTRACT_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": job_description}]
            )
            text = response.content[0].text
            cleaned = text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.removeprefix("```json").removeprefix("```")
                cleaned = cleaned.removesuffix("```")
                cleaned = cleaned.strip()
            try:
                extracted = json.loads(cleaned)
            except json.JSONDecodeError:
                print(f"[JobExtractView] Raw Claude response:\n{text}")
                return Response(
                    {"error": "Claude returned an invalid JSON response."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            return Response(extracted)
        except anthropic.APIError as e:
            return Response(
                {"error": f"Claude API error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class JobImportSheetView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            config = SheetConfig.objects.get(author=request.user)
        except SheetConfig.DoesNotExist:
            return Response(
                {"error": "Google Sheets not configured. Please set up your credentials first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            rows = get_sheet_data(config.service_account_json, config.spreadsheet_id)
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch sheet data: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # One-time cleanup: remove records with blank/null titles that were mis-imported
        JobApplication.objects.filter(author=request.user, title__in=["", None]).delete()

        created = updated = skipped = 0

        for row in rows:
            job_data = map_row_to_job(row)

            if not job_data["company"] and not job_data["title"]:
                skipped += 1
                continue

            _, was_created = JobApplication.objects.update_or_create(
                company=job_data["company"],
                title=job_data["title"],
                author=request.user,
                defaults={
                    "status": job_data["status"],
                    "url":    job_data["url"],
                    "notes":  job_data["notes"],
                }
            )

            if was_created:
                created += 1
            else:
                updated += 1

        SyncLog.objects.create(
            author=request.user,
            created=created,
            updated=updated,
            skipped=skipped,
        )

        return Response({"created": created, "updated": updated, "skipped": skipped})


class JobSyncStatusView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        log = SyncLog.objects.filter(author=request.user).order_by("-synced_at").first()
        if log is None:
            return Response({"sync_log": None})
        return Response({
            "sync_log": {
                "synced_at": log.synced_at,
                "created":   log.created,
                "updated":   log.updated,
                "skipped":   log.skipped,
            }
        })


INTERVIEW_PREP_SYSTEM_PROMPT = (
    "You are an expert interview coach for software engineers. Given a job application, "
    "generate exactly 5 likely interview questions for this specific role and company. "
    "For each question provide a concise talking point the candidate should hit in their "
    "answer, based on a software engineering background. Format your response as a numbered "
    "list. For each item show the question in bold followed by the talking point on the next line."
)


class SheetConfigView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            config = SheetConfig.objects.get(author=request.user)
            return Response(SheetConfigSerializer(config).data)
        except SheetConfig.DoesNotExist:
            return Response(None)

    def put(self, request):
        try:
            config = SheetConfig.objects.get(author=request.user)
            serializer = SheetConfigSerializer(config, data=request.data, partial=True)
        except SheetConfig.DoesNotExist:
            serializer = SheetConfigSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(author=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobInterviewPrepView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            job = JobApplication.objects.get(pk=pk, author=request.user)
        except JobApplication.DoesNotExist:
            return Response(
                {"error": "Job application not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        user_message = (
            f"Role: {job.title}\n"
            f"Company: {job.company}\n"
            f"Required Skills: {', '.join(job.required_skills) if job.required_skills else 'Not specified'}\n"
            f"Job Summary: {job.job_summary or 'Not provided'}"
        )

        if job.interview_prep:
            return Response({"prep": job.interview_prep})

        try:
            client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=INTERVIEW_PREP_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}]
            )
            prep_text = response.content[0].text
            job.interview_prep = prep_text
            job.save(update_fields=["interview_prep"])
            return Response({"prep": prep_text})
        except anthropic.APIError as e:
            return Response(
                {"error": f"Claude API error: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
