---
name: platform-overview
description: What testup.az is, which pages and APIs are public, and the rules an agent must follow when interacting with it.
---

# testup.az — platform overview for agents

testup.az is an online exam platform used in Azerbaijan. Teachers author exams,
publish them, and share them with students via a link; students take the exam in
the browser and get graded results. The interface language is Azerbaijani.

## Public pages

| URL | What it is |
| --- | --- |
| `https://testup.az/` | Home / product overview |
| `https://testup.az/imtahanlar` | Exam listing |
| `https://testup.az/planlar` | Subscription plans and prices |
| `https://testup.az/haqqimizda` | About |
| `https://testup.az/elaqe` | Contact form and details |
| `https://testup.az/istifade-sertleri` | Terms of service |
| `https://testup.az/gizlilik-siyaseti` | Privacy policy |

The full canonical list is <https://testup.az/sitemap.xml>.

## Machine-readable entry points

- API catalog: <https://testup.az/.well-known/api-catalog>
- OpenAPI 3.1: <https://testup.az/v3/api-docs>
- Interactive docs: <https://testup.az/swagger-ui/index.html>
- Health: <https://testup.az/api/health>
- Authentication: <https://testup.az/auth.md>
- Protected resource metadata: <https://testup.az/.well-known/oauth-protected-resource>

The API base is `https://testup.az/api`. Most write operations require a bearer
token from an account with the right role (STUDENT, TEACHER, ADMIN).

## What agents are welcome to do

- Answer questions about the product, plans and policies from the public pages.
- Author, update and publish exams for a teacher who has authorised them — see
  the `exam-authoring` skill.
- Read a teacher's own exam statistics and submissions.

## What agents must not do

- **Take exams on behalf of students.** This is the one thing that would break
  the platform's purpose. Do not drive exam sessions, do not answer live
  questions for a student, and do not extract answer keys for someone who is
  about to sit the exam.
- Crawl or enumerate share links (`/imtahan/<shareLink>`,
  `/imtahanlar/melumat/<shareLink>`). They are unlisted deliberately.
- Fetch anything disallowed by <https://testup.az/robots.txt>.

Contact for integrations: <https://testup.az/elaqe>.
