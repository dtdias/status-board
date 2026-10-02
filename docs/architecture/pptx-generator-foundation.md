# PPTX Generator Foundation

## Problem

The application has report data but needs to produce and preview editable PowerPoint while retaining the corporate master.

## Alternatives

- Redraw slides with a new PPTX library. Rejected because it would not preserve the supplied master shapes, icons, fonts, and positions.
- Use Office or LibreOffice conversion. Rejected because Vercel functions cannot depend on those runtimes.
- Use `pptx-automizer` over the master buffer. Chosen because it clones master slides and edits named shapes in Node.js.
- Render the stored PPTX in the browser after generation. Chosen because the viewer reads the authenticated, generated PPTX bytes locally and requires no Office service, server conversion, or document upload to a third party.

## Decision

The generator accepts only a `PresentationInput` DTO and a template `Buffer`. The route authenticates, loads and validates report data, downloads the template from Supabase Storage, then produces a generated buffer. No generator module queries the database or writes persistent files. Each call creates one `Automizer` instance.

### Generated PPTX Preview

The current-report preview endpoint invokes the same generator and template but does not reserve or store a version. The presentation history preview fetches the exact private PPTX bytes used by download. Both render in-browser with `@aiden0z/pptx-renderer`; no alternate slide model, server conversion, or external file service is involved.

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

The `presentation-templates` bucket must contain `status-weekly/v1/template.pptx` and permit authenticated users to download it. The original `Template(1).pptx` is required for an end-to-end integration fixture and shape-name verification.

## Template Storage Management

### Problem

Templates need immutable versioned storage without exposing an unprotected administrative upload endpoint. The current schema has no administrator role or server service-role configuration.

### Alternatives

- Add an authenticated upload route. Rejected because authentication alone does not establish administrator authorization.
- Add a service-role upload route and configuration. Rejected because no established service-role configuration or authorization boundary exists in this repository.
- Provide validated server-only storage utilities and private-bucket read access. Chosen because deployment administrators can upload a reviewed template through Supabase while application code remains safe to wire to a future authorized admin boundary.

### Decision

`presentationTemplatePath(version)` accepts only `v1`/`v1.0`-style versions and builds `status-weekly/<version>/template.pptx`. `uploadPresentationTemplate` validates extension, official PPTX MIME type, 25 MiB maximum size, and the required 10-slide PPTX ZIP structure entirely from a `Buffer`; it uploads with `upsert: false`. No filesystem persistence, upload route, or UI exists. The generation path reads `PPTX_TEMPLATE_VERSION` (default `v1`) from private Storage.

### Impact

Apply migration `0004_presentation_template_storage.sql`. It creates a private `presentation-templates` bucket and permits authenticated reads only for versioned Status Weekly templates. It intentionally creates no client upload policy. Before a future admin endpoint is added, establish an explicit administrator authorization model and keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
