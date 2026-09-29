# PPTX Generator Foundation

## Problem

The application has report data and an HTML preview but no serverless path to produce an editable PowerPoint while retaining the corporate master.

## Alternatives

- Redraw slides with a new PPTX library. Rejected because it would not preserve the supplied master shapes, icons, fonts, and positions.
- Use Office or LibreOffice conversion. Rejected because Vercel functions cannot depend on those runtimes.
- Use `pptx-automizer` over the master buffer. Chosen because it clones master slides and edits named shapes in Node.js.

## Decision

The generator accepts only a `PresentationInput` DTO and a template `Buffer`. The route authenticates, loads and validates report data, downloads the template from Supabase Storage, then produces a generated buffer. No generator module queries the database or writes persistent files. Each call creates one `Automizer` instance.

## Generated Presentation Storage

### Problem

Generated presentations must survive a serverless invocation, retain every version, and remain private to the report owner. Selecting `max(version) + 1` in an application request is unsafe when two generation requests overlap.

### Alternatives

- Write PPTX files to function disk. Rejected because Vercel function disk is temporary.
- Select next version in route, upload, then insert record. Rejected because concurrent requests can select same version.
- Reserve version with a database RPC protected by an advisory transaction lock, upload the Buffer to private Storage, and expose an authenticated application download route. Chosen because version allocation is atomic and neither Storage paths nor files become public.

### Decision

`reserve_generated_presentation` locks one report, assigns next version, and inserts its metadata under RLS. Route uploads Buffer to `generated-presentations/{userId}/{reportId}/v{version}.pptx`; it removes both reserved row and object if upload fails. List and download queries are RLS-scoped. Download route verifies authenticated access before reading from private Storage.

### Impact

Apply migration `0003_generated_presentation_storage.sql`. It creates private `generated-presentations` bucket, Storage policies, unique report-version constraint, and reservation RPC. Generate endpoint now returns JSON metadata and protected download URL instead of direct PPTX response.

## Impact

The `presentation-templates` bucket must contain `status-weekly/v1/template.pptx` and permit authenticated report owners to download it. The original `Template(1).pptx` is required for an end-to-end integration fixture and shape-name verification.
