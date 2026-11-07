# Template variations

`template-base.pptx` is the approved visual master (formerly `Template(1).pptx` at the repo root);
the other files are colour and typography variations of it. Author and company are `Statusboard`
in every file.

| File | Style | Accent | Font |
| --- | --- | --- | --- |
| `template-base.pptx` | original: near-black cover/closing, light cards | `#FFD400` | Calibri |
| `navy-corporate.pptx` | dark navy cover/closing, cool light cards | `#3BA7F0` | Segoe UI |
| `light-minimal.pptx` | all-light, cover and closing inverted to light | `#2563EB` | Arial |
| `graphite-emerald.pptx` | graphite, green-tinted cards | `#10B981` | Calibri |
| `warm-terracotta.pptx` | espresso + cream background | `#E07A5F` | Cambria |

Previews: `previews/<name>-overview.png` (all 10 slides).

## How they are built

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/design/build-template-variations.ps1
```

The script patches the package XML of `template-base.pptx` directly (Windows PowerShell 5.1,
`System.Drawing`). It changes only:

- `srgbClr` values in `ppt/slides/slide*.xml` (background, fill, outline, text), told apart by context;
- explicit font families in slides, layouts, masters and the theme's latin fonts;
- the PNG icons in `ppt/media` (yellow accent and near-black tones recoloured).

Geometry, anchors, alignment, insets, shape names, text and speaker notes are never touched. The
script ends by checking that every slide, layout, master and theme is identical to the base once
colours and fonts are normalised, and that all other package entries are byte-identical. It exits
non-zero if not.

Do not recolour these decks by editing text through DeckCraft (`format.color`): in DeckCraft 0.16.0
that shifts the text anchor and pushes the numbers in the "Demandas novas" circles to the top.
Use DeckCraft to open, inspect and render them. Previews were exported that way and tiled with
`scripts/design/build-contact-sheet.ps1`.

## Fonts

Terracotta uses Cambria rather than Georgia: Georgia's old-style figures drop 3, 4, 5, 7 and 9
below the baseline, which looks misaligned inside the numbered circles and page numbers.

The status colours (`#D7191C`, `#2E8B57`, `#2F5D8A`, `#C77700`) are left as the PRD fixes them. The
white step numbers on the grey "3" and "4" circles have low contrast, as in the base template.

## Wired into the app as presentation themes

Each file is a selectable theme in the "Gerar PowerPoint" picker (see
`docs/template-administration.md`). `template-base.pptx` is the `base` theme
(`presentation-templates/status-weekly/<version>/template.pptx`); the others are published at
`status-weekly/<version>/themes/<name>.pptx`.
`tests/unit/pptx-themes.integration.test.ts` runs the generator on every file here and checks the
11-slide output, content, placeholders and unique shape ids. If you rebuild the variations, rerun
`scripts/design/build-theme-thumbnails.ps1` to refresh `public/template-themes/`.
