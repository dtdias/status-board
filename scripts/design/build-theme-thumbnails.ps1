<#
.SYNOPSIS
  Builds the theme picker thumbnails (public/template-themes/<id>.png) from the overview sheets in
  design/template-variations/previews. Each thumbnail pairs the cover (slide 4) with the deliveries
  slide (slide 6) of the overview tiling produced by build-contact-sheet.ps1.
#>
param(
  [string] $PreviewDir = (Join-Path $PSScriptRoot "..\..\design\template-variations\previews"),
  [string] $OutDir = (Join-Path $PSScriptRoot "..\..\public\template-themes")
)
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force $OutDir | Out-Null

# Overview geometry (see build-contact-sheet.ps1): 4 columns, 480x270 tiles, 6px padding.
$tw = 480; $th = 270; $pad = 6; $cols = 4
function TileRect([int] $index) {
  New-Object System.Drawing.Rectangle(($pad + ($index % $cols) * ($tw + $pad)), ($pad + [math]::Floor($index / $cols) * ($th + $pad)), $tw, $th)
}

$themes = @{
  "base" = "template-base"
  "navy-corporate" = "navy-corporate"
  "light-minimal" = "light-minimal"
  "graphite-emerald" = "graphite-emerald"
  "warm-terracotta" = "warm-terracotta"
}
$w = 320; $h = 180; $gap = 8

foreach ($id in $themes.Keys) {
  $source = Join-Path $PreviewDir ("{0}-overview.png" -f $themes[$id])
  if (-not (Test-Path $source)) { throw "missing $source" }
  $sheet = [System.Drawing.Image]::FromFile($source)
  $thumb = New-Object System.Drawing.Bitmap(($w * 2 + $gap), $h)
  $g = [System.Drawing.Graphics]::FromImage($thumb)
  $g.Clear([System.Drawing.Color]::White)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($sheet, (New-Object System.Drawing.Rectangle(0, 0, $w, $h)), (TileRect 3), [System.Drawing.GraphicsUnit]::Pixel)
  $g.DrawImage($sheet, (New-Object System.Drawing.Rectangle(($w + $gap), 0, $w, $h)), (TileRect 5), [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose(); $sheet.Dispose()
  $out = Join-Path $OutDir ("{0}.png" -f $id)
  $thumb.Save($out, [System.Drawing.Imaging.ImageFormat]::Png); $thumb.Dispose()
  "thumbnail -> $out"
}
