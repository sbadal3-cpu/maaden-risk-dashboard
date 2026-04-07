import { type Risk, getRegionInfo, getRiskLevel, STAGES } from "./risk-data"

// ═══════════════════════════════════════════════════════════
// Ma'aden Corporate Excel Export Engine
// Generates XLSX-compatible XML SpreadsheetML workbooks
// Ma'aden Gold (#B4A56F) header | White text | SAR currency
// ═══════════════════════════════════════════════════════════

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function getStageName(stageKey: string): string {
  const stage = STAGES.find((s) => s.key === stageKey)
  return stage ? stage.label : stageKey
}

function getGateFromStage(stageKey: string): string {
  const stage = STAGES.find((s) => s.key === stageKey)
  return stage ? stage.gate : "N/A"
}

function buildWorkbookXml(risks: Risk[], sheetName: string, metadata?: { title?: string; generatedBy?: string }): string {
  const now = new Date().toISOString()
  const title = metadata?.title || "Ma'aden Master Risk Register"
  const generatedBy = metadata?.generatedBy || "Ma'aden Risk Command - AI Export Engine"

  // Column definitions matching Ma'aden Corporate Format
  const columns = [
    { header: "ID", width: 60 },
    { header: "Stage", width: 120 },
    { header: "Gate", width: 60 },
    { header: "Region", width: 90 },
    { header: "Risk Event", width: 280 },
    { header: "Category", width: 100 },
    { header: "Likelihood (L)", width: 80 },
    { header: "Impact (I)", width: 80 },
    { header: "Score (L x I)", width: 80 },
    { header: "Risk Level", width: 80 },
    { header: "Cause 1", width: 200 },
    { header: "Cause 2", width: 200 },
    { header: "Cause 3", width: 200 },
    { header: "Impact 1 (SAR)", width: 220 },
    { header: "Impact 2 (SAR)", width: 220 },
    { header: "Impact 3 (SAR)", width: 220 },
    { header: "Financial Exposure (SAR)", width: 160 },
    { header: "Gate Requirement", width: 220 },
    { header: "Owner", width: 120 },
    { header: "Mitigation Status", width: 90 },
    { header: "Source", width: 100 },
    { header: "Control 1", width: 200 },
    { header: "Control 2", width: 200 },
    { header: "Control 3", width: 200 },
    { header: "Last Updated", width: 90 },
    { header: "Cross-Border Impact", width: 300 },
  ]

  // Build column widths
  const columnDefs = columns
    .map((col, i) => `<Column ss:Index="${i + 1}" ss:AutoFitWidth="0" ss:Width="${col.width}"/>`)
    .join("\n      ")

  // Build header row with Ma'aden Gold background
  const headerCells = columns
    .map((col) => `<Cell ss:StyleID="sHeader"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>`)
    .join("\n        ")

  // Build data rows
  const dataRows = risks.map((risk) => {
    const regionInfo = getRegionInfo(risk.region)
    const level = getRiskLevel(risk.likelihood, risk.impact)
    const score = risk.likelihood * risk.impact

    // Determine risk level style
    let levelStyle = "sDefault"
    if (score >= 20) levelStyle = "sCritical"
    else if (score >= 12) levelStyle = "sHigh"
    else if (score >= 6) levelStyle = "sMedium"
    else levelStyle = "sLow"

    const statusStyle = risk.status === "opportunity" ? "sOpportunity" : levelStyle

    const cells = [
      `<Cell ss:StyleID="sID"><Data ss:Type="String">${escapeXml(risk.id)}</Data></Cell>`,
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(getStageName(risk.stage))}</Data></Cell>`,
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(getGateFromStage(risk.stage))}</Data></Cell>`,
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(regionInfo.label)}</Data></Cell>`,
      `<Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${escapeXml(risk.name)}</Data></Cell>`,
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(risk.category)}</Data></Cell>`,
      `<Cell ss:StyleID="sCenter"><Data ss:Type="Number">${risk.likelihood}</Data></Cell>`,
      `<Cell ss:StyleID="sCenter"><Data ss:Type="Number">${risk.impact}</Data></Cell>`,
      `<Cell ss:StyleID="${levelStyle}"><Data ss:Type="Number">${score}</Data></Cell>`,
      `<Cell ss:StyleID="${levelStyle}"><Data ss:Type="String">${escapeXml(level)}</Data></Cell>`,
      // Causes (up to 3 separate columns)
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(risk.causes[0] || "")}</Data></Cell>`,
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(risk.causes[1] || "")}</Data></Cell>`,
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(risk.causes[2] || "")}</Data></Cell>`,
      // Impacts (up to 3 separate columns, in SAR)
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(risk.impacts[0] || "")}</Data></Cell>`,
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(risk.impacts[1] || "")}</Data></Cell>`,
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(risk.impacts[2] || "")}</Data></Cell>`,
      // Financial exposure
      `<Cell ss:StyleID="sFinancial"><Data ss:Type="String">${escapeXml(risk.financialExposure || "Not quantified")}</Data></Cell>`,
      // Gate requirement
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(risk.gateRequirement || "N/A")}</Data></Cell>`,
      // Owner
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(risk.owner)}</Data></Cell>`,
      // Status
      `<Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${escapeXml(risk.status.charAt(0).toUpperCase() + risk.status.slice(1))}</Data></Cell>`,
      // Source
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(risk.source.toUpperCase())}</Data></Cell>`,
      // Controls (up to 3 separate columns)
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(risk.controls[0] || "")}</Data></Cell>`,
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(risk.controls[1] || "")}</Data></Cell>`,
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(risk.controls[2] || "")}</Data></Cell>`,
      // Last updated
      `<Cell ss:StyleID="sDate"><Data ss:Type="String">${escapeXml(risk.lastUpdated)}</Data></Cell>`,
      // Cross-border
      `<Cell ss:StyleID="sDefault"><Data ss:Type="String">${escapeXml(risk.crossBorderImpact || "")}</Data></Cell>`,
    ]

    return `      <Row ss:AutoFitHeight="0" ss:Height="22">\n        ${cells.join("\n        ")}\n      </Row>`
  })

  // Title row
  const titleRow = `      <Row ss:AutoFitHeight="0" ss:Height="32">
        <Cell ss:StyleID="sTitle" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">${escapeXml(title)}</Data></Cell>
      </Row>`

  // Metadata row
  const metaRow = `      <Row ss:AutoFitHeight="0" ss:Height="18">
        <Cell ss:StyleID="sMeta" ss:MergeAcross="${columns.length - 1}"><Data ss:Type="String">Generated: ${now} | ${generatedBy} | All financial values in SAR (Saudi Riyal) | Classification: INTERNAL</Data></Cell>
      </Row>`

  // Empty spacer row
  const spacerRow = `      <Row ss:AutoFitHeight="0" ss:Height="8"/>`

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>${escapeXml(title)}</Title>
    <Author>Ma&apos;aden Risk Command</Author>
    <Company>Saudi Arabian Mining Company (Ma&apos;aden)</Company>
    <Created>${now}</Created>
  </DocumentProperties>
  <Styles>
    <!-- Ma'aden Gold Header: #B4A56F bg, White text, Bold -->
    <Style ss:ID="sHeader">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#8A7D52"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#8A7D52"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#8A7D52"/>
      </Borders>
      <Font ss:FontName="Calibri" ss:Size="10" ss:Color="#FFFFFF" ss:Bold="1"/>
      <Interior ss:Color="#B4A56F" ss:Pattern="Solid"/>
    </Style>
    <!-- Title bar -->
    <Style ss:ID="sTitle">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="14" ss:Color="#B4A56F" ss:Bold="1"/>
      <Interior ss:Color="#1C1C1B" ss:Pattern="Solid"/>
    </Style>
    <!-- Metadata row -->
    <Style ss:ID="sMeta">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Font ss:FontName="Calibri" ss:Size="8" ss:Color="#8A8577" ss:Italic="1"/>
      <Interior ss:Color="#242422" ss:Pattern="Solid"/>
    </Style>
    <!-- Default body -->
    <Style ss:ID="sDefault">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F0F0F0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#F0F0F0"/>
      </Borders>
      <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#333333"/>
    </Style>
    <!-- ID column -->
    <Style ss:ID="sID">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
      </Borders>
      <Font ss:FontName="Consolas" ss:Size="9" ss:Color="#666666"/>
    </Style>
    <!-- Centered -->
    <Style ss:ID="sCenter">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
      </Borders>
      <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#333333" ss:Bold="1"/>
    </Style>
    <!-- Financial -->
    <Style ss:ID="sFinancial">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
      </Borders>
      <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#B4A56F" ss:Bold="1"/>
    </Style>
    <!-- Date -->
    <Style ss:ID="sDate">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
      </Borders>
      <Font ss:FontName="Consolas" ss:Size="8" ss:Color="#888888"/>
    </Style>
    <!-- Critical level (red text) -->
    <Style ss:ID="sCritical">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
      </Borders>
      <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#FFFFFF" ss:Bold="1"/>
      <Interior ss:Color="#E05252" ss:Pattern="Solid"/>
    </Style>
    <!-- High level (orange text) -->
    <Style ss:ID="sHigh">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
      </Borders>
      <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#FFFFFF" ss:Bold="1"/>
      <Interior ss:Color="#E8A54F" ss:Pattern="Solid"/>
    </Style>
    <!-- Medium level (gold) -->
    <Style ss:ID="sMedium">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
      </Borders>
      <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#FFFFFF" ss:Bold="1"/>
      <Interior ss:Color="#B4A56F" ss:Pattern="Solid"/>
    </Style>
    <!-- Low level (teal) -->
    <Style ss:ID="sLow">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
      </Borders>
      <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#FFFFFF" ss:Bold="1"/>
      <Interior ss:Color="#5CB4A5" ss:Pattern="Solid"/>
    </Style>
    <!-- Opportunity (gold background) -->
    <Style ss:ID="sOpportunity">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E0E0E0"/>
      </Borders>
      <Font ss:FontName="Calibri" ss:Size="9" ss:Color="#1C1C1B" ss:Bold="1"/>
      <Interior ss:Color="#B4A56F" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(sheetName)}">
    <Table ss:ExpandedColumnCount="${columns.length}" ss:ExpandedRowCount="${risks.length + 4}" x:FullColumns="1" x:FullRows="1">
      ${columnDefs}
${titleRow}
${metaRow}
${spacerRow}
      <Row ss:AutoFitHeight="0" ss:Height="28">
        ${headerCells}
      </Row>
${dataRows.join("\n")}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <PageSetup>
        <Layout x:Orientation="Landscape"/>
        <Header x:Margin="0.3"/>
        <Footer x:Margin="0.3"/>
      </PageSetup>
      <FitToPage/>
      <Print>
        <FitWidth>1</FitWidth>
        <FitHeight>0</FitHeight>
      </Print>
      <FreezePanes/>
      <FrozenNoSplit/>
      <SplitHorizontal>4</SplitHorizontal>
      <TopRowBottomPane>4</TopRowBottomPane>
      <ActivePane>2</ActivePane>
    </WorksheetOptions>
  </Worksheet>
</Workbook>`
}

function downloadXml(xml: string, filename: string) {
  const blob = new Blob([xml], { type: "application/vnd.ms-excel" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export the full Master Risk Register to Excel
 */
export function exportMasterRiskRegister(allRisks: Risk[]) {
  const sorted = [...allRisks].sort((a, b) => {
    const stageOrder = ["exploration", "fel1", "fel2", "fel3", "execution", "operations"]
    const stageA = stageOrder.indexOf(a.stage)
    const stageB = stageOrder.indexOf(b.stage)
    if (stageA !== stageB) return stageA - stageB
    return b.likelihood * b.impact - a.likelihood * a.impact
  })

  const xml = buildWorkbookXml(sorted, "Master Risk Register", {
    title: "Ma'aden Master Risk Register - Full 200+ Universe",
    generatedBy: "Ma'aden Risk Command - Global Export Engine",
  })

  const dateStr = new Date().toISOString().slice(0, 10)
  downloadXml(xml, `Maaden_Master_Risk_Register_${dateStr}.xls`)
}

/**
 * Export a filtered set of risks from AI analysis to Excel
 */
export function exportAIAnalysis(filteredRisks: Risk[], analysisTitle: string) {
  const sorted = [...filteredRisks].sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact)

  const xml = buildWorkbookXml(sorted, "AI Analysis", {
    title: `Ma'aden AI Analysis: ${analysisTitle}`,
    generatedBy: "Ma'aden Risk Command - AI Advisor Export",
  })

  const dateStr = new Date().toISOString().slice(0, 10)
  const safeTitle = analysisTitle.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40)
  downloadXml(xml, `Maaden_AI_Analysis_${safeTitle}_${dateStr}.xls`)
}

/**
 * Parse an AI response to find risk IDs mentioned and return matching risks
 */
export function extractRisksFromResponse(responseText: string, allRisks: Risk[]): Risk[] {
  const riskIdPattern = /\b(R-\d{3}|RG-\d{3})\b/g
  const foundIds = new Set<string>()
  let match: RegExpExecArray | null

  while ((match = riskIdPattern.exec(responseText)) !== null) {
    foundIds.add(match[1])
  }

  if (foundIds.size === 0) {
    // Try matching by risk name keywords from the response
    const lower = responseText.toLowerCase()
    return allRisks.filter((r) => {
      const nameWords = r.name.toLowerCase().split(" ").filter((w) => w.length > 4)
      return nameWords.some((word) => lower.includes(word))
    }).slice(0, 20)
  }

  return allRisks.filter((r) => foundIds.has(r.id))
}
