export interface ParsedContextFile {
  text: string
  fileType: string
  parseStatus: "parsed" | "partial" | "reference"
  parseNotes?: string
}

const MAX_CONTENT_LENGTH = 20000

function normalizeText(text: string) {
  return text.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim()
}

function truncateContent(text: string) {
  const normalized = normalizeText(text)
  return normalized.length > MAX_CONTENT_LENGTH
    ? `${normalized.slice(0, MAX_CONTENT_LENGTH).trim()}...`
    : normalized
}

async function parseTextFile(file: File): Promise<ParsedContextFile> {
  const text = truncateContent(await file.text())
  return {
    text,
    fileType: "Text",
    parseStatus: text ? "parsed" : "reference",
    parseNotes: text ? undefined : "No readable text was detected in this file.",
  }
}

async function parsePdfFile(file: File): Promise<ParsedContextFile> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
    const workerModule = await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")

    pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default

    const data = await file.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data }).promise
    const pages: string[] = []

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ")
      pages.push(pageText)
    }

    const text = truncateContent(pages.join("\n"))

    return {
      text,
      fileType: "PDF",
      parseStatus: text ? "parsed" : "reference",
      parseNotes: text ? undefined : "PDF opened, but no selectable text was found.",
    }
  } catch {
    return {
      text: "",
      fileType: "PDF",
      parseStatus: "reference",
      parseNotes: "PDF parsing failed. Stored as a reference-only document.",
    }
  }
}

async function parseDocxFile(file: File): Promise<ParsedContextFile> {
  try {
    const mammoth = await import("mammoth/mammoth.browser")
    const data = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: data })
    const text = truncateContent(result.value || "")

    return {
      text,
      fileType: "DOCX",
      parseStatus: text ? (result.messages?.length ? "partial" : "parsed") : "reference",
      parseNotes:
        result.messages?.length
          ? "DOCX parsed with minor conversion warnings."
          : text
            ? undefined
            : "DOCX parsed, but no readable text was found.",
    }
  } catch {
    return {
      text: "",
      fileType: "DOCX",
      parseStatus: "reference",
      parseNotes: "DOCX parsing failed. Stored as a reference-only document.",
    }
  }
}

export async function parseContextVaultFile(file: File): Promise<ParsedContextFile> {
  const lowerName = file.name.toLowerCase()

  if (
    file.type.startsWith("text/") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".txt")
  ) {
    return parseTextFile(file)
  }

  if (file.type === "application/pdf" || lowerName.endsWith(".pdf")) {
    return parsePdfFile(file)
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx")
  ) {
    return parseDocxFile(file)
  }

  return {
    text: "",
    fileType: lowerName.split(".").pop()?.toUpperCase() || "File",
    parseStatus: "reference",
    parseNotes: "This file type is not currently parsed. Stored as a reference-only document.",
  }
}
