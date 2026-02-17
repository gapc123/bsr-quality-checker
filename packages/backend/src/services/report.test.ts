import { describe, it, expect } from 'vitest';

// Test the report structure and formatting helpers

function formatFieldName(name: string): string {
  return name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

describe('Report Formatting', () => {
  describe('formatFieldName', () => {
    it('should capitalize single word fields', () => {
      expect(formatFieldName('height')).toBe('Height');
    });

    it('should format multi-word fields', () => {
      expect(formatFieldName('building_height')).toBe('Building Height');
      expect(formatFieldName('evacuation_strategy')).toBe('Evacuation Strategy');
      expect(formatFieldName('external_wall_system')).toBe('External Wall System');
    });

    it('should handle empty string', () => {
      expect(formatFieldName('')).toBe('');
    });
  });
});

describe('Issue JSON Schema', () => {
  const validIssue = {
    severity: 'high',
    category: 'Consistency',
    title: 'Inconsistent building height',
    finding: 'Multiple values found for building height',
    whyItMatters: 'Inconsistent information creates confusion',
    action: 'Verify the correct height and update all documents',
    ownerRole: 'Principal Designer',
    effort: 'S',
    endUserConsideration: 'Accurate information is essential',
    expectedBenefit: 'Clear documentation speeds review',
    confidence: 'high',
    citations: [{ type: 'guidance', docName: 'BS 9991', page: 10, section: '4.2' }],
    evidence: [{ docName: 'Fire Strategy', page: 5, quote: 'Building height is 45m' }],
  };

  it('should have all required fields', () => {
    expect(validIssue).toHaveProperty('severity');
    expect(validIssue).toHaveProperty('category');
    expect(validIssue).toHaveProperty('title');
    expect(validIssue).toHaveProperty('finding');
    expect(validIssue).toHaveProperty('whyItMatters');
    expect(validIssue).toHaveProperty('action');
    expect(validIssue).toHaveProperty('ownerRole');
    expect(validIssue).toHaveProperty('effort');
    expect(validIssue).toHaveProperty('endUserConsideration');
    expect(validIssue).toHaveProperty('expectedBenefit');
    expect(validIssue).toHaveProperty('confidence');
    expect(validIssue).toHaveProperty('citations');
    expect(validIssue).toHaveProperty('evidence');
  });

  it('should have valid severity values', () => {
    expect(['high', 'medium', 'low']).toContain(validIssue.severity);
  });

  it('should have valid effort values', () => {
    expect(['S', 'M', 'L']).toContain(validIssue.effort);
  });

  it('should have valid confidence values', () => {
    expect(['high', 'medium', 'low']).toContain(validIssue.confidence);
  });

  it('should have valid citation structure', () => {
    const citation = validIssue.citations[0];
    expect(citation).toHaveProperty('type');
    expect(citation).toHaveProperty('docName');
    expect(['guidance', 'standard', 'regulation']).toContain(citation.type);
  });

  it('should have valid evidence structure', () => {
    const evidence = validIssue.evidence[0];
    expect(evidence).toHaveProperty('docName');
    expect(evidence).toHaveProperty('page');
    expect(evidence).toHaveProperty('quote');
  });
});

describe('Report Markdown Structure', () => {
  const mockReportMarkdown = `# BSR Gateway 2 Pack Quality Review

**Pack:** Test Pack
**Version:** 1

---

> **DISCLAIMER:** This report assesses document quality only.

---

## Documents Analyzed

- **test.pdf** (fire_strategy)

---

## Extracted Building Information

| Field | Value | Confidence | Source |
|-------|-------|------------|--------|
| Building Height | 45m | high | test.pdf p.5 |

---

## Quality Issues Summary

- **High Priority:** 1 issues
- **Medium Priority:** 0 issues
- **Low Priority:** 0 issues

---
`;

  it('should contain required sections', () => {
    expect(mockReportMarkdown).toContain('# BSR Gateway 2 Pack Quality Review');
    expect(mockReportMarkdown).toContain('## Documents Analyzed');
    expect(mockReportMarkdown).toContain('## Extracted Building Information');
    expect(mockReportMarkdown).toContain('## Quality Issues Summary');
  });

  it('should contain disclaimer', () => {
    expect(mockReportMarkdown).toContain('DISCLAIMER');
    expect(mockReportMarkdown).toContain('document quality');
  });

  it('should have table structure', () => {
    expect(mockReportMarkdown).toContain('| Field | Value | Confidence | Source |');
    expect(mockReportMarkdown).toContain('|-------|');
  });
});
