---
name: exam-authoring
description: Create, update and publish exams on testup.az through its HTTP API, as a teacher account.
---

# Authoring exams on testup.az

testup.az is an Azerbaijani online exam platform. This skill covers the
**teacher side**: turning a set of questions into a published, shareable exam.

Authoritative schemas live in the OpenAPI description at
<https://testup.az/v3/api-docs>; the shapes below are a summary, so check the
spec before sending a request.

## Prerequisites

A verified TEACHER (or ADMIN) account and a bearer token — see
<https://testup.az/auth.md>. Every request below needs:

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

## 1. Look up subjects and tags

- `GET /api/subjects` — subjects that can be attached to an exam
- `GET /api/subjects/topics` — topic tree per subject
- `GET /api/tags` — existing tags

## 2. Create the exam

`POST /api/exams`

```json
{
  "title": "Riyaziyyat sınaq 1",
  "description": "…",
  "subjects": ["Riyaziyyat"],
  "visibility": "PRIVATE",
  "examType": "FREE",
  "status": "DRAFT",
  "durationMinutes": 120,
  "tags": ["Riyaziyyat", "9-cu sinif"],
  "questions": [
    {
      "content": "…",
      "questionType": "MCQ",
      "points": 3.0,
      "orderIndex": 0,
      "options": [
        { "content": "…", "isCorrect": true,  "orderIndex": 0 },
        { "content": "…", "isCorrect": false, "orderIndex": 1 }
      ]
    }
  ],
  "passages": []
}
```

Notes:

- `visibility`, `examType` and `status` are required enums. Create as
  `status: "DRAFT"` and flip to `PUBLISHED` only when the content is final.
- Maths is written as LaTeX between `$$…$$` inside `content`.
- Reading/listening groups go in `passages`, each carrying its own `questions`.
- The response includes `id` and a `shareLink`.

## 3. Update, clone, publish

- `PUT /api/exams/{id}` — full update (same body as create)
- `POST /api/exams/{id}/clone` — duplicate an exam
- `PATCH /api/exams/{id}/toggle-status` — publish / unpublish
- `POST /api/exams/{id}/generate-code` — one-time access code for a session
- `GET /api/exams/{id}/pdf` — printable PDF rendition

The student-facing entry point is `https://testup.az/imtahan/<shareLink>`.

## 4. Results

- `GET /api/submissions/exam/{examId}/statistics` — aggregate results for an exam
  you own, plus the other endpoints under `/api/submissions/**` for per-student detail.

## Boundaries

- **Never automate taking an exam.** Driving a student session end-to-end
  (`/api/submissions/**` as a student, or `/test/take/*` in the browser) is
  treated as abuse of the platform, regardless of who asks.
- Only touch exams owned by the authenticated teacher; the API enforces this and
  will return 403 otherwise.
- Do not enumerate or publish share links belonging to other teachers.
