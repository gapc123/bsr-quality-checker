export const ISSUE_GENERATION_SYSTEM_PROMPT = `You are an expert document quality reviewer specializing in Building Safety Regulator (BSR) Gateway 2 submission packs for high-rise residential buildings in England.

Your role is NOT to assess regulatory compliance - that is the BSR's job. Instead, you are assessing DOCUMENT QUALITY:
- Clarity: Is the information clearly stated and easy to find?
- Completeness: Are key details present that a reviewer would need?
- Consistency: Do values match across different documents?
- Reviewability: Can a BSR reviewer easily understand and verify the submission?

For each issue you identify, you must provide:
- severity: "high" (blocks reviewability), "medium" (causes confusion), "low" (minor improvement)
- category: The type of issue (e.g., "Consistency", "Clarity", "Missing Information", "Cross-Reference")
- title: A brief, specific title for the issue
- finding: What you found in the documents
- whyItMatters: Why this matters for document quality/reviewability
- action: Specific action to resolve the issue
- ownerRole: Who should address this (e.g., "Fire Engineer", "Architect", "Principal Designer")
- effort: "S" (small), "M" (medium), "L" (large) - estimated effort to fix
- endUserConsideration: How this affects building occupants/end users
- expectedBenefit: What improves when this is fixed
- confidence: "high", "medium", or "low" in your assessment
- citations: References to guidance/standards (if applicable)
- evidence: Direct quotes/references from the documents

IMPORTANT: Focus on quality and clarity issues, not compliance judgments. The BSR will determine compliance.`;

export const ISSUE_GENERATION_USER_PROMPT = (
  extractedFields: string,
  documentSummaries: string,
  referenceContext: string
) => `
Analyze the following Gateway 2 submission pack for DOCUMENT QUALITY issues.

## Extracted Fields from Documents
${extractedFields}

## Document Summaries
${documentSummaries}

## Reference Context (Baseline & Butler Library)
${referenceContext}

Based on this analysis, identify document quality issues. Focus on:
1. Inconsistencies between documents (e.g., different heights stated)
2. Missing clarity (e.g., evacuation strategy not clearly defined)
3. Missing information (e.g., no mention of basement fire strategy)
4. Cross-reference issues (e.g., fire strategy doesn't reference drawings)
5. Completeness gaps compared to typical high-quality submissions

Return a JSON array of issues:

{
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "category": string,
      "title": string,
      "finding": string,
      "whyItMatters": string,
      "action": string,
      "ownerRole": string,
      "effort": "S" | "M" | "L",
      "endUserConsideration": string,
      "expectedBenefit": string,
      "confidence": "high" | "medium" | "low",
      "citations": [
        {
          "type": "guidance" | "standard" | "regulation",
          "docName": string,
          "page": number | null,
          "section": string | null
        }
      ],
      "evidence": [
        {
          "docName": string,
          "page": number | null,
          "quote": string
        }
      ]
    }
  ]
}

Only return valid JSON. Be specific and actionable in your recommendations.`;

export interface Citation {
  type: 'guidance' | 'standard' | 'regulation';
  docName: string;
  page: number | null;
  section: string | null;
}

export interface Evidence {
  docName: string;
  page: number | null;
  quote: string;
}

export interface IssueResult {
  severity: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  finding: string;
  whyItMatters: string;
  action: string;
  ownerRole: string;
  effort: 'S' | 'M' | 'L';
  endUserConsideration: string;
  expectedBenefit: string;
  confidence: 'high' | 'medium' | 'low';
  citations: Citation[];
  evidence: Evidence[];
}

export interface IssueGenerationResponse {
  issues: IssueResult[];
}

export const REPORT_TEMPLATE = `# BSR Gateway 2 Pack Quality Review

**DISCLAIMER**: This report assesses document quality, clarity, and internal consistency only. It does NOT assess regulatory compliance. Compliance determinations are the sole responsibility of the Building Safety Regulator (BSR).

---

## Project Summary

{{projectSummary}}

---

## Extracted Building Information

{{extractedFields}}

---

## Document Quality Issues

{{issues}}

---

## Consistency Analysis

{{consistencyAnalysis}}

---

## Recommendations Summary

{{recommendations}}

---

## Appendix: Evidence & Citations

{{evidence}}

---

*Report generated on {{generatedDate}}*
*This is an AI-assisted analysis tool. All findings should be verified by qualified professionals.*
`;
