param(
	[Parameter(Mandatory = $true)]
	[string]$InputDir,

	[ValidateSet('webp', 'avif')]
	[string]$Format = 'webp',

	[string]$OutDir,

	# WebP 0-100. ~78 is around the 20kb you were getting.
	[int]$Quality = 78,

	# AVIF CRF 0-63, lower = larger. ~32 is around the 10kb you were getting.
	[int]$Crf = 32,

	[int]$Width = 0,

	# Raw ffmpeg crop expression, e.g. 'w:h:x:y'. Applied before the resize so
	# the output spends all its pixels on the subject instead of empty margin.
	[string]$Crop
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
	Write-Error 'ffmpeg not found on PATH.'
}

$src = Resolve-Path $InputDir
if (-not $OutDir) {
	$OutDir = Join-Path $src.Path $Format
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$files = Get-ChildItem -Path $src.Path -File | Where-Object {
	$_.Extension -match '\.(png|jpe?g|tif{1,2}|bmp|webp)$'
}

if ($files.Count -eq 0) {
	Write-Error "No images found in $src"
}

$filters = @()
if ($Crop) { $filters += "crop=$Crop" }
if ($Width -gt 0) { $filters += "scale=${Width}:-1:flags=lanczos" }
$vf = if ($filters.Count -gt 0) { $filters -join ',' } else { $null }

Write-Host "Compressing $($files.Count) images -> $OutDir ($Format)"
if ($vf) { Write-Host "  filters: $vf" }

$i = 0
foreach ($file in $files) {
	$i++
	$out = Join-Path $OutDir ($file.BaseName + ".$Format")
	$args = @('-y', '-i', $file.FullName)
	if ($vf) { $args += @('-vf', $vf) }

	if ($Format -eq 'webp') {
		$args += @(
			'-c:v', 'libwebp',
			'-quality', "$Quality",
			'-compression_level', '6',
			'-preset', 'photo',
			$out
		)
	} else {
		$args += @(
			'-c:v', 'libaom-av1',
			'-still-picture', '1',
			'-crf', "$Crf",
			'-cpu-used', '4',
			$out
		)
	}

	& ffmpeg @args -hide_banner -loglevel error
	if ($LASTEXITCODE -ne 0) {
		Write-Error "ffmpeg failed on $($file.Name)"
	}
	Write-Host "[$i/$($files.Count)] $($file.Name)"
}

Write-Host "Done. $($files.Count) files in $OutDir"
