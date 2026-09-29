# PPTX Generator Foundation

## Problem

The application has report data and an HTML preview but no serverless path to produce an editable PowerPoint while retaining the corporate master.

## Alternatives

- Redraw slides with a new PPTX library. Rejected because it would not preserve the supplied master shapes, icons, fonts, and positions.
- Use Office or LibreOffice conversion. Rejected because Vercel functions cannot depend on those runtimes.
- Use `pptx-automizer` over the master buffer. Chosen because it clones master slides and edits named shapes in Node.js.

## Decision

The generator accepts only a `PresentationInput` DTO and a template `Buffer`. The route authenticates, loads and validates report data, downloads the template from Supabase Storage, then returns the generated buffer. No generator module queries the database or writes persistent files. Each call creates one `Automizer` instance.

## Impact

The `presentation-templates` bucket must contain `status-weekly/v1/template.pptx` and permit authenticated report owners to download it. The original `Template(1).pptx` is required for an end-to-end integration fixture and shape-name verification.
