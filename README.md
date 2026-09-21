# CareSetu · SIH26047

A responsive patient case-taking and clinician coordination **fictional, browser-local demo**. The supplied master brief explicitly permits this fallback where real clinical identity, infrastructure, and providers are unavailable. This repository is not a connected clinical application and must never hold real medical records.

## Run

Prerequisite: Node 22.13+ and the pnpm version declared by package.json.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

### Windows / VS Code troubleshooting

If PowerShell shows `npm.ps1 cannot be loaded because running scripts is disabled`, or Corepack reports an `EPERM` error while opening `C:\Program Files\nodejs`, use the included Windows launcher instead. It does not require administrator access or a PowerShell execution-policy change:

```text
Double-click run-local.cmd
```

Or run it from the VS Code terminal:

```powershell
cmd /c run-local.cmd
```

When the server starts, open `http://localhost:5173`. The red `Cannot find module 'next'` editor warning disappears after the dependency installation completes.

The managed Sites environment uses its `sites-preview start` supervisor instead of starting a second development server.

```bash
corepack pnpm build
node node_modules/typescript/bin/tsc --noEmit
```

No API key is needed. `.env.example` documents disconnected integration seams. The Sites runtime requires its normal environment support for local builds.

## Demo entry points

- `/`: immediately usable fictional patient dashboard.
- `/auth/patient`: select Ishant Kumar (42), Asha Verma (58, assisted / incomplete data), or Dev Patel (31, fictional urgent-concern scenario).
- `/auth/doctor`: enter as fictional Dr. Meera Sharma, General Medicine, room 204.
- `/patient/visits/current`: stable seeded active visit.
- Settings provides persona choice, themes, language, accessibility preferences, and a confirmed demo reset.

All doctors, qualifications, facilities, rooms, records, appointments, and analytics are fictional. Today is derived from the current date in IST. A root-page demo bypass is intentional; simulated sign-in does not protect medical information.

## Implemented journeys

- Shared typed state drives dashboard, measurement series, visit detail, appointments, and clinician queue.
- Positive measurement validation, cm or feet/inches, kg or pounds, source and date; BMI from unrounded normalized measurements. No diagnostic categories. 170 cm / 65 kg = 22.5; 70 kg = 24.2.
- Resumable patient intake with correction, unknown / declined / skipped values, original answer source labels, draft summary, optional sample documents, simulated urgent interruption, and clinician handover.
- Six fictional doctor profiles, directory search and department filter, booking review, same-tab slot conflict check, same-day check-in, cancellation and rescheduling.
- Clinician scope shows General Medicine encounters. After check-in, assign a stable MED token, call, start consultation, mark away, review priority with a reason, save draft, request clarification, confirm a signed version, and complete the visit.
- Previous signed text remains in version history when amended. Activity records accompany workflow changes.
- Visit-linked fictional report storage with PDF/JPEG/PNG type, size and signature checks. Seeded OCR text is explicitly simulated. Arbitrary uploads are preserved and previewed without inventing extraction.
- Light, dark and system appearance; native-language selectors for English, Hindi, Marathi, Bengali and Tamil; reduced motion, high contrast and large text preferences; accessible Radix dialogs/tabs and sidebar primitives; accessible chart data table.
- Emergency assistance sheet with an explicit real `tel:112` action and copy action. No dispatch or external staff notifications.

## State and production boundaries

`lib/medi-data.ts` contains the shared entity types and fixtures. Fictional entities reference patient, doctor and visit IDs. `lib/medi-integrations.ts` defines provider interfaces and explicit unavailable connected adapters. Browser localStorage persists fictional state and its storage event synchronizes open tabs on the same browser profile. There is no multiuser server or real authorization: manually changing local state can impersonate any demo persona. It is inappropriate for real records.

Concurrent writes from independent browser tabs are last-writer-wins. Booking and token actions prevent repeated clicks in a single state, but are **not atomic across clients**. Production must use an institution-owned database with unique constraints, transactional booking/token allocation, audit tables, independent role validation, care-scope checks, and server-authorized private storage access. No database schema or migrations are supplied because this delivery is the explicit synthetic-only fallback.

Uploads are limited to 2 MB to respect browser storage. Storage failures are shown. Browser persistence is not encrypted clinical storage, malware scanning, or durable archival. Seeded `.pdf` records are textual fictional fixtures, not original laboratory PDFs; their download is a labeled text fixture. Extracted text edits do not constitute a clinical finding. Evidence bounding boxes and validated OCR are unavailable.

**Localization is partial:** core navigation, primary actions, status labels, and intake questions have dictionaries for all five languages. Extended help, detailed clinical workflow copy and some validation remain in English. No validated voice support is claimed. Read aloud depends on installed device voices. Clinical narratives retain original wording.

Institutional OTP/OAuth, provisioned clinical roles, ABHA/ABDM, real AI, OCR, speech recognition, clinical routing rules, alert delivery, live ambulance dispatch, reliable estimated waiting times, detailed analytics, and FHIR exports are not connected. General Medicine is a deliberately provisional demo fallback, not a clinically validated symptom routing engine.

Room scheduling is a simplified per-doctor override; the demo is not a full rota planner. Waiting times are not inferred. No vitals, prescriptions, investigation values or clinical diagnoses are manufactured to fill UI gaps. BMI receives no automatic clinical interpretation.

## Suggested acceptance walkthrough

1. Open patient demo, update weight to 70 kg at 170 cm; verify BMI 24.2 in measurements and BMI chart.
2. Begin intake, enter an answer, change language and navigate away; resume the retained answer.
3. Open a visit and add a sample report; it remains linked only to that visit. Arbitrary uploads display extraction unavailable.
4. Check in today's Ishant appointment. Sign out of the demo and open fictional doctor entry. Review Ishant, assign MED-023, return to patient overview and verify the same token.
5. Review priority with an explicit reason, finalize a fictional summary, start and complete consultation. Verify the encounter is in Previous visits with its report and activity history.
6. Open emergency help but do not activate the real telephone link while testing.

Before real clinical use: replace local state, implement institutional authentication and server authorization, private document storage, atomic transactions, immutable signed versions, provider governance, complete translation review, WCAG evaluation, security review, institutional clinical validation and operational escalation ownership.
