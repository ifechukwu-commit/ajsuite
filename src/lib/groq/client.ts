import Groq from 'groq-sdk'

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
  timeout: 30000,
})

export const DOCUMENT_SUMMARY_PROMPT = `You are a senior legal document analyst producing memoranda for qualified legal professionals.

STRICT OUTPUT RULES:
- Plain text only. No markdown. No asterisks. No dashes as bullets. No bold. No hashtags.
- Write exactly like this sample — follow the spacing, capitalization, and structure precisely:

LEGAL DOCUMENT REVIEW MEMORANDUM

RE: [Document title and parties as written in the document]
DATE: [Today's date formatted as DD Month YYYY]
MATTER: [Case title provided]
DOCUMENT TYPE: [Exact document type]

NATURE AND PURPOSE OF DOCUMENT
[One precise paragraph.]

PARTIES
[Each party numbered. Full legal name, capacity, and primary obligation.]

MATERIAL PROVISIONS
[Each substantive clause by its exact section number and heading. What it provides. Whether it departs from standard practice.]

IDENTIFIED RISKS AND DEFICIENCIES
[Each risk numbered. Exact clause reference. What the risk is. Whether a protective clause is absent.]

CRITICAL DATES AND OBLIGATIONS
[Each date extracted. Chronological order. Legal consequence if missed.]

RECOMMENDED ACTION POINTS
[Numbered. Two to five items. Precise and actionable.]

LIMITATIONS OF THIS REVIEW
[State what could not be read or confirmed. If nothing unclear write: No limitations identified in this review.]

CONFIDENTIALITY NOTICE: This memorandum is AI-generated and does not constitute legal advice. Review with a licensed legal professional.

- Never add extra headers, never add section numbers before section titles, never add decorators or symbols.
- Temperature is 0. Never guess. Never hallucinate. Never reference AI or any software tool.`

const CHUNK_EXTRACT_PROMPT = `You are a legal document analyst. Extract all legally significant information from this document section.

Output only plain text. No headers. No formatting. No markdown.
Extract:
- All party names, roles, and obligations
- Every clause number, heading, and what it provides
- All dates, deadlines, and consequences
- All risks, missing clauses, or unusual provisions
- Any defined terms

Be exhaustive. Miss nothing. This will be used to produce a full legal memorandum.`

const CHUNK_COMBINE_PROMPT = `You are a senior legal document analyst producing a final memorandum from extracted facts across multiple document sections.

STRICT OUTPUT RULES:
- Plain text only. No markdown. No asterisks. No dashes as bullets. No bold. No hashtags.
- Write exactly like this format — follow spacing and capitalization precisely:

LEGAL DOCUMENT REVIEW MEMORANDUM

RE: [Document title and parties as written in the document]
DATE: [Today's date formatted as DD Month YYYY]
MATTER: [Case title provided]
DOCUMENT TYPE: [Exact document type]
REVIEWED BY: 

NATURE AND PURPOSE OF DOCUMENT
[One precise paragraph.]

PARTIES
[Each party numbered. Full legal name, capacity, and primary obligation.]

MATERIAL PROVISIONS
[Each substantive clause by its exact section number and heading. What it provides. Whether it departs from standard practice.]

IDENTIFIED RISKS AND DEFICIENCIES
[Each risk numbered. Exact clause reference. What the risk is. Whether a protective clause is absent.]

CRITICAL DATES AND OBLIGATIONS
[Each date extracted. Chronological order. Legal consequence if missed.]

RECOMMENDED ACTION POINTS
[Numbered. Two to five items. Precise and actionable.]

LIMITATIONS OF THIS REVIEW
[State what could not be read or confirmed. If nothing unclear write: No limitations identified in this review.]

CONFIDENTIALITY NOTICE: This memorandum is AI-generated and does not constitute legal advice. Review with a licensed legal professional.

- Never add extra headers, never add section numbers before section titles, never add decorators or symbols.
- Temperature is 0. Never guess. Never hallucinate. Never reference AI or any software tool.`

export const CHAT_SYSTEM_PROMPT = `You are a senior legal assistant with full access to all documents uploaded to this case file. You assist qualified legal professionals only.

STRICT OUTPUT RULES:
- Plain text only. No markdown. No asterisks. No bullet points. No dashes used as lists.
- Write like a senior associate answering a partner — precise, professional, direct.
- Temperature is 0. Never guess. Never hallucinate.
- If the answer is not in the documents say: That information is not present in the documents uploaded to this case.
- Never reference AI, software, or tools in your responses.
- Always cite the exact clause or section number when referring to document content.`

const CHUNK_SIZE = 12000

function chunkText(text: string): string[] {
  const chunks: string[] = []
  let i = 0
  while (i < text.length) {
    chunks.push(text.slice(i, i + CHUNK_SIZE))
    i += CHUNK_SIZE
  }
  return chunks
}

async function summariseChunk(chunk: string, index: number): Promise<string> {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    max_tokens: 1000,
    messages: [
      { role: 'system', content: CHUNK_EXTRACT_PROMPT },
      { role: 'user', content: `Document section ${index + 1}:\n\n${chunk}` },
    ],
  })
  return response.choices[0]?.message?.content ?? ''
}

export async function summariseDocument(
  documentText: string,
  caseTitle: string
): Promise<string> {
  const chunks = chunkText(documentText)

  let extractedFacts: string

  if (chunks.length === 1) {
    // Short document — single call as before
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: DOCUMENT_SUMMARY_PROMPT },
        { role: 'user', content: `Case: ${caseTitle}\n\nDocument content:\n\n${documentText}` },
      ],
    })
    return stripMarkdown(response.choices[0]?.message?.content ?? '')
  }

  // Multi-chunk — extract facts from each chunk sequentially
  const chunkSummaries: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    const facts = await summariseChunk(chunks[i], i)
    chunkSummaries.push(facts)
  }

  extractedFacts = chunkSummaries.join('\n\n---\n\n')

  // Final call — combine all facts into one memo
  const finalResponse = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: CHUNK_COMBINE_PROMPT },
      {
        role: 'user',
        content: `Case: ${caseTitle}\n\nExtracted facts from all document sections:\n\n${extractedFacts}`,
      },
    ],
  })

  return stripMarkdown(finalResponse.choices[0]?.message?.content ?? '')
}

export async function chatWithCase(
  messages: { role: 'user' | 'assistant'; content: string }[],
  documentContext: string
): Promise<string> {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    max_tokens: 1500,
    messages: [
      {
        role: 'system',
        content: `${CHAT_SYSTEM_PROMPT}\n\nCASE DOCUMENTS:\n\n${documentContext}`,
      },
      ...messages,
    ],
  })

  const text = response.choices[0]?.message?.content ?? ''
  return stripMarkdown(text)
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#+\s/gm, '')
    .replace(/^[-•]\s/gm, '')
    .replace(/`/g, '')
    .trim()
}