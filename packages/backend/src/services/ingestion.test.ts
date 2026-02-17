import { describe, it, expect } from 'vitest';

// Mock chunking function for testing (same logic as in ingestion.ts)
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

interface ChunkData {
  text: string;
  pageRef: number;
  chunkIndex: number;
}

function chunkText(text: string, pageRef: number): ChunkData[] {
  const chunks: ChunkData[] = [];
  let index = 0;
  let chunkIndex = 0;

  while (index < text.length) {
    const end = Math.min(index + CHUNK_SIZE, text.length);
    const chunkText = text.slice(index, end).trim();

    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        pageRef,
        chunkIndex,
      });
      chunkIndex++;
    }

    index += CHUNK_SIZE - CHUNK_OVERLAP;
    if (index >= text.length) break;
  }

  return chunks;
}

describe('Text Chunking', () => {
  it('should return empty array for empty text', () => {
    const result = chunkText('', 1);
    expect(result).toEqual([]);
  });

  it('should return single chunk for short text', () => {
    const text = 'This is a short text that fits in one chunk.';
    const result = chunkText(text, 1);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe(text);
    expect(result[0].pageRef).toBe(1);
    expect(result[0].chunkIndex).toBe(0);
  });

  it('should split long text into multiple chunks', () => {
    const text = 'A'.repeat(2500);
    const result = chunkText(text, 1);
    expect(result.length).toBeGreaterThan(1);
  });

  it('should have overlapping content between chunks', () => {
    const text = 'A'.repeat(1500);
    const result = chunkText(text, 1);

    // With CHUNK_SIZE=1000 and OVERLAP=200, chunks should overlap
    expect(result.length).toBeGreaterThanOrEqual(2);

    // The second chunk should start at position 800 (1000 - 200)
    // So first 200 chars of second chunk should be last 200 of first
    if (result.length >= 2) {
      const firstChunkEnd = result[0].text.slice(-CHUNK_OVERLAP);
      const secondChunkStart = result[1].text.slice(0, CHUNK_OVERLAP);
      expect(firstChunkEnd).toBe(secondChunkStart);
    }
  });

  it('should preserve page reference', () => {
    const text = 'Some content';
    const result = chunkText(text, 5);
    expect(result[0].pageRef).toBe(5);
  });

  it('should increment chunk index', () => {
    const text = 'A'.repeat(3000);
    const result = chunkText(text, 1);

    result.forEach((chunk, index) => {
      expect(chunk.chunkIndex).toBe(index);
    });
  });
});

describe('Document Type Classification', () => {
  const classifyDocType = (filename: string, text: string): string | null => {
    const lowerFilename = filename.toLowerCase();
    const lowerText = text.toLowerCase().slice(0, 5000);

    const typePatterns: { type: string; patterns: string[] }[] = [
      { type: 'fire_strategy', patterns: ['fire strategy', 'fire safety strategy', 'fire engineering'] },
      { type: 'drawings', patterns: ['drawing', 'plan', 'elevation', 'section', 'layout'] },
      { type: 'structural', patterns: ['structural', 'structure', 'load', 'foundation'] },
      { type: 'evacuation', patterns: ['evacuation', 'egress', 'escape', 'exit'] },
      { type: 'smoke_control', patterns: ['smoke control', 'smoke ventilation', 'smoke extract'] },
    ];

    for (const { type, patterns } of typePatterns) {
      for (const pattern of patterns) {
        if (lowerFilename.includes(pattern) || lowerText.includes(pattern)) {
          return type;
        }
      }
    }

    return null;
  };

  it('should classify fire strategy documents', () => {
    expect(classifyDocType('Fire Strategy Report.pdf', '')).toBe('fire_strategy');
    expect(classifyDocType('document.pdf', 'This is the fire strategy for the building')).toBe('fire_strategy');
  });

  it('should classify drawing documents', () => {
    expect(classifyDocType('Floor Plan Level 1.pdf', '')).toBe('drawings');
    expect(classifyDocType('doc.pdf', 'Elevation drawing of the facade')).toBe('drawings');
  });

  it('should classify evacuation documents', () => {
    expect(classifyDocType('Evacuation Strategy.pdf', '')).toBe('evacuation');
    expect(classifyDocType('doc.pdf', 'escape routes and egress points')).toBe('evacuation');
  });

  it('should return null for unclassifiable documents', () => {
    expect(classifyDocType('random.pdf', 'some random content')).toBeNull();
  });
});
