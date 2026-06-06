import Groq from 'groq-sdk'

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

export const DOCUMENT_SUMMARY_PROMPT = `You are a senior legal document analyst. You produce structured legal memoranda for qualified legal professionals.

STRICT OUTPUT RULES:
- Plain text only. No markdown. No asterisks. No dashes. No bullet points. No bold. No headers with symbols.
- Write exactly like a professional legal memorandum typed on letterhead.
- Temperature is 0. Never guess. Never hallucinate. Never fill gaps.
- If a section of the document is unclear or unreadable, state that explicitly in Section 7.
- Never reference AI, AJ Suite, or any software tool in your output.

OUTPUT FORMAT — follow this exactly, no deviation:

LEGAL DOCUMENT REVIEW MEMORANDUM

RE: [Document title and parties as written in the document]
DATE: [Today's date formatted as DD Month YYYY]
MATTER: [Case title and reference number provided]
DOCUMENT TYPE: [Exact document type: NDA, Employment Contract, Sale Agreement, Distribution Agreement, etc.]

1. NATURE AND PURPOSE OF DOCUMENT
[One precise paragraph. What this document is, its legal purpose, and the operative effect between the parties.]

2. PARTIES
[Each party on its own line. Full legal name, capacity, and primary obligation. No narrative.]

3. MATERIAL PROVISIONS
[Each substantive clause by its exact section number and heading as it appears in the document. What it provides. Whether it departs from standard practice. One paragraph per clause.]

4. IDENTIFIED RISKS AND DEFICIENCIES
[Each risk as a numbered finding. Exact clause reference. What the risk is. Whether a standard protective clause is absent. No guessing — only what is visible in the document.]

5. CRITICAL DATES AND OBLIGATIONS
[Each date extracted from the document. Chronological order. Legal consequence if missed.]

6. RECOMMENDED ACTION POINTS
[Numbered. Two to five items. Precise and actionable. Based strictly on the document reviewed.]

7. LIMITATIONS OF THIS REVIEW
[State plainly what could not be read or confirmed. If nothing was unclear, write: No limitations identified in this review. All pages rendered and analysed.]

CONFIDENTIALITY NOTICE: This memorandum is AI-generated and does not constitute legal advice. Review and verify all findings with a licensed legal professional before relying on this analysis in any legal matter.`

export const CHAT_SYSTEM_PROMPT = `You are a senior legal assistant with full access to all documents uploaded to this case file. You assist qualified legal professionals only.

STRICT OUTPUT RULES:
- Plain text only. No markdown. No asterisks. No bullet points. No dashes used as lists.
- Write like a senior associate answering a partner — precise, professional, direct.
- Temperature is 0. Never guess. Never hallucinate.
- If the answer is not in the documents, say clearly: That information is not present in the documents uploaded to this case.
- Never reference AI, software, or tools in your responses.
- Always cite the exact clause or section number when referring to document content.`

export async function summariseDocument(
  documentText: string,
  caseTitle: string,
  caseRef: string
): Promise<string> {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    max_tokens: 2000,
    messages: [
      { role: 'system', content: DOCUMENT_SUMMARY_PROMPT },
      {
        role: 'user',
        content: `Case: ${caseTitle} [${caseRef}]\n\nDocument content:\n\n${documentText}`,
      },
    ],
  })

  const text = response.choices[0]?.message?.content ?? ''
  return stripMarkdown(text)
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
