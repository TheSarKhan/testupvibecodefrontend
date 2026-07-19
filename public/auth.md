# auth.md — testup.az

testup.az is an online exam platform: teachers author and publish exams, students
take them. This document tells an automated client how to obtain and use
credentials against the public API at `https://testup.az/api`.

## Agent audience

This document addresses automated clients acting **on behalf of a human account
holder** — a teacher automating exam authoring, or an integration reading a
teacher's own results. There is no machine-to-machine client credential flow and
no anonymous agent identity; every request is attributable to a real account.

Machine-readable companions:

- API catalog: <https://testup.az/.well-known/api-catalog> (RFC 9727)
- Protected resource metadata: <https://testup.az/.well-known/oauth-protected-resource> (RFC 9728)
- OpenAPI description: <https://testup.az/v3/api-docs>

## Identity model

There is **no OAuth 2.0 authorization server and no OIDC provider**. testup.az
issues its own JWT access tokens directly. Do not expect
`/.well-known/openid-configuration` or `/.well-known/oauth-authorization-server`
— they are intentionally absent rather than published with placeholder endpoints.

Accounts are held by humans (teacher, student, or admin roles). An agent acts
**on behalf of an existing account** using that account's credentials; there is
no separate machine-account registration endpoint and no client registration
(`register_uri`) at this time.

## Registration / provisioning endpoint

`POST https://testup.az/api/auth/register`

```json
{
  "fullName": "…",
  "email": "…",
  "password": "…",
  "phoneNumber": "+994…",
  "role": "TEACHER",
  "termsAccepted": true
}
```

`role` is `TEACHER` or `STUDENT`; `password` is at least 6 characters.

Registration sends a verification email and the response comes back with
`emailVerificationRequired: true` and null tokens. The account cannot
authenticate until the emailed code is confirmed via `POST /api/auth/verify-email`
(`POST /api/auth/resend-verification` re-sends it). Because verification requires
receiving mail, **registration is a human step** — provision the account first,
then hand the agent its credentials.

Google sign-in is also available (`POST /api/auth/google`), but it requires an
interactive Google consent flow and is not suitable for unattended agents.

## Getting a token

`POST https://testup.az/api/auth/login`

```json
{ "email": "…", "password": "…" }
```

```json
{ "accessToken": "…", "refreshToken": "…", "role": "TEACHER", "fullName": "…", "email": "…" }
```

Access tokens are valid for 24 hours, refresh tokens for 30 days.

Refresh: `POST https://testup.az/api/auth/refresh` with
`{ "refreshToken": "…" }`.

## Credential usage

Send the access token as a bearer token on every API request:

```
Authorization: Bearer <accessToken>
```

An unauthenticated call to a protected endpoint returns HTTP 401 with a JSON
body; insufficient role returns 403. Role gates: `/api/admin/**` requires the
ADMIN role, `/api/teacher/**` requires TEACHER or ADMIN.

## Acceptable use for agents

These are conditions of access, not suggestions:

- **Do not sit exams on behalf of a student.** Automating exam sessions
  (`/api/submissions/**`, `/test/take/*`) defeats the purpose of the platform and
  is treated as abuse. Agents are welcome on the authoring, analytics and
  administrative side.
- Respect [robots.txt](https://testup.az/robots.txt). Share links
  (`/imtahan/<shareLink>`) are unlisted by design — do not crawl or enumerate them.
- Identify yourself with a descriptive `User-Agent` including a contact URL.
- Rate-limit yourself to what a human user would plausibly generate.

Questions or an integration that needs a machine account:
<https://testup.az/elaqe>.
