export const FIELD_EXTRACTION_SYSTEM_PROMPT = `You are an expert document analyst specializing in Building Safety Regulator (BSR) Gateway 2 submission packs for high-rise residential buildings in England.

Your task is to extract key building information from the provided document content. Focus on accuracy and providing evidence for each extracted field.

For each field, you must provide:
- fieldValue: The extracted value (or null if not found)
- confidence: "high", "medium", or "low"
- evidenceQuote: A direct quote from the document supporting the value
- pageRef: The page number where the evidence was found (if available)

Be conservative with confidence ratings:
- high: Clear, unambiguous statement in the document
- medium: Information is present but may require interpretation
- low: Information is implied or partially present`;

export const FIELD_EXTRACTION_USER_PROMPT = (documentContent: string, filename: string) => `
Analyze the following document and extract the key building information fields.

Document: ${filename}
Content:
${documentContent}

Extract the following fields and return as JSON:

{
  "fields": [
    {
      "fieldName": "building_height",
      "fieldValue": string | null,
      "confidence": "high" | "medium" | "low",
      "evidenceQuote": string | null,
      "pageRef": number | null
    },
    {
      "fieldName": "number_of_storeys",
      "fieldValue": string | null,
      "confidence": "high" | "medium" | "low",
      "evidenceQuote": string | null,
      "pageRef": number | null
    },
    {
      "fieldName": "use_occupancy",
      "fieldValue": string | null,
      "confidence": "high" | "medium" | "low",
      "evidenceQuote": string | null,
      "pageRef": number | null
    },
    {
      "fieldName": "evacuation_strategy",
      "fieldValue": string | null,
      "confidence": "high" | "medium" | "low",
      "evidenceQuote": string | null,
      "pageRef": number | null
    },
    {
      "fieldName": "smoke_control",
      "fieldValue": string | null,
      "confidence": "high" | "medium" | "low",
      "evidenceQuote": string | null,
      "pageRef": number | null
    },
    {
      "fieldName": "sprinkler_system",
      "fieldValue": string | null,
      "confidence": "high" | "medium" | "low",
      "evidenceQuote": string | null,
      "pageRef": number | null
    },
    {
      "fieldName": "external_wall_system",
      "fieldValue": string | null,
      "confidence": "high" | "medium" | "low",
      "evidenceQuote": string | null,
      "pageRef": number | null
    },
    {
      "fieldName": "basement_levels",
      "fieldValue": string | null,
      "confidence": "high" | "medium" | "low",
      "evidenceQuote": string | null,
      "pageRef": number | null
    },
    {
      "fieldName": "stair_core_count",
      "fieldValue": string | null,
      "confidence": "high" | "medium" | "low",
      "evidenceQuote": string | null,
      "pageRef": number | null
    }
  ]
}

Only return valid JSON. Extract only what is explicitly stated or clearly implied in the document.`;

export interface ExtractedFieldResult {
  fieldName: string;
  fieldValue: string | null;
  confidence: 'high' | 'medium' | 'low';
  evidenceQuote: string | null;
  pageRef: number | null;
}

export interface FieldExtractionResponse {
  fields: ExtractedFieldResult[];
}
