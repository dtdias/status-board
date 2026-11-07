<#
.SYNOPSIS
  Tiles the 10 per-slide PNGs exported by DeckCraft (<Name>1.png ... <Name>10.png) into one overview image.
#>
param(
  [Parameter(Mandatory)] [string] $PreviewDir,
  [Parameter(Mandatory)] [string] $Name,
  [Parameter(Mandatory)] [string] $OutFile
)
Add-Type -AssemblyName System.Drawing
$files = 1..10 | ForEach-Object { Join-Path $PreviewDir ("{0}{1}.png" -f $Name, $_) }
foreach ($f in $files) { if (-not (Test-Path $f)) { throw "missing $f" } }
$cols = 4; $rows = 3; $tw = 480; $th = 270; $pad = 6
$sheet = New-Object System.Drawing.Bitmap(($cols * ($tw + $pad) + $pad), ($rows * ($th + $pad) + $pad))
$g = [System.Drawing.Graphics]::FromImage($sheet)
$g.Clear([System.Drawing.Color]::FromArgb(120, 120, 120))
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
for ($i = 0; $i -lt 10; $i++) {
  $img = [System.Drawing.Image]::FromFile($files[$i])
  $x = $pad + ($i % $cols) * ($tw + $pad); $y = $pad + [math]::Floor($i / $cols) * ($th + $pad)
  $g.DrawImage($img, $x, $y, $tw, $th); $img.Dispose()
}
$g.Dispose()
$sheet.Save($OutFile, [System.Drawing.Imaging.ImageFormat]::Png); $sheet.Dispose()
"sheet -> $OutFile"
