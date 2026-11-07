<#
.SYNOPSIS
  Builds colour/typography variations of template-base.pptx by patching the package XML directly.

.DESCRIPTION
  Only three things change per variation:
    1. srgbClr values in ppt/slides/slide*.xml (background, shape fill, outline, text colour),
    2. explicit font families (slides, layouts, masters, theme latin fonts),
    3. the PNG icons in ppt/media (yellow accent / near-black recoloured).
  Geometry, anchors, alignment, insets, shape names, text and notes are never touched, so the
  layout stays byte-identical to the base. The script verifies that before finishing.
  Status colours (#D7191C #2E8B57 #2F5D8A #C77700) are intentionally left as the PRD fixes them.
#>
param(
  [string] $Base   = "design/template-variations/template-base.pptx",
  [string] $OutDir = "design/template-variations",
  [string[]] $Only
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem, System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;

public class Palette {
  Dictionary<string, string> basemap = new Dictionary<string, string>();
  Dictionary<string, string> darkOv = new Dictionary<string, string>();
  Dictionary<string, string> lightOv = new Dictionary<string, string>();
  HashSet<int> darkSlides = new HashSet<int>();
  public string Font;
  public void SetBase(string from, string to) { basemap[from.ToUpperInvariant()] = to.ToUpperInvariant(); }
  public void SetOv(bool dark, string kind, string from, string to) { (dark ? darkOv : lightOv)[kind + ":" + from.ToUpperInvariant()] = to.ToUpperInvariant(); }
  public void MarkDark(int idx) { darkSlides.Add(idx); }
  public string Map(string kind, int idx, string hex) {
    hex = hex.ToUpperInvariant();
    string key = (kind == "line" ? "fill" : kind) + ":" + hex, v;
    var ov = darkSlides.Contains(idx) ? darkOv : lightOv;
    if (ov.TryGetValue(key, out v)) return v;
    return basemap.TryGetValue(hex, out v) ? v : hex;
  }
}

public static class XmlPatch {
  // Tracks the innermost colour context so fill / outline / text / background are told apart.
  static readonly Regex Tok = new Regex(
    @"<(/?)(p:bg|a:ln|a:rPr|a:endParaRPr|a:defRPr|p:spPr)\b[^>]*?(/?)>|<a:srgbClr val=""([0-9A-Fa-f]{6})""",
    RegexOptions.Compiled);

  public static string Colors(string xml, int idx, Palette p) {
    var stack = new Stack<string>();
    var sb = new StringBuilder();
    int last = 0;
    foreach (Match m in Tok.Matches(xml)) {
      if (m.Groups[4].Success) {
        string ctx = stack.Count == 0 ? null : stack.Peek();
        string kind = ctx == "p:bg" ? "bg" : ctx == "a:ln" ? "line" : ctx == "p:spPr" ? "fill" : ctx != null ? "text" : null;
        if (kind == null) continue;
        sb.Append(xml, last, m.Index - last);
        sb.Append("<a:srgbClr val=\"" + p.Map(kind, idx, m.Groups[4].Value) + "\"");
        last = m.Index + m.Length;
      } else {
        bool closing = m.Groups[1].Value == "/", selfClosing = m.Groups[3].Value == "/";
        if (closing) { if (stack.Count > 0) stack.Pop(); }
        else if (!selfClosing) stack.Push(m.Groups[2].Value);
      }
    }
    sb.Append(xml, last, xml.Length - last);
    return sb.ToString();
  }

  public static string Fonts(string xml, string font, bool themeLatinOnly) {
    if (themeLatinOnly)
      return Regex.Replace(xml, @"<a:latin typeface=""(Calibri Light|Calibri|Arial)""", "<a:latin typeface=\"" + font + "\"");
    return Regex.Replace(xml, @"typeface=""(Calibri Light|Calibri|Arial)""", "typeface=\"" + font + "\"");
  }
}

public static class IconRecolor {
  static double[] Hsv(int r, int g, int b) {
    double rf = r / 255.0, gf = g / 255.0, bf = b / 255.0;
    double mx = Math.Max(rf, Math.Max(gf, bf)), mn = Math.Min(rf, Math.Min(gf, bf)), d = mx - mn, h = 0;
    if (d > 0) {
      if (mx == rf) h = 60 * (((gf - bf) / d) % 6);
      else if (mx == gf) h = 60 * (((bf - rf) / d) + 2);
      else h = 60 * (((rf - gf) / d) + 4);
      if (h < 0) h += 360;
    }
    return new double[] { h, mx == 0 ? 0 : d / mx, mx };
  }
  static byte L(int a, int b, double t) { return (byte)Math.Max(0, Math.Min(255, Math.Round(a + (b - a) * t))); }

  public static byte[] Run(byte[] png, int[] dark, int[] acc) {
    using (var ms = new MemoryStream(png))
    using (var bmp = new Bitmap(ms)) {
      var rect = new Rectangle(0, 0, bmp.Width, bmp.Height);
      var data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
      int n = Math.Abs(data.Stride) * bmp.Height;
      byte[] px = new byte[n];
      Marshal.Copy(data.Scan0, px, 0, n);
      for (int i = 0; i < n; i += 4) {
        int b = px[i], g = px[i + 1], r = px[i + 2], a = px[i + 3];
        if (a == 0) continue;
        var hsv = Hsv(r, g, b);
        double h = hsv[0], s = hsv[1], v = hsv[2];
        double t = Math.Max(0, Math.Min(1, (v - 0.13) / 0.87));
        if (s > 0.45 && h >= 44 && h <= 62) {            // yellow family -> accent
          px[i + 2] = L(dark[0], acc[0], t); px[i + 1] = L(dark[1], acc[1], t); px[i] = L(dark[2], acc[2], t);
        } else if (s < 0.25 && v < 0.35) {                // near-black -> variation dark
          px[i + 2] = (byte)dark[0]; px[i + 1] = (byte)dark[1]; px[i] = (byte)dark[2];
        } else if (s < 0.25) {                            // neutral mid greys -> dark..white blend
          px[i + 2] = L(dark[0], 255, t); px[i + 1] = L(dark[1], 255, t); px[i] = L(dark[2], 255, t);
        }                                                 // status colours stay as they are
      }
      Marshal.Copy(px, 0, data.Scan0, n);
      bmp.UnlockBits(data);
      using (var o = new MemoryStream()) { bmp.Save(o, ImageFormat.Png); return o.ToArray(); }
    }
  }
}
'@

function ToRgb([string] $h) { return [int[]]@([Convert]::ToInt32($h.Substring(0,2),16), [Convert]::ToInt32($h.Substring(2,2),16), [Convert]::ToInt32($h.Substring(4,2),16)) }

function New-Palette($v) {
  $p = New-Object Palette
  $p.Font = $v.Font
  foreach ($k in $v.Base.Keys)    { $p.SetBase($k, $v.Base[$k]) }
  foreach ($d in 3, 9)            { $p.MarkDark($d) }   # zero-based: cover and closing slides
  foreach ($kind in $v.DarkOv.Keys)  { foreach ($k in $v.DarkOv[$kind].Keys)  { $p.SetOv($true,  $kind, $k, $v.DarkOv[$kind][$k]) } }
  foreach ($kind in $v.LightOv.Keys) { foreach ($k in $v.LightOv[$kind].Keys) { $p.SetOv($false, $kind, $k, $v.LightOv[$kind][$k]) } }
  return $p
}

# Source tones in the base: 1C1C1C 2B2B2B 222222 000000 6B6B6B 8A8A8A A6A6A6 BFBFBF D9D9D9 F3F3F3 FFD400 (FFFFFF kept).
$variants = @(
  @{ Name='navy-corporate'; Title='Navy Corporate'; Font='Segoe UI'; Dark='0F2A44'; Accent='3BA7F0'
     Base=@{ '1C1C1C'='0F2A44'; '2B2B2B'='1A3D63'; '222222'='10243A'; '000000'='10243A'; '6B6B6B'='4A6178'; '8A8A8A'='6F8499'; 'A6A6A6'='9FB2C4'; 'BFBFBF'='B6C6D6'; 'D9D9D9'='D5E0EB'; 'F3F3F3'='EAF1F8'; 'FFD400'='3BA7F0' }
     DarkOv=@{}; LightOv=@{} },
  @{ Name='light-minimal'; Title='Light Minimal'; Font='Arial'; Dark='0B1F4D'; Accent='3B82F6'
     Base=@{ '1C1C1C'='0B1F4D'; '2B2B2B'='EEF2F7'; '222222'='1F2937'; '000000'='1F2937'; '6B6B6B'='4B5563'; '8A8A8A'='6B7280'; 'A6A6A6'='94A3B8'; 'BFBFBF'='CBD5E1'; 'D9D9D9'='E2E8F0'; 'F3F3F3'='F1F5F9'; 'FFD400'='2563EB' }
     DarkOv=@{ bg=@{ '1C1C1C'='F8FAFC' }; fill=@{ '1C1C1C'='F8FAFC'; '2B2B2B'='EEF2F7' }
               text=@{ 'FFFFFF'='1F2937'; 'D9D9D9'='475569'; 'A6A6A6'='64748B'; 'BFBFBF'='64748B'; '8A8A8A'='64748B'; 'FFD400'='2563EB' } }
     LightOv=@{ text=@{ 'FFD400'='60A5FA'; 'BFBFBF'='CBD5E1' } } },
  @{ Name='graphite-emerald'; Title='Graphite Emerald'; Font='Calibri'; Dark='1E2422'; Accent='10B981'
     Base=@{ '1C1C1C'='1E2422'; '2B2B2B'='2C3633'; '222222'='1B2421'; '000000'='1B2421'; '6B6B6B'='5A6B66'; '8A8A8A'='7E908A'; 'A6A6A6'='A3B3AD'; 'BFBFBF'='BBC9C4'; 'D9D9D9'='D8E3DF'; 'F3F3F3'='E6F1EC'; 'FFD400'='10B981' }
     DarkOv=@{}; LightOv=@{} },
  # Cambria, not Georgia: Georgia's old-style figures drop 3/4/5/7/9 below the baseline and look misaligned in the numbered circles.
  @{ Name='warm-terracotta'; Title='Warm Terracotta'; Font='Cambria'; Dark='2B1D17'; Accent='E07A5F'
     Base=@{ '1C1C1C'='2B1D17'; '2B2B2B'='3B2A21'; '222222'='2B1D17'; '000000'='2B1D17'; '6B6B6B'='7A5F52'; '8A8A8A'='A08577'; 'A6A6A6'='B79F92'; 'BFBFBF'='CDB9AD'; 'D9D9D9'='E8DCD3'; 'F3F3F3'='F1E4D8'; 'FFD400'='E07A5F' }
     DarkOv=@{}; LightOv=@{ bg=@{ 'FFFFFF'='FBF6F0' } } }
)
if ($Only) { $variants = $variants | Where-Object { $Only -contains $_.Name } }

$baseFull = (Resolve-Path $Base).Path
$outFull  = (Resolve-Path $OutDir).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Read-Text($entry) { $r = New-Object IO.StreamReader($entry.Open(), $utf8, $true); try { $r.ReadToEnd() } finally { $r.Close() } }
function Read-Bytes($entry) { $s = $entry.Open(); $ms = New-Object IO.MemoryStream; try { $s.CopyTo($ms) } finally { $s.Close() }; return ,$ms.ToArray() }

foreach ($v in $variants) {
  $pal = New-Palette $v
  $dark = ToRgb $v.Dark; $acc = ToRgb $v.Accent
  $target = Join-Path $outFull ($v.Name + '.pptx')
  $tmp = $target + '.tmp'
  if (Test-Path $tmp) { Remove-Item $tmp -Force }

  $src = [IO.Compression.ZipFile]::OpenRead($baseFull)
  $dst = [IO.Compression.ZipFile]::Open($tmp, 'Create')
  try {
    foreach ($e in $src.Entries) {
      $name = $e.FullName
      $new = $null
      if ($name -match '^ppt/slides/slide(\d+)\.xml$') {
        $x = Read-Text $e
        $x = [XmlPatch]::Colors($x, [int]$Matches[1] - 1, $pal)
        $new = $utf8.GetBytes([XmlPatch]::Fonts($x, $v.Font, $false))
      } elseif ($name -match '^ppt/(slideLayouts|slideMasters)/[^/]+\.xml$') {
        $new = $utf8.GetBytes([XmlPatch]::Fonts((Read-Text $e), $v.Font, $false))
      } elseif ($name -match '^ppt/theme/theme\d+\.xml$') {
        $new = $utf8.GetBytes([XmlPatch]::Fonts((Read-Text $e), $v.Font, $true))
      } elseif ($name -match '^ppt/media/[^/]+\.png$') {
        $new = [IconRecolor]::Run((Read-Bytes $e), $dark, $acc)
      } elseif ($name -eq 'docProps/core.xml') {
        $x = Read-Text $e
        $x = [regex]::Replace($x, '<dc:title>[^<]*</dc:title>', '<dc:title>Template | Status Semanal - ' + $v.Title + '</dc:title>')
        $new = $utf8.GetBytes($x)
      }
      $out = $dst.CreateEntry($name, [IO.Compression.CompressionLevel]::Optimal)
      $out.LastWriteTime = $e.LastWriteTime
      $os = $out.Open()
      try {
        if ($null -ne $new) { $os.Write($new, 0, $new.Length) }
        else { $is = $e.Open(); try { $is.CopyTo($os) } finally { $is.Close() } }
      } finally { $os.Close() }
    }
  } finally { $dst.Dispose(); $src.Dispose() }

  Move-Item $tmp $target -Force
  "built $($v.Name) -> $target ($([math]::Round((Get-Item $target).Length / 1KB)) KB)"
}

# ---- verification: layout must be identical to the base once colours and fonts are normalised ----
function Normalize([string] $x) {
  $x = [regex]::Replace($x, '<a:srgbClr val="[0-9A-Fa-f]{6}"', '<a:srgbClr val="X"')
  return [regex]::Replace($x, 'typeface="[^"]*"', 'typeface="T"')
}
$fail = 0
$bz = [IO.Compression.ZipFile]::OpenRead($baseFull)
try {
  foreach ($v in $variants) {
    $vz = [IO.Compression.ZipFile]::OpenRead((Join-Path $outFull ($v.Name + '.pptx')))
    try {
      $problems = @()
      if ($bz.Entries.Count -ne $vz.Entries.Count) { $problems += "entry count $($bz.Entries.Count) vs $($vz.Entries.Count)" }
      foreach ($e in $bz.Entries) {
        $ve = $vz.GetEntry($e.FullName)
        if (-not $ve) { $problems += "missing $($e.FullName)"; continue }
        $n = $e.FullName
        if ($n -match '^ppt/(slides|slideLayouts|slideMasters|theme)/[^/]+\.xml$') {
          if ((Normalize (Read-Text $e)) -ne (Normalize (Read-Text $ve))) { $problems += "layout differs: $n" }
        } elseif ($n -match '^ppt/media/' -or $n -eq 'docProps/core.xml') {
          # recoloured icons / title: expected to differ
        } else {
          $a = Read-Bytes $e; $b = Read-Bytes $ve
          if ([Convert]::ToBase64String($a) -ne [Convert]::ToBase64String($b)) { $problems += "bytes differ: $n" }
        }
      }
      if ($problems.Count) { $fail++; "VERIFY FAIL $($v.Name): $($problems -join '; ')" } else { "verify ok  $($v.Name): $($vz.Entries.Count) entries, layout identical to base" }
    } finally { $vz.Dispose() }
  }
} finally { $bz.Dispose() }
if ($fail) { exit 1 }
