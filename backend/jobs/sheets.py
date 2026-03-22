import json

from google.oauth2 import service_account
from googleapiclient.discovery import build

from .models import JobApplication

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

SHEET_HEADERS = ["Company", "Title", "Notes: Remote/Hybrid/Salary etc.", "Link", "Status"]

STATUS_MAP = {
    "saved":     JobApplication.Status.SAVED,
    "applied":   JobApplication.Status.APPLIED,
    "interview": JobApplication.Status.INTERVIEW,
    "offer":     JobApplication.Status.OFFER,
    "rejected":  JobApplication.Status.REJECTED,
}


def _build_service(service_account_json):
    credentials_info = json.loads(service_account_json)
    credentials = service_account.Credentials.from_service_account_info(
        credentials_info, scopes=SCOPES
    )
    return build("sheets", "v4", credentials=credentials)


def get_sheet_data(service_account_json, spreadsheet_id):
    service = _build_service(service_account_json)
    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id, range="A1:Z")
        .execute()
    )

    values = result.get("values", [])
    if not values:
        return []

    headers = values[0]
    rows = []
    for row in values[1:]:
        # Pad short rows so zip aligns with headers
        padded = row + [""] * (len(headers) - len(row))
        row_dict = dict(zip(headers, padded))
        # Skip fully empty rows
        if not any(v.strip() for v in row_dict.values()):
            continue
        rows.append(row_dict)

    return rows


def map_row_to_job(row):
    raw_status = row.get("Status", "").strip().lower()
    status = STATUS_MAP.get(raw_status, JobApplication.Status.SAVED)

    return {
        "title":   row.get("Title", "").strip(),
        "company": row.get("Company", "").strip(),
        "status":  status,
        "url":     row.get("Link", "").strip() or None,
        "notes":   row.get("Notes: Remote/Hybrid/Salary etc.", "").strip(),
    }


def _job_to_row(job):
    return [
        job.company,
        job.title,
        job.notes or "",
        job.url or "",
        job.status,
    ]


def _ensure_headers(service, spreadsheet_id):
    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id, range="A1:E1")
        .execute()
    )
    if not result.get("values"):
        service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range="A1",
            valueInputOption="RAW",
            body={"values": [SHEET_HEADERS]},
        ).execute()



def append_job_to_sheet(service_account_json, spreadsheet_id, job):
    service = _build_service(service_account_json)
    _ensure_headers(service, spreadsheet_id)
    service.spreadsheets().values().append(
        spreadsheetId=spreadsheet_id,
        range="A1",
        valueInputOption="RAW",
        insertDataOption="INSERT_ROWS",
        body={"values": [_job_to_row(job)]},
    ).execute()


