$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$jsonPath = Join-Path $root "outputs\field-mapping\KTNVL_K2_Field_Mapping_Review.json"

if (!(Test-Path $jsonPath)) {
  throw "Source JSON file not found: $jsonPath"
}

$payload = Get-Content -Path $jsonPath -Raw -Encoding UTF8 | ConvertFrom-Json
$outputPath = $payload.output_xlsx
$outputDir = Split-Path -Parent $outputPath

if (!(Test-Path $outputDir)) {
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

function Get-CellValue {
  param(
    [Parameter(Mandatory = $true)] $Row,
    [Parameter(Mandatory = $true)] [string] $PropertyName
  )

  $prop = $Row.PSObject.Properties[$PropertyName]
  if ($null -eq $prop) { return "" }
  if ($null -eq $prop.Value) { return "" }
  return [string]$prop.Value
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$workbook = $null

try {
  $workbook = $excel.Workbooks.Add()

  while ($workbook.Worksheets.Count -gt 1) {
    $workbook.Worksheets.Item($workbook.Worksheets.Count).Delete()
  }

  $firstSheet = $true

  foreach ($sheetData in $payload.sheets) {
    if ($firstSheet) {
      $ws = $workbook.Worksheets.Item(1)
      $firstSheet = $false
    }
    else {
      $ws = $workbook.Worksheets.Add()
    }

    $ws.Name = [string]$sheetData.name
    $headers = @($sheetData.headers)
    $headerCount = [Math]::Max($headers.Count, 1)

    $ws.Cells.Item(1, 1).Value2 = [string]$sheetData.subtitle
    $mergeRange = $ws.Range($ws.Cells.Item(1, 1), $ws.Cells.Item(1, $headerCount))
    $mergeRange.Merge()
    $mergeRange.Font.Bold = $true
    $mergeRange.Interior.Color = 15135470

    for ($i = 0; $i -lt $headers.Count; $i++) {
      $cell = $ws.Cells.Item(2, $i + 1)
      $cell.Value2 = [string]$headers[$i]
      $cell.Font.Bold = $true
      $cell.Font.Color = 16777215
      $cell.Interior.Color = 7105644
    }

    $rowIndex = 3

    foreach ($row in $sheetData.rows) {
      $sheetName = [string]$sheetData.name
      $values = @()

      if ($sheetName -in @("01_LSX_Fields", "02_NKNVL_Fields", "03_TonHopTho", "04_HaoHut", "05_GiaDinhMuc")) {
        $decision = Get-CellValue -Row $row -PropertyName "decision"
        if ([string]::IsNullOrWhiteSpace($decision)) {
          $decision = "Chua xac nhan"
        }

        $values = @(
          [string]($rowIndex - 2),
          (Get-CellValue -Row $row -PropertyName "module"),
          (Get-CellValue -Row $row -PropertyName "screen"),
          (Get-CellValue -Row $row -PropertyName "group"),
          (Get-CellValue -Row $row -PropertyName "label"),
          (Get-CellValue -Row $row -PropertyName "code"),
          (Get-CellValue -Row $row -PropertyName "description"),
          (Get-CellValue -Row $row -PropertyName "data_type"),
          (Get-CellValue -Row $row -PropertyName "required"),
          (Get-CellValue -Row $row -PropertyName "input_type"),
          $decision,
          (Get-CellValue -Row $row -PropertyName "source"),
          (Get-CellValue -Row $row -PropertyName "dropdown_code"),
          (Get-CellValue -Row $row -PropertyName "formula"),
          (Get-CellValue -Row $row -PropertyName "depends_on"),
          (Get-CellValue -Row $row -PropertyName "notes")
        )
      }
      elseif ($sheetName -eq "06_DropdownLists") {
        $values = @(
          [string]($rowIndex - 2),
          (Get-CellValue -Row $row -PropertyName "group"),
          (Get-CellValue -Row $row -PropertyName "module"),
          (Get-CellValue -Row $row -PropertyName "field_code"),
          (Get-CellValue -Row $row -PropertyName "value"),
          (Get-CellValue -Row $row -PropertyName "label"),
          (Get-CellValue -Row $row -PropertyName "note")
        )
      }
      elseif ($sheetName -eq "07_Logic_CongThuc" -or $sheetName -eq "08_Review_User") {
        $values = @($row)
      }

      for ($i = 0; $i -lt $values.Count; $i++) {
        $ws.Cells.Item($rowIndex, $i + 1).Value2 = [string]$values[$i]
      }

      $rowIndex++
    }

    $usedRange = $ws.UsedRange
    $usedRange.WrapText = $true
    $usedRange.VerticalAlignment = -4160
    $usedRange.Borders.LineStyle = 1
    $usedRange.Columns.AutoFit() | Out-Null

    $activeWindow = $excel.ActiveWindow
    if ($null -ne $activeWindow) {
      $activeWindow.SplitRow = 2
      $activeWindow.FreezePanes = $true
    }
  }

  $workbook.SaveAs($outputPath, 51)
  $workbook.Close($true)
}
finally {
  if ($null -ne $workbook) {
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($workbook) | Out-Null
  }
  if ($null -ne $excel) {
    $excel.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}

Write-Output $outputPath
