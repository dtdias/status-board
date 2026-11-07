# Template variations

`template-base.pptx` is the approved visual master (formerly `Template(1).pptx` at the repo root);
the other files are colour and typography variations of it, generated with the DeckCraft MCP
(`file.properties`, `font.replace`, `design.background`, `shape.fill`, `shape.line`,
`format.color`, `picture.change`). Author and company are `Statusboard` in every file.

| File | Style | Accent | Font |
| --- | --- | --- | --- |
| `template-base.pptx` | original: near-black cover/closing, light cards | `#FFD400` | Calibri |
| `navy-corporate.pptx` | dark navy cover/closing, cool light cards | `#3BA7F0` | Segoe UI |
| `light-minimal.pptx` | all-light, cover and closing inverted to light | `#2563EB` | Arial |
| `graphite-emerald.pptx` | graphite, green-tinted cards | `#10B981` | Calibri |
| `warm-terracotta.pptx` | espresso + cream background | `#E07A5F` | Georgia |

Previews: `previews/<name>-overview.png` (all 10 slides).

## What changes and what does not

- Changed: slide backgrounds, card/shape fills and outlines, text colours (per run), the yellow
  accent and near-black tones inside the PNG icons, and the font family.
- Preserved: slide count, order, shape names, positions, text, speaker notes, and the status
  colours (`#D7191C`, `#2E8B57`, `#2F5D8A`, `#C77700`), which the PRD fixes.

## Not wired into the app

These are design explorations. The app still uses
`presentation-templates/status-weekly/<version>/template.pptx` (default `v1`).
Uploading one of these as a template version has not been tested against the PPTX generator.
