import json

from google.oauth2 import service_account
from googleapiclient.discovery import build

from .models import JobApplication

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

STATUS_MAP = {
    "saved":     JobApplication.Status.SAVED,
    "applied":   JobApplication.Status.APPLIED,
    "interview": JobApplication.Status.INTERVIEW,
    "offer":     JobApplication.Status.OFFER,
    "rejected":  JobApplication.Status.REJECTED,
}


def get_sheet_data(service_account_json, spreadsheet_id):
    credentials_info = json.loads(service_account_json)
    credentials = service_account.Credentials.from_service_account_info(
        credentials_info, scopes=SCOPES
    )

    service = build("sheets", "v4", credentials=credentials)
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
