/**
 * Deterministic Rules Engine - Complete Regulatory Matrix
 *
 * Proprietary regulatory assessment logic with explicit if-then rules.
 * Covers all 30 criteria in the Gateway 2 Success Matrix.
 *
 * Each rule follows the pattern:
 * 1. Document presence check (is the required document there?)
 * 2. Content verification (does it contain required elements?)
 * 3. Quality assessment (is the content complete and specific?)
 */

export interface DocumentEvidence {
  filename: string;
  docType: string | null;
  extractedText: string;
}

export interface RuleResult {
  passed: boolean;
  confidence: 'definitive' | 'high' | 'needs_review';
  evidence: {
    found: boolean;
    document: string | null;
    quote: string | null;
    matchType: 'keyword' | 'pattern' | 'structure' | 'absence';
  };
  reasoning: string;
  failureMode: string | null;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function containsAllKeywords(text: string, keywords: string[]): boolean {
  const normText = normalise(text);
  return keywords.every(kw => normText.includes(normalise(kw)));
}

function containsAnyKeyword(text: string, keywords: string[]): boolean {
  const normText = normalise(text);
  return keywords.some(kw => normText.includes(normalise(kw)));
}

function extractQuote(text: string, keyword: string, contextChars: number = 150): string | null {
  const normText = normalise(text);
  const normKw = normalise(keyword);
  const idx = normText.indexOf(normKw);
  if (idx === -1) return null;
  const start = Math.max(0, idx - contextChars);
  const end = Math.min(text.length, idx + keyword.length + contextChars);
  return '...' + text.slice(start, end).trim() + '...';
}

function findDocument(docs: DocumentEvidence[], patterns: string[]): DocumentEvidence | null {
  for (const doc of docs) {
    const searchText = normalise(doc.filename + ' ' + (doc.docType || ''));
    if (patterns.some(p => searchText.includes(normalise(p)))) {
      return doc;
    }
  }
  return null;
}

function findDocumentsByContent(docs: DocumentEvidence[], keywords: string[], charLimit: number = 5000): DocumentEvidence[] {
  return docs.filter(d => containsAnyKeyword(d.extractedText.slice(0, charLimit), keywords));
}

function countKeywordOccurrences(text: string, keyword: string): number {
  const normText = normalise(text);
  const normKw = normalise(keyword);
  return (normText.match(new RegExp(normKw, 'g')) || []).length;
}

// Extract all height values mentioned in text
function extractHeights(text: string): number[] {
  const matches = text.match(/(\d+(?:\.\d+)?)\s*(?:m|metres?|meters?)\s*(?:high|tall|height|above)/gi) || [];
  return matches.map(m => parseFloat(m.match(/\d+(?:\.\d+)?/)?.[0] || '0')).filter(h => h > 0);
}

// Extract storey counts
function extractStoreys(text: string): number[] {
  const matches = text.match(/(\d+)\s*(?:storey|stories|floors?|levels?)/gi) || [];
  return matches.map(m => parseInt(m.match(/\d+/)?.[0] || '0')).filter(s => s > 0);
}

// ============================================
// RULE TYPE DEFINITION
// ============================================

type RuleFunction = (docs: DocumentEvidence[]) => RuleResult;

interface DeterministicRule {
  matrixId: string;
  name: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  check: RuleFunction;
}

// ============================================
// ALL 30 DETERMINISTIC RULES
// ============================================

export const DETERMINISTIC_RULES: DeterministicRule[] = [

  // ============================================
  // SM-001: Fire Strategy Report Present and Complete
  // Category: PACK_COMPLETENESS | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-001',
    name: 'Fire Strategy Report Present and Complete',
    category: 'PACK_COMPLETENESS',
    severity: 'high',
    check: (docs) => {
      const fireStrategyDoc = findDocument(docs, ['fire strategy', 'fire safety strategy', 'fire report']);

      if (!fireStrategyDoc) {
        return {
          passed: false,
          confidence: 'definitive',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No fire strategy document found. Searched for "fire strategy", "fire safety strategy", or "fire report" in document names.',
          failureMode: 'No fire strategy report present'
        };
      }

      const text = fireStrategyDoc.extractedText;
      const requiredSections = [
        { keywords: ['means of escape', 'escape route', 'evacuation'], name: 'means of escape' },
        { keywords: ['compartment', 'compartmentation'], name: 'compartmentation' },
        { keywords: ['external fire spread', 'external wall', 'facade', 'cladding'], name: 'external fire spread' },
        { keywords: ['structural fire', 'fire resistance', 'structural protection'], name: 'structural fire resistance' },
        { keywords: ['firefighter', 'fire service', 'fire brigade', 'access for fire'], name: 'firefighter access' }
      ];

      const missingSections: string[] = [];
      const foundSections: string[] = [];

      for (const section of requiredSections) {
        if (containsAnyKeyword(text, section.keywords)) {
          foundSections.push(section.name);
        } else {
          missingSections.push(section.name);
        }
      }

      // Check for author credentials
      const hasCredentials = containsAnyKeyword(text, ['fire engineer', 'mifirE', 'cifirE', 'chartered', 'beng', 'msc fire']);

      if (missingSections.length === 0 && hasCredentials) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: extractQuote(text, 'fire'), matchType: 'keyword' },
          reasoning: `Fire strategy complete with all required sections (${foundSections.join(', ')}) and authored by qualified fire engineer.`,
          failureMode: null
        };
      } else if (missingSections.length === 0) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: `Fire strategy contains all required sections. Author credentials not explicitly confirmed.`,
          failureMode: null
        };
      } else if (missingSections.length <= 2) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: `Fire strategy found but missing sections: ${missingSections.join(', ')}. Found: ${foundSections.join(', ')}.`,
          failureMode: 'Fire strategy exists but missing key sections'
        };
      } else {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: `Fire strategy appears incomplete. Missing: ${missingSections.join(', ')}.`,
          failureMode: 'Fire strategy exists but missing key sections'
        };
      }
    }
  },

  // ============================================
  // SM-002: Means of Escape Clearly Defined
  // Category: FIRE_SAFETY | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-002',
    name: 'Means of Escape Clearly Defined',
    category: 'FIRE_SAFETY',
    severity: 'high',
    check: (docs) => {
      const fireStrategyDoc = findDocument(docs, ['fire strategy', 'fire safety', 'means of escape']);

      if (!fireStrategyDoc) {
        return {
          passed: false,
          confidence: 'definitive',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No fire strategy or means of escape documentation found.',
          failureMode: 'No documentation of escape provisions'
        };
      }

      const text = fireStrategyDoc.extractedText;

      // Check for evacuation strategy type
      const evacStrategies = ['simultaneous evacuation', 'phased evacuation', 'stay put', 'stay-put', 'defend in place', 'progressive horizontal'];
      const hasEvacStrategy = containsAnyKeyword(text, evacStrategies);

      // Check for travel distances with measurements
      const travelDistancePattern = /travel\s+distance[s]?\s*[:\-]?\s*\d+\s*m/i;
      const hasTravelDistances = travelDistancePattern.test(text) ||
        (containsAnyKeyword(text, ['travel distance']) && /\d+\s*m(etre)?s?/.test(text));

      // Check for protected stairs
      const hasProtectedStairs = containsAnyKeyword(text, ['protected stair', 'protected stairway', 'escape stair', 'firefighting stair', 'protected lobby']);

      // Check for exit widths
      const hasExitWidths = containsAnyKeyword(text, ['exit width', 'door width', 'clear width', 'minimum width']) && /\d+\s*mm/.test(text);

      // Check for compliance route
      const hasComplianceRoute = containsAnyKeyword(text, ['approved document b', 'adb', 'bs 9999', 'fire engineering', 'performance based']);

      const checks = [
        { name: 'evacuation strategy type', passed: hasEvacStrategy, critical: true },
        { name: 'travel distances with measurements', passed: hasTravelDistances, critical: true },
        { name: 'protected stairways', passed: hasProtectedStairs, critical: false },
        { name: 'exit widths', passed: hasExitWidths, critical: false },
        { name: 'compliance route stated', passed: hasComplianceRoute, critical: false }
      ];

      const passedChecks = checks.filter(c => c.passed);
      const failedCritical = checks.filter(c => c.critical && !c.passed);

      if (failedCritical.length === 0 && passedChecks.length >= 4) {
        const quote = extractQuote(text, evacStrategies.find(s => normalise(text).includes(normalise(s))) || 'escape');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote, matchType: 'pattern' },
          reasoning: `Means of escape clearly defined with: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (failedCritical.length === 0) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: null, matchType: 'pattern' },
          reasoning: `Means of escape addressed but may need enhancement. Found: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else {
        const failedChecks = checks.filter(c => !c.passed);
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: null, matchType: 'pattern' },
          reasoning: `Means of escape incomplete. Missing: ${failedChecks.map(c => c.name).join(', ')}.`,
          failureMode: failedCritical[0]?.name === 'evacuation strategy type' ? 'No evacuation strategy type stated' : 'Travel distances not quantified'
        };
      }
    }
  },

  // ============================================
  // SM-003: Compartmentation Strategy
  // Category: FIRE_SAFETY | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-003',
    name: 'Compartmentation Strategy with Fire Resistance Periods',
    category: 'FIRE_SAFETY',
    severity: 'high',
    check: (docs) => {
      const fireStrategyDoc = findDocument(docs, ['fire strategy', 'fire safety', 'compartmentation']);

      if (!fireStrategyDoc) {
        return {
          passed: false,
          confidence: 'definitive',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No fire strategy or compartmentation documentation found.',
          failureMode: 'No compartmentation section'
        };
      }

      const text = fireStrategyDoc.extractedText;

      const hasCompartmentation = containsAnyKeyword(text, ['compartment', 'compartmentation', 'fire compartment']);
      const fireResistancePattern = /(30|60|90|120)\s*(min|minute)/i;
      const hasFireResistance = fireResistancePattern.test(text);
      const hasTableRef = containsAnyKeyword(text, ['table a1', 'table a2', 'adb', 'approved document b', 'bs 9999']);
      const hasFireStopping = containsAnyKeyword(text, ['fire stop', 'firestopping', 'fire stopping', 'penetration seal', 'fire seal']);
      const hasCompartmentSizes = /compartment\s*(size|floor\s*area|maximum)/i.test(text) && /\d+\s*m[²2]/i.test(text);

      if (!hasCompartmentation) {
        return {
          passed: false,
          confidence: 'definitive',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: 'Fire strategy found but no compartmentation section identified.',
          failureMode: 'No compartmentation section'
        };
      }

      if (!hasFireResistance) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: extractQuote(text, 'compartment'), matchType: 'pattern' },
          reasoning: 'Compartmentation described but no specific fire resistance periods (30/60/90/120 minutes) found.',
          failureMode: 'Compartments described but no fire resistance periods'
        };
      }

      const frMatch = text.match(fireResistancePattern);
      const quote = frMatch ? extractQuote(text, frMatch[0]) : extractQuote(text, 'compartment');

      const score = [hasFireStopping, hasTableRef, hasCompartmentSizes].filter(Boolean).length;

      if (score >= 2) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote, matchType: 'pattern' },
          reasoning: 'Compartmentation strategy complete with fire resistance periods, fire stopping, and regulatory references.',
          failureMode: null
        };
      } else if (score >= 1) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote, matchType: 'pattern' },
          reasoning: `Compartmentation strategy includes fire resistance periods.${!hasFireStopping ? ' Fire stopping not explicitly addressed.' : ''}`,
          failureMode: null
        };
      } else {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: fireStrategyDoc.filename, quote, matchType: 'pattern' },
          reasoning: 'Compartmentation with fire resistance periods found, but missing fire stopping strategy and table references.',
          failureMode: 'No fire stopping strategy'
        };
      }
    }
  },

  // ============================================
  // SM-004: External Wall Fire Performance
  // Category: FIRE_SAFETY | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-004',
    name: 'External Wall System Fire Performance Specified',
    category: 'FIRE_SAFETY',
    severity: 'high',
    check: (docs) => {
      const relevantDocs = docs.filter(d =>
        containsAnyKeyword(d.filename + ' ' + (d.docType || ''), ['external wall', 'cladding', 'facade', 'fire strategy', 'wall schedule', 'specification']) ||
        containsAnyKeyword(d.extractedText.slice(0, 5000), ['external wall', 'cladding system', 'facade', 'rainscreen'])
      );

      if (relevantDocs.length === 0) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No external wall schedule, cladding specification, or relevant documentation found.',
          failureMode: 'No external wall schedule'
        };
      }

      const combinedText = relevantDocs.map(d => d.extractedText).join(' ');
      const primaryDoc = relevantDocs[0];

      const fireClassPattern = /class\s*(a1|a2|b|c|d|e|f)[\s\-,]/i;
      const hasFireClass = fireClassPattern.test(combinedText) || containsAnyKeyword(combinedText, ['euroclass', 'reaction to fire', 'a1-s1', 'a2-s1', 'a2-s2', 'limited combustibility', 'non-combustible']);
      const hasCavityBarriers = containsAnyKeyword(combinedText, ['cavity barrier', 'fire barrier', 'cavity closer', 'firestop']);
      const hasInsulation = containsAnyKeyword(combinedText, ['mineral wool', 'stone wool', 'rock wool', 'pir', 'phenolic', 'insulation type', 'thermal insulation', 'rockwool', 'isover']);
      const addressesBan = containsAnyKeyword(combinedText, ['regulation 7', 'ban on combustible', 'combustible material', 'non-combustible', 'a1 or a2', '18m', '18 metres']);
      const hasSpecificMaterials = containsAnyKeyword(combinedText, ['aluminium composite', 'acm', 'terracotta', 'brick slip', 'render', 'zinc', 'copper', 'glass']);

      const checks = [
        { name: 'fire classifications', passed: hasFireClass, critical: true },
        { name: 'cavity barriers', passed: hasCavityBarriers, critical: true },
        { name: 'insulation specification', passed: hasInsulation, critical: false },
        { name: 'combustible ban addressed', passed: addressesBan, critical: false },
        { name: 'specific materials named', passed: hasSpecificMaterials, critical: false }
      ];

      const passedChecks = checks.filter(c => c.passed);
      const failedCritical = checks.filter(c => c.critical && !c.passed);

      if (passedChecks.length >= 4) {
        const quote = extractQuote(combinedText, 'external wall') || extractQuote(combinedText, 'cladding');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: primaryDoc.filename, quote, matchType: 'pattern' },
          reasoning: `External wall fire performance fully specified: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (failedCritical.length === 0 && passedChecks.length >= 2) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: primaryDoc.filename, quote: null, matchType: 'pattern' },
          reasoning: `External wall specification present with ${passedChecks.map(c => c.name).join(', ')}. May need enhancement.`,
          failureMode: null
        };
      } else {
        const failedChecks = checks.filter(c => !c.passed);
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: primaryDoc.filename, quote: null, matchType: 'pattern' },
          reasoning: `External wall documentation incomplete. Missing: ${failedChecks.map(c => c.name).join(', ')}.`,
          failureMode: failedCritical.length > 0 ? `No ${failedCritical[0].name}` : 'Claims compliance without specifying materials'
        };
      }
    }
  },

  // ============================================
  // SM-005: Sprinkler Provision
  // Category: FIRE_SAFETY | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-005',
    name: 'Sprinkler Provision Addressed Appropriately',
    category: 'FIRE_SAFETY',
    severity: 'high',
    check: (docs) => {
      const fireStrategyDoc = findDocument(docs, ['fire strategy', 'fire safety', 'sprinkler', 'suppression', 'mep']);

      if (!fireStrategyDoc) {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No fire strategy or sprinkler documentation found.',
          failureMode: 'No mention of sprinklers in fire strategy'
        };
      }

      const text = fireStrategyDoc.extractedText;

      const mentionsSprinklers = containsAnyKeyword(text, ['sprinkler', 'automatic suppression', 'water suppression', 'bs 9251', 'bs en 12845', 'water mist']);
      const explicitlyNotRequired = containsAnyKeyword(text, ['sprinklers not required', 'no sprinklers', 'sprinkler system is not', 'not fitted with sprinkler', 'without sprinkler']);

      if (!mentionsSprinklers && !explicitlyNotRequired) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: null, matchType: 'absence' },
          reasoning: 'Fire strategy found but no mention of sprinkler provision or justification for absence.',
          failureMode: 'No mention of sprinklers in fire strategy'
        };
      }

      if (explicitlyNotRequired) {
        const quote = extractQuote(text, 'sprinkler');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote, matchType: 'keyword' },
          reasoning: 'Fire strategy explicitly addresses sprinkler provision (states not required with justification).',
          failureMode: null
        };
      }

      const hasStandard = containsAnyKeyword(text, ['bs 9251', 'bs en 12845', 'residential sprinkler', 'commercial sprinkler', 'lpcb']);
      const hasCoverage = containsAnyKeyword(text, ['full coverage', 'partial coverage', 'throughout', 'all areas', 'residential areas', 'common areas']);
      const hasDesignIntent = containsAnyKeyword(text, ['sprinkler design', 'suppression design', 'flow rate', 'water supply', 'tank capacity']);

      const score = [hasStandard, hasCoverage, hasDesignIntent].filter(Boolean).length;
      const quote = extractQuote(text, 'sprinkler');

      if (score >= 2) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote, matchType: 'pattern' },
          reasoning: 'Sprinkler provision fully specified with design standard, coverage, and design intent.',
          failureMode: null
        };
      } else if (score >= 1) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: fireStrategyDoc.filename, quote, matchType: 'pattern' },
          reasoning: `Sprinkler provision addressed.${!hasStandard ? ' Design standard not stated.' : ''}${!hasCoverage ? ' Coverage extent not specified.' : ''}`,
          failureMode: null
        };
      } else {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: fireStrategyDoc.filename, quote, matchType: 'keyword' },
          reasoning: 'Sprinklers mentioned but no standard, coverage, or design intent specified.',
          failureMode: 'States "sprinklers to be provided" without specification'
        };
      }
    }
  },

  // ============================================
  // SM-006: Firefighting Access Provisions
  // Category: FIRE_SAFETY | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-006',
    name: 'Firefighting Access Provisions for HRBs',
    category: 'FIRE_SAFETY',
    severity: 'high',
    check: (docs) => {
      const fireStrategyDoc = findDocument(docs, ['fire strategy', 'fire safety', 'access']);

      if (!fireStrategyDoc) {
        return {
          passed: false,
          confidence: 'definitive',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No fire strategy or access documentation found.',
          failureMode: 'No firefighting access section'
        };
      }

      const text = fireStrategyDoc.extractedText;

      const hasFirefightingShaft = containsAnyKeyword(text, ['firefighting shaft', 'fire fighting shaft', 'firefighting lift', 'fire fighting lift', 'fireman lift']);
      const hasFireMain = containsAnyKeyword(text, ['fire main', 'dry riser', 'wet riser', 'rising main', 'firefighting water']);
      const hasVehicleAccess = containsAnyKeyword(text, ['vehicle access', 'fire appliance', 'fire engine', 'fire tender', 'appliance access', 'fire service access']);
      const hasFireServiceConsultation = containsAnyKeyword(text, ['fire service', 'fire brigade', 'lfb', 'london fire', 'fire and rescue', 'consulted', 'consultation']);

      const checks = [
        { name: 'firefighting shaft/lift', passed: hasFirefightingShaft },
        { name: 'fire main/riser', passed: hasFireMain },
        { name: 'vehicle access', passed: hasVehicleAccess },
        { name: 'fire service consultation', passed: hasFireServiceConsultation }
      ];

      const passedChecks = checks.filter(c => c.passed);

      if (passedChecks.length >= 3) {
        const quote = extractQuote(text, 'firefight') || extractQuote(text, 'fire service');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote, matchType: 'keyword' },
          reasoning: `Firefighting access fully addressed: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 2) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: `Firefighting access partially addressed: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 1) {
        const failedChecks = checks.filter(c => !c.passed);
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: `Firefighting access incomplete. Missing: ${failedChecks.map(c => c.name).join(', ')}.`,
          failureMode: 'Generic statement without specifics'
        };
      } else {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: null, matchType: 'absence' },
          reasoning: 'Fire strategy found but no firefighting access provisions identified.',
          failureMode: 'No firefighting access section'
        };
      }
    }
  },

  // ============================================
  // SM-007: Second Staircase Provision
  // Category: FIRE_SAFETY | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-007',
    name: 'Second Staircase Provision for Tall Residential',
    category: 'FIRE_SAFETY',
    severity: 'high',
    check: (docs) => {
      const fireStrategyDoc = findDocument(docs, ['fire strategy', 'fire safety', 'core', 'stair']);

      if (!fireStrategyDoc) {
        return {
          passed: false,
          confidence: 'definitive',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No fire strategy or core design documentation found.',
          failureMode: 'No mention of staircase strategy'
        };
      }

      const text = fireStrategyDoc.extractedText;

      // Check for stair count mentions
      const hasTwoStairs = containsAnyKeyword(text, ['two stair', '2 stair', 'dual stair', 'two escape', '2 escape', 'second stair', 'both stairs', 'twin stair']);
      const hasSingleStair = containsAnyKeyword(text, ['single stair', 'one stair', '1 stair']) && !hasTwoStairs;
      const hasProtectedLobby = containsAnyKeyword(text, ['protected lobby', 'fire-fighting lobby', 'firefighting lobby', 'ventilated lobby']);
      const hasJustification = containsAnyKeyword(text, ['fire engineering', 'fire engineered', 'performance based', 'alternative solution', 'compensatory']);

      if (hasTwoStairs && hasProtectedLobby) {
        const quote = extractQuote(text, 'stair');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote, matchType: 'keyword' },
          reasoning: 'Two-stair design confirmed with protected lobby approach.',
          failureMode: null
        };
      } else if (hasTwoStairs) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: extractQuote(text, 'stair'), matchType: 'keyword' },
          reasoning: 'Two stairs indicated but protected lobby approach not confirmed.',
          failureMode: null
        };
      } else if (hasSingleStair && hasJustification) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: extractQuote(text, 'single stair'), matchType: 'keyword' },
          reasoning: 'Single stair proposed with fire engineering justification. Requires BSR review.',
          failureMode: null
        };
      } else if (hasSingleStair) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: extractQuote(text, 'single stair'), matchType: 'keyword' },
          reasoning: 'Single stair proposed without fire engineering justification for 18m+ residential.',
          failureMode: 'Single stair proposed without fire engineering justification'
        };
      } else {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: fireStrategyDoc.filename, quote: null, matchType: 'absence' },
          reasoning: 'Staircase strategy not clearly stated. Number of stairs unclear.',
          failureMode: 'No mention of staircase strategy'
        };
      }
    }
  },

  // ============================================
  // SM-008: Structural Design Information
  // Category: PACK_COMPLETENESS | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-008',
    name: 'Structural Design Information Present',
    category: 'PACK_COMPLETENESS',
    severity: 'high',
    check: (docs) => {
      const structuralDoc = findDocument(docs, ['structural', 'structure', 'engineer', 'foundation']);

      if (!structuralDoc) {
        return {
          passed: false,
          confidence: 'definitive',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No structural report or engineering documentation found.',
          failureMode: 'No structural documentation'
        };
      }

      const text = structuralDoc.extractedText;

      const hasSystemDesc = containsAnyKeyword(text, ['structural system', 'structural frame', 'load bearing', 'loadbearing', 'concrete frame', 'steel frame', 'timber frame', 'structural form', 'superstructure']);
      const hasFoundation = containsAnyKeyword(text, ['foundation', 'piling', 'ground bearing', 'raft', 'pile', 'substructure', 'basement']);
      const hasDesignCodes = containsAnyKeyword(text, ['eurocode', 'bs en 199', 'bs 8110', 'bs 5950', 'ec2', 'ec3', 'ec7']);
      const hasCredentials = containsAnyKeyword(text, ['chartered', 'mice', 'ceng', 'mistructe', 'structural engineer', 'eur ing', 'fice']);

      const checks = [
        { name: 'structural system description', passed: hasSystemDesc, critical: true },
        { name: 'foundation approach', passed: hasFoundation, critical: true },
        { name: 'design code references', passed: hasDesignCodes, critical: false },
        { name: 'engineer credentials', passed: hasCredentials, critical: false }
      ];

      const passedChecks = checks.filter(c => c.passed);
      const failedCritical = checks.filter(c => c.critical && !c.passed);

      if (passedChecks.length >= 3) {
        const quote = extractQuote(text, 'structural') || extractQuote(text, 'frame');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: structuralDoc.filename, quote, matchType: 'pattern' },
          reasoning: `Structural design information complete: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (failedCritical.length === 0) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: structuralDoc.filename, quote: null, matchType: 'pattern' },
          reasoning: `Structural documentation present with ${passedChecks.map(c => c.name).join(', ')}. May need enhancement.`,
          failureMode: null
        };
      } else {
        const failedChecks = checks.filter(c => !c.passed);
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: structuralDoc.filename, quote: null, matchType: 'pattern' },
          reasoning: `Structural documentation incomplete. Missing: ${failedChecks.map(c => c.name).join(', ')}.`,
          failureMode: failedCritical.length > 0 ? `Missing ${failedCritical[0].name}` : 'No engineer credentials evident'
        };
      }
    }
  },

  // ============================================
  // SM-009: Structural Fire Resistance Alignment
  // Category: FIRE_SAFETY | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-009',
    name: 'Structural Fire Resistance Aligned with Fire Strategy',
    category: 'FIRE_SAFETY',
    severity: 'high',
    check: (docs) => {
      const structuralDoc = findDocument(docs, ['structural', 'structure']);
      const fireDoc = findDocument(docs, ['fire strategy', 'fire safety']);

      if (!structuralDoc) {
        return {
          passed: false,
          confidence: 'definitive',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No structural documentation found to assess fire resistance.',
          failureMode: 'No fire resistance mentioned in structural report'
        };
      }

      const structText = structuralDoc.extractedText;
      const fireText = fireDoc?.extractedText || '';

      const fireResistancePattern = /(30|60|90|120|180)\s*(min|minute)/gi;
      const structFRMatches = structText.match(fireResistancePattern) || [];
      const fireFRMatches = fireText.match(fireResistancePattern) || [];

      const hasStructuralFR = structFRMatches.length > 0 || containsAnyKeyword(structText, ['fire resistance', 'fire protection', 'intumescent', 'fire rated']);
      const crossReferences = containsAnyKeyword(structText, ['fire strategy', 'fire engineer', 'fire consultant']) || containsAnyKeyword(fireText, ['structural', 'structure']);

      if (!hasStructuralFR) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: structuralDoc.filename, quote: null, matchType: 'absence' },
          reasoning: 'Structural report does not mention fire resistance requirements.',
          failureMode: 'No fire resistance mentioned in structural report'
        };
      }

      // Check for consistency between documents
      if (structFRMatches.length > 0 && fireFRMatches.length > 0) {
        const structPeriods = structFRMatches.map(m => parseInt(m.match(/\d+/)?.[0] || '0'));
        const firePeriods = fireFRMatches.map(m => parseInt(m.match(/\d+/)?.[0] || '0'));
        const maxStruct = Math.max(...structPeriods);
        const maxFire = Math.max(...firePeriods);

        if (Math.abs(maxStruct - maxFire) > 30) {
          return {
            passed: false,
            confidence: 'high',
            evidence: { found: true, document: structuralDoc.filename, quote: extractQuote(structText, 'minute'), matchType: 'pattern' },
            reasoning: `Potential mismatch: Structural shows ${maxStruct}min, Fire strategy shows ${maxFire}min fire resistance.`,
            failureMode: 'Fire resistance periods differ from fire strategy'
          };
        }
      }

      if (hasStructuralFR && crossReferences) {
        const quote = extractQuote(structText, 'fire resistance') || extractQuote(structText, 'fire');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: structuralDoc.filename, quote, matchType: 'pattern' },
          reasoning: 'Structural fire resistance specified and cross-references fire strategy.',
          failureMode: null
        };
      } else if (hasStructuralFR) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: structuralDoc.filename, quote: extractQuote(structText, 'fire'), matchType: 'pattern' },
          reasoning: 'Structural fire resistance mentioned but cross-reference to fire strategy not confirmed.',
          failureMode: null
        };
      }

      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: true, document: structuralDoc.filename, quote: null, matchType: 'pattern' },
        reasoning: 'Unable to confirm structural fire resistance alignment.',
        failureMode: 'No cross-reference between structural and fire documents'
      };
    }
  },

  // ============================================
  // SM-010: Principal Designer Identified
  // Category: HRB_DUTIES | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-010',
    name: 'Principal Designer Identified with Competence Evidence',
    category: 'HRB_DUTIES',
    severity: 'high',
    check: (docs) => {
      const combinedText = docs.map(d => d.extractedText).join(' ');

      const hasPD = containsAnyKeyword(combinedText, ['principal designer']);

      if (!hasPD) {
        return {
          passed: false,
          confidence: 'definitive',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No Principal Designer named in submission pack.',
          failureMode: 'No Principal Designer named'
        };
      }

      // Find the document containing PD reference
      const pdDoc = docs.find(d => containsAnyKeyword(d.extractedText, ['principal designer'])) || docs[0];
      const text = pdDoc.extractedText;

      const hasOrganisation = containsAnyKeyword(text, ['ltd', 'limited', 'llp', 'plc', 'partnership', 'architects', 'consultants', 'engineering']);
      const hasQualifications = containsAnyKeyword(text, ['chartered', 'riba', 'arb', 'ceng', 'mice', 'bsc', 'msc', 'degree', 'qualified']);
      const hasHRBCompetence = containsAnyKeyword(text, ['hrb', 'higher-risk', 'higher risk', 'building safety', 'competent', 'competence', 'experience']);
      const hasDeclaration = containsAnyKeyword(text, ['declare', 'declaration', 'confirm', 'certify', 'statement']);

      const checks = [
        { name: 'organisation stated', passed: hasOrganisation },
        { name: 'qualifications evident', passed: hasQualifications },
        { name: 'HRB competence addressed', passed: hasHRBCompetence },
        { name: 'formal declaration', passed: hasDeclaration }
      ];

      const passedChecks = checks.filter(c => c.passed);

      if (passedChecks.length >= 3) {
        const quote = extractQuote(text, 'principal designer');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: pdDoc.filename, quote, matchType: 'keyword' },
          reasoning: `Principal Designer identified with: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 1) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: pdDoc.filename, quote: extractQuote(text, 'principal designer'), matchType: 'keyword' },
          reasoning: `Principal Designer named but competence evidence incomplete. Found: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: 'Named but no credentials or qualifications'
        };
      } else {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: pdDoc.filename, quote: extractQuote(text, 'principal designer'), matchType: 'keyword' },
          reasoning: 'Principal Designer mentioned but details unclear.',
          failureMode: 'Role assigned but competence not evidenced'
        };
      }
    }
  },

  // ============================================
  // SM-011: Principal Contractor Identified
  // Category: HRB_DUTIES | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-011',
    name: 'Principal Contractor Identified with Competence Evidence',
    category: 'HRB_DUTIES',
    severity: 'high',
    check: (docs) => {
      const combinedText = docs.map(d => d.extractedText).join(' ');

      const hasPC = containsAnyKeyword(combinedText, ['principal contractor']);
      const hasTBC = containsAnyKeyword(combinedText, ['to be confirmed', 'tbc', 'to be appointed', 'tba', 'not yet appointed']);

      if (!hasPC) {
        return {
          passed: false,
          confidence: 'definitive',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No Principal Contractor named or referenced in submission pack.',
          failureMode: 'No Principal Contractor named or referenced'
        };
      }

      const pcDoc = docs.find(d => containsAnyKeyword(d.extractedText, ['principal contractor'])) || docs[0];
      const text = pcDoc.extractedText;

      if (hasTBC) {
        const hasAppointmentProcess = containsAnyKeyword(text, ['procurement', 'tender', 'appointment process', 'selection', 'framework']);
        if (hasAppointmentProcess) {
          return {
            passed: true,
            confidence: 'needs_review',
            evidence: { found: true, document: pcDoc.filename, quote: extractQuote(text, 'principal contractor'), matchType: 'keyword' },
            reasoning: 'Principal Contractor appointment pending with procurement process described.',
            failureMode: null
          };
        } else {
          return {
            passed: false,
            confidence: 'high',
            evidence: { found: true, document: pcDoc.filename, quote: extractQuote(text, 'principal contractor'), matchType: 'keyword' },
            reasoning: 'Principal Contractor stated as TBC without explaining appointment process.',
            failureMode: 'States "TBC" without explaining appointment process'
          };
        }
      }

      const hasOrganisation = containsAnyKeyword(text, ['ltd', 'limited', 'llp', 'plc', 'construction', 'contractor', 'builder']);
      const hasCompetence = containsAnyKeyword(text, ['competent', 'competence', 'experience', 'hrb', 'higher-risk', 'building safety']);
      const hasDeclaration = containsAnyKeyword(text, ['declare', 'declaration', 'confirm', 'certify']);

      const checks = [
        { name: 'organisation stated', passed: hasOrganisation },
        { name: 'competence addressed', passed: hasCompetence },
        { name: 'formal declaration', passed: hasDeclaration }
      ];

      const passedChecks = checks.filter(c => c.passed);

      if (passedChecks.length >= 2) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: pcDoc.filename, quote: extractQuote(text, 'principal contractor'), matchType: 'keyword' },
          reasoning: `Principal Contractor identified with: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: pcDoc.filename, quote: extractQuote(text, 'principal contractor'), matchType: 'keyword' },
          reasoning: 'Principal Contractor named but competence evidence insufficient.',
          failureMode: 'Named but no competence evidence'
        };
      }
    }
  },

  // ============================================
  // SM-012: Golden Thread Strategy
  // Category: GOLDEN_THREAD | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-012',
    name: 'Golden Thread Information Strategy Defined',
    category: 'GOLDEN_THREAD',
    severity: 'high',
    check: (docs) => {
      const combinedText = docs.map(d => d.extractedText).join(' ');

      const hasGoldenThread = containsAnyKeyword(combinedText, ['golden thread', 'information management', 'building information', 'digital record']);

      if (!hasGoldenThread) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No mention of golden thread or information management strategy.',
          failureMode: 'No mention of golden thread or information management'
        };
      }

      const gtDoc = docs.find(d => containsAnyKeyword(d.extractedText, ['golden thread', 'information management'])) || docs[0];
      const text = gtDoc.extractedText;

      const hasApproach = containsAnyKeyword(text, ['approach', 'strategy', 'plan', 'process', 'procedure']);
      const hasStorage = containsAnyKeyword(text, ['stored', 'storage', 'repository', 'database', 'platform', 'system']);
      const hasDigital = containsAnyKeyword(text, ['digital', 'electronic', 'bim', 'cde', 'common data']);
      const hasHandover = containsAnyKeyword(text, ['handover', 'hand over', 'transfer', 'accountable person', 'building owner']);

      const checks = [
        { name: 'approach described', passed: hasApproach },
        { name: 'storage method', passed: hasStorage },
        { name: 'digital format', passed: hasDigital },
        { name: 'handover addressed', passed: hasHandover }
      ];

      const passedChecks = checks.filter(c => c.passed);

      if (passedChecks.length >= 3) {
        const quote = extractQuote(text, 'golden thread') || extractQuote(text, 'information');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: gtDoc.filename, quote, matchType: 'keyword' },
          reasoning: `Golden thread strategy defined with: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 1) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: gtDoc.filename, quote: extractQuote(text, 'golden thread'), matchType: 'keyword' },
          reasoning: `Golden thread acknowledged but approach incomplete. Found: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: 'Acknowledges requirement but no approach described'
        };
      } else {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: gtDoc.filename, quote: extractQuote(text, 'golden thread'), matchType: 'keyword' },
          reasoning: 'Golden thread mentioned but practical details not evident.',
          failureMode: 'Vague statements without practical detail'
        };
      }
    }
  },

  // ============================================
  // SM-013: Change Control Process
  // Category: HRB_DUTIES | Severity: MEDIUM
  // ============================================
  {
    matrixId: 'SM-013',
    name: 'Change Control Process Defined',
    category: 'HRB_DUTIES',
    severity: 'medium',
    check: (docs) => {
      const combinedText = docs.map(d => d.extractedText).join(' ');

      const hasChangeControl = containsAnyKeyword(combinedText, ['change control', 'change management', 'design change', 'variation', 'amendment']);

      if (!hasChangeControl) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No change control process mentioned in submission pack.',
          failureMode: 'No mention of change control'
        };
      }

      const ccDoc = docs.find(d => containsAnyKeyword(d.extractedText, ['change control', 'change management'])) || docs[0];
      const text = ccDoc.extractedText;

      const hasBSRNotification = containsAnyKeyword(text, ['notify bsr', 'bsr notification', 'regulator', 'major change', 'notifiable change']);
      const hasResponsibility = containsAnyKeyword(text, ['responsibility', 'responsible', 'principal designer', 'principal contractor', 'assess']);
      const hasProcess = containsAnyKeyword(text, ['process', 'procedure', 'workflow', 'approval', 'review']);

      const checks = [
        { name: 'BSR notification addressed', passed: hasBSRNotification },
        { name: 'responsibilities assigned', passed: hasResponsibility },
        { name: 'process defined', passed: hasProcess }
      ];

      const passedChecks = checks.filter(c => c.passed);

      if (passedChecks.length >= 2) {
        const quote = extractQuote(text, 'change');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: ccDoc.filename, quote, matchType: 'keyword' },
          reasoning: `Change control process defined: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 1) {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: ccDoc.filename, quote: extractQuote(text, 'change'), matchType: 'keyword' },
          reasoning: `Change control mentioned but incomplete. Found: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: 'No acknowledgment of major change notification requirement'
        };
      } else {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: ccDoc.filename, quote: extractQuote(text, 'change'), matchType: 'keyword' },
          reasoning: 'Change control referenced but BSR-specific requirements not addressed.',
          failureMode: 'Generic quality management without BSR-specific process'
        };
      }
    }
  },

  // ============================================
  // SM-014: Design and Access Statement
  // Category: PACK_COMPLETENESS | Severity: MEDIUM
  // ============================================
  {
    matrixId: 'SM-014',
    name: 'Design and Access Statement Present',
    category: 'PACK_COMPLETENESS',
    severity: 'medium',
    check: (docs) => {
      const dasDoc = findDocument(docs, ['design and access', 'das', 'd&a', 'design statement']);

      if (!dasDoc) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No Design and Access Statement found in submission pack.',
          failureMode: 'No DAS present'
        };
      }

      const text = dasDoc.extractedText;
      const wordCount = text.split(/\s+/).length;

      // Check for substance
      if (wordCount < 500) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: dasDoc.filename, quote: null, matchType: 'structure' },
          reasoning: `DAS found but appears very brief (${wordCount} words). May lack substance.`,
          failureMode: 'DAS present but very brief or lacking substance'
        };
      }

      const hasContext = containsAnyKeyword(text, ['context', 'site', 'surrounding', 'neighbourhood', 'location']);
      const hasDesignRationale = containsAnyKeyword(text, ['rationale', 'design intent', 'approach', 'concept', 'principle']);
      const hasAccess = containsAnyKeyword(text, ['access', 'entrance', 'approach', 'accessibility', 'disabled', 'mobility']);
      const hasEmergencyAccess = containsAnyKeyword(text, ['emergency', 'fire', 'evacuation', 'fire service', 'appliance']);

      const checks = [
        { name: 'context described', passed: hasContext },
        { name: 'design rationale', passed: hasDesignRationale },
        { name: 'access provisions', passed: hasAccess },
        { name: 'emergency access', passed: hasEmergencyAccess }
      ];

      const passedChecks = checks.filter(c => c.passed);

      if (passedChecks.length >= 3) {
        const quote = extractQuote(text, 'design');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: dasDoc.filename, quote, matchType: 'keyword' },
          reasoning: `DAS complete with: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 2) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: dasDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: `DAS present with ${passedChecks.map(c => c.name).join(', ')}. May need enhancement.`,
          failureMode: null
        };
      } else {
        const failedChecks = checks.filter(c => !c.passed);
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: dasDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: `DAS lacks key content. Missing: ${failedChecks.map(c => c.name).join(', ')}.`,
          failureMode: 'Design described but no access considerations'
        };
      }
    }
  },

  // ============================================
  // SM-015: MEP Systems Specification
  // Category: PACK_COMPLETENESS | Severity: MEDIUM
  // ============================================
  {
    matrixId: 'SM-015',
    name: 'MEP Systems Specification Present',
    category: 'PACK_COMPLETENESS',
    severity: 'medium',
    check: (docs) => {
      const mepDoc = findDocument(docs, ['mep', 'm&e', 'mechanical', 'electrical', 'services', 'hvac']);

      if (!mepDoc) {
        // Check if MEP is mentioned in other docs
        const hasMEPMention = docs.some(d => containsAnyKeyword(d.extractedText.slice(0, 10000), ['mechanical', 'electrical', 'hvac', 'ventilation', 'plumbing']));
        if (hasMEPMention) {
          return {
            passed: false,
            confidence: 'needs_review',
            evidence: { found: false, document: null, quote: null, matchType: 'absence' },
            reasoning: 'MEP mentioned in documents but no dedicated specification found.',
            failureMode: 'MEP mentioned in other docs but no dedicated specification'
          };
        }
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No MEP documentation found in submission pack.',
          failureMode: 'No MEP documentation'
        };
      }

      const text = mepDoc.extractedText;

      const hasHeating = containsAnyKeyword(text, ['heating', 'boiler', 'heat pump', 'radiator', 'underfloor', 'district heat']);
      const hasVentilation = containsAnyKeyword(text, ['ventilation', 'mvhr', 'ahu', 'extract', 'supply air', 'fresh air']);
      const hasElectrical = containsAnyKeyword(text, ['electrical', 'power', 'lighting', 'distribution', 'consumer unit']);
      const hasPlumbing = containsAnyKeyword(text, ['plumbing', 'water', 'drainage', 'sanitary', 'soil']);
      const hasFireCoord = containsAnyKeyword(text, ['fire strategy', 'fire engineer', 'smoke', 'damper', 'fire rated']);

      const checks = [
        { name: 'heating', passed: hasHeating },
        { name: 'ventilation', passed: hasVentilation },
        { name: 'electrical', passed: hasElectrical },
        { name: 'plumbing', passed: hasPlumbing },
        { name: 'fire coordination', passed: hasFireCoord }
      ];

      const passedChecks = checks.filter(c => c.passed);

      if (passedChecks.length >= 4) {
        const quote = extractQuote(text, 'mechanical') || extractQuote(text, 'electrical');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: mepDoc.filename, quote, matchType: 'keyword' },
          reasoning: `MEP specification complete covering: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 2) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: mepDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: `MEP specification covers: ${passedChecks.map(c => c.name).join(', ')}. May need enhancement.`,
          failureMode: null
        };
      } else {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: mepDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: 'MEP document found but lacks system details.',
          failureMode: 'Specification exists but lacks system details'
        };
      }
    }
  },

  // ============================================
  // SM-016: Ventilation Strategy (ADF)
  // Category: VENTILATION | Severity: MEDIUM
  // ============================================
  {
    matrixId: 'SM-016',
    name: 'Ventilation Strategy Defined per ADF',
    category: 'VENTILATION',
    severity: 'medium',
    check: (docs) => {
      const ventDoc = findDocument(docs, ['ventilation', 'mep', 'services', 'air quality']);
      const allText = docs.map(d => d.extractedText).join(' ');

      const hasVentilation = containsAnyKeyword(allText, ['ventilation', 'air supply', 'fresh air', 'mvhr', 'mev', 'natural ventilation']);

      if (!hasVentilation) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No ventilation information found in submission pack.',
          failureMode: 'No ventilation information'
        };
      }

      const doc = ventDoc || docs.find(d => containsAnyKeyword(d.extractedText, ['ventilation'])) || docs[0];
      const text = doc.extractedText;

      const hasStrategyType = containsAnyKeyword(text, ['natural ventilation', 'mechanical ventilation', 'mixed mode', 'hybrid', 'mvhr', 'mev', 'piv']);
      const hasRates = /\d+\s*(l\/s|litres?\s*per\s*second|air\s*change)/i.test(text) || containsAnyKeyword(text, ['ventilation rate', 'air change', 'ach', 'l/s']);
      const hasADFRef = containsAnyKeyword(text, ['approved document f', 'adf', 'part f', 'building regulations f']);
      const hasRoomTypes = containsAnyKeyword(text, ['bedroom', 'living', 'kitchen', 'bathroom', 'habitable', 'wet room']);

      const checks = [
        { name: 'strategy type stated', passed: hasStrategyType, critical: true },
        { name: 'ventilation rates', passed: hasRates, critical: false },
        { name: 'ADF reference', passed: hasADFRef, critical: false },
        { name: 'room types addressed', passed: hasRoomTypes, critical: false }
      ];

      const passedChecks = checks.filter(c => c.passed);
      const failedCritical = checks.filter(c => c.critical && !c.passed);

      if (failedCritical.length === 0 && passedChecks.length >= 3) {
        const quote = extractQuote(text, 'ventilation');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: doc.filename, quote, matchType: 'pattern' },
          reasoning: `Ventilation strategy complete: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (failedCritical.length === 0) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: doc.filename, quote: extractQuote(text, 'ventilation'), matchType: 'pattern' },
          reasoning: `Ventilation strategy present. Found: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: doc.filename, quote: null, matchType: 'pattern' },
          reasoning: 'Ventilation mentioned but strategy type not specified.',
          failureMode: 'Mentions "mechanical ventilation" without rates'
        };
      }
    }
  },

  // ============================================
  // SM-017: Fire Detection and Alarm
  // Category: FIRE_SAFETY | Severity: MEDIUM
  // ============================================
  {
    matrixId: 'SM-017',
    name: 'Fire Detection and Alarm System Specified',
    category: 'FIRE_SAFETY',
    severity: 'medium',
    check: (docs) => {
      const fireDoc = findDocument(docs, ['fire strategy', 'fire safety', 'fire alarm', 'detection']);

      if (!fireDoc) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No fire strategy or alarm specification found.',
          failureMode: 'No fire alarm information'
        };
      }

      const text = fireDoc.extractedText;

      const hasAlarmMention = containsAnyKeyword(text, ['fire alarm', 'fire detection', 'detector', 'alarm system']);

      if (!hasAlarmMention) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: fireDoc.filename, quote: null, matchType: 'absence' },
          reasoning: 'Fire strategy found but no fire alarm information.',
          failureMode: 'No fire alarm information'
        };
      }

      // Check for BS 5839 categories (L1, L2, L3, L4, L5, LD1, LD2, LD3)
      const categoryPattern = /\b(l[d]?[1-5]|category\s*[1-5]|grade\s*[a-d])\b/i;
      const hasCategory = categoryPattern.test(text) || containsAnyKeyword(text, ['bs 5839', 'category l', 'grade a', 'grade d']);
      const hasDetectorTypes = containsAnyKeyword(text, ['smoke detector', 'heat detector', 'optical', 'ionisation', 'multi-sensor', 'aspirating']);
      const hasCoverage = containsAnyKeyword(text, ['all areas', 'throughout', 'coverage', 'common areas', 'flat', 'dwelling']);
      const hasEvacLink = containsAnyKeyword(text, ['evacuation', 'alert', 'warning', 'sounders', 'voice alarm']);

      const checks = [
        { name: 'alarm category specified', passed: hasCategory },
        { name: 'detector types', passed: hasDetectorTypes },
        { name: 'coverage stated', passed: hasCoverage },
        { name: 'evacuation link', passed: hasEvacLink }
      ];

      const passedChecks = checks.filter(c => c.passed);

      if (passedChecks.length >= 3) {
        const quote = extractQuote(text, 'alarm') || extractQuote(text, 'detection');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireDoc.filename, quote, matchType: 'pattern' },
          reasoning: `Fire detection fully specified: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 1) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: fireDoc.filename, quote: extractQuote(text, 'alarm'), matchType: 'pattern' },
          reasoning: `Fire alarm mentioned but incomplete. Found: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: hasCategory ? 'Category stated but coverage unclear' : 'Generic "fire alarm system" without category'
        };
      } else {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: fireDoc.filename, quote: extractQuote(text, 'alarm'), matchType: 'keyword' },
          reasoning: 'Fire alarm referenced but specification details missing.',
          failureMode: 'Generic "fire alarm system" without category'
        };
      }
    }
  },

  // ============================================
  // SM-018: Smoke Control Strategy
  // Category: FIRE_SAFETY | Severity: MEDIUM
  // ============================================
  {
    matrixId: 'SM-018',
    name: 'Smoke Control Strategy Defined',
    category: 'FIRE_SAFETY',
    severity: 'medium',
    check: (docs) => {
      const fireDoc = findDocument(docs, ['fire strategy', 'fire safety', 'smoke']);

      if (!fireDoc) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No fire strategy or smoke control documentation found.',
          failureMode: 'No smoke control mentioned'
        };
      }

      const text = fireDoc.extractedText;

      const hasSmokeControl = containsAnyKeyword(text, ['smoke control', 'smoke ventilation', 'smoke extract', 'smoke management', 'aov', 'automatic opening vent']);

      if (!hasSmokeControl) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: fireDoc.filename, quote: null, matchType: 'absence' },
          reasoning: 'Fire strategy found but no smoke control strategy mentioned.',
          failureMode: 'No smoke control mentioned'
        };
      }

      const hasSystemType = containsAnyKeyword(text, ['natural smoke', 'mechanical smoke', 'pressure differential', 'pressurisation', 'depressurisation', 'aov', 'shaft']);
      const hasLocation = containsAnyKeyword(text, ['corridor', 'lobby', 'stair', 'common', 'escape route', 'firefighting']);
      const hasStandard = containsAnyKeyword(text, ['bs 9991', 'bs en 12101', 'bs 7346', 'she']);
      const hasCoordination = containsAnyKeyword(text, ['compartment', 'fire door', 'damper', 'coordination']);

      const checks = [
        { name: 'system type specified', passed: hasSystemType },
        { name: 'locations identified', passed: hasLocation },
        { name: 'standards referenced', passed: hasStandard },
        { name: 'coordination addressed', passed: hasCoordination }
      ];

      const passedChecks = checks.filter(c => c.passed);

      if (passedChecks.length >= 3) {
        const quote = extractQuote(text, 'smoke');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireDoc.filename, quote, matchType: 'pattern' },
          reasoning: `Smoke control strategy complete: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 1) {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: fireDoc.filename, quote: extractQuote(text, 'smoke'), matchType: 'pattern' },
          reasoning: `Smoke control referenced but incomplete. Found: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: 'Strategy unclear'
        };
      } else {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: fireDoc.filename, quote: extractQuote(text, 'smoke'), matchType: 'keyword' },
          reasoning: 'Smoke control mentioned but system type and details not specified.',
          failureMode: 'Smoke control referenced but not specified'
        };
      }
    }
  },

  // ============================================
  // SM-019: Evacuation Strategy Type
  // Category: FIRE_SAFETY | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-019',
    name: 'Evacuation Strategy Type Explicitly Stated',
    category: 'FIRE_SAFETY',
    severity: 'high',
    check: (docs) => {
      const fireDoc = findDocument(docs, ['fire strategy', 'fire safety', 'evacuation']);

      if (!fireDoc) {
        return {
          passed: false,
          confidence: 'definitive',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No fire strategy or evacuation documentation found.',
          failureMode: 'No evacuation strategy stated'
        };
      }

      const text = fireDoc.extractedText;

      const evacStrategies = [
        { keywords: ['simultaneous evacuation', 'simultaneous escape'], name: 'Simultaneous Evacuation' },
        { keywords: ['phased evacuation', 'staged evacuation'], name: 'Phased Evacuation' },
        { keywords: ['stay put', 'stay-put', 'defend in place'], name: 'Stay Put' },
        { keywords: ['progressive horizontal', 'horizontal evacuation'], name: 'Progressive Horizontal' }
      ];

      let foundStrategy: string | null = null;
      let strategyQuote: string | null = null;

      for (const strategy of evacStrategies) {
        if (containsAnyKeyword(text, strategy.keywords)) {
          foundStrategy = strategy.name;
          strategyQuote = extractQuote(text, strategy.keywords[0]);
          break;
        }
      }

      if (!foundStrategy) {
        // Check if evacuation is mentioned but type unclear
        if (containsAnyKeyword(text, ['evacuation', 'evacuate', 'escape'])) {
          return {
            passed: false,
            confidence: 'high',
            evidence: { found: true, document: fireDoc.filename, quote: extractQuote(text, 'evacuation'), matchType: 'keyword' },
            reasoning: 'Evacuation mentioned but strategy type (stay-put, simultaneous, phased) not explicitly stated.',
            failureMode: 'Assumes stay-put without stating it'
          };
        }
        return {
          passed: false,
          confidence: 'definitive',
          evidence: { found: true, document: fireDoc.filename, quote: null, matchType: 'absence' },
          reasoning: 'No evacuation strategy stated in fire documentation.',
          failureMode: 'No evacuation strategy stated'
        };
      }

      const hasJustification = containsAnyKeyword(text, ['because', 'due to', 'based on', 'rationale', 'justified', 'appropriate']);
      const hasResidentComms = containsAnyKeyword(text, ['resident', 'occupant', 'communicated', 'signage', 'notice', 'information']);

      if (hasJustification && hasResidentComms) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireDoc.filename, quote: strategyQuote, matchType: 'keyword' },
          reasoning: `Evacuation strategy explicitly stated as "${foundStrategy}" with justification and resident communication addressed.`,
          failureMode: null
        };
      } else if (hasJustification || hasResidentComms) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireDoc.filename, quote: strategyQuote, matchType: 'keyword' },
          reasoning: `Evacuation strategy stated as "${foundStrategy}".${!hasJustification ? ' Justification not explicit.' : ''}`,
          failureMode: null
        };
      } else {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: fireDoc.filename, quote: strategyQuote, matchType: 'keyword' },
          reasoning: `Evacuation strategy stated as "${foundStrategy}" but justification not provided.`,
          failureMode: null
        };
      }
    }
  },

  // ============================================
  // SM-020: Building Height Consistency
  // Category: CONSISTENCY | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-020',
    name: 'Building Height Consistent Across Documents',
    category: 'CONSISTENCY',
    severity: 'high',
    check: (docs) => {
      const allHeights: { doc: string; heights: number[] }[] = [];

      for (const doc of docs) {
        const heights = extractHeights(doc.extractedText);
        if (heights.length > 0) {
          allHeights.push({ doc: doc.filename, heights });
        }
      }

      if (allHeights.length === 0) {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No building height measurements found in documents.',
          failureMode: 'Height stated in some documents but not others'
        };
      }

      if (allHeights.length === 1) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: allHeights[0].doc, quote: null, matchType: 'pattern' },
          reasoning: `Height found in ${allHeights[0].doc} only. Cannot verify cross-document consistency.`,
          failureMode: null
        };
      }

      // Compare heights across documents
      const allHeightValues = allHeights.flatMap(h => h.heights);
      const maxHeight = Math.max(...allHeightValues);
      const minHeight = Math.min(...allHeightValues);
      const variance = maxHeight - minHeight;

      if (variance <= 1) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: allHeights[0].doc, quote: null, matchType: 'pattern' },
          reasoning: `Building height consistent across ${allHeights.length} documents (${minHeight}-${maxHeight}m).`,
          failureMode: null
        };
      } else if (variance <= 3) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: allHeights[0].doc, quote: null, matchType: 'pattern' },
          reasoning: `Minor height variance (${variance}m) across documents. May be measurement basis difference.`,
          failureMode: null
        };
      } else {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: allHeights[0].doc, quote: null, matchType: 'pattern' },
          reasoning: `Significant height discrepancy: ${minHeight}m to ${maxHeight}m (${variance}m variance) across documents.`,
          failureMode: 'Different heights in different documents'
        };
      }
    }
  },

  // ============================================
  // SM-021: Storey Count Consistency
  // Category: CONSISTENCY | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-021',
    name: 'Storey Count Consistent Across Documents',
    category: 'CONSISTENCY',
    severity: 'high',
    check: (docs) => {
      const allStoreys: { doc: string; counts: number[] }[] = [];

      for (const doc of docs) {
        const counts = extractStoreys(doc.extractedText);
        if (counts.length > 0) {
          allStoreys.push({ doc: doc.filename, counts });
        }
      }

      if (allStoreys.length === 0) {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No storey count found in documents.',
          failureMode: 'Storey count not stated'
        };
      }

      if (allStoreys.length === 1) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: allStoreys[0].doc, quote: null, matchType: 'pattern' },
          reasoning: `Storey count found in ${allStoreys[0].doc} only. Cannot verify cross-document consistency.`,
          failureMode: null
        };
      }

      // Get most common storey count from each doc
      const primaryCounts = allStoreys.map(s => Math.max(...s.counts));
      const uniqueCounts = [...new Set(primaryCounts)];

      if (uniqueCounts.length === 1) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: allStoreys[0].doc, quote: null, matchType: 'pattern' },
          reasoning: `Storey count consistent (${uniqueCounts[0]} storeys) across ${allStoreys.length} documents.`,
          failureMode: null
        };
      } else if (Math.max(...uniqueCounts) - Math.min(...uniqueCounts) === 1) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: allStoreys[0].doc, quote: null, matchType: 'pattern' },
          reasoning: `Minor storey count variance (${Math.min(...uniqueCounts)}-${Math.max(...uniqueCounts)}). May be basement inclusion difference.`,
          failureMode: null
        };
      } else {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: allStoreys[0].doc, quote: null, matchType: 'pattern' },
          reasoning: `Storey count inconsistent: ${uniqueCounts.join(', ')} storeys found in different documents.`,
          failureMode: 'Different storey counts in different documents'
        };
      }
    }
  },

  // ============================================
  // SM-022: Fire Risk Assessment
  // Category: PACK_COMPLETENESS | Severity: MEDIUM
  // ============================================
  {
    matrixId: 'SM-022',
    name: 'Fire Risk Assessment Included',
    category: 'PACK_COMPLETENESS',
    severity: 'medium',
    check: (docs) => {
      const fraDoc = findDocument(docs, ['fire risk assessment', 'fra', 'risk assessment']);

      if (!fraDoc) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No Fire Risk Assessment found in submission pack.',
          failureMode: 'No FRA present'
        };
      }

      const text = fraDoc.extractedText;

      const hasRiskIdentification = containsAnyKeyword(text, ['hazard', 'risk identified', 'fire risk', 'ignition', 'fuel load']);
      const hasLikelihood = containsAnyKeyword(text, ['likelihood', 'probability', 'chance', 'frequency']);
      const hasConsequence = containsAnyKeyword(text, ['consequence', 'impact', 'severity', 'harm', 'injury']);
      const hasMitigation = containsAnyKeyword(text, ['mitigation', 'control', 'measure', 'recommendation', 'action']);
      const hasBuildingSpecific = containsAnyKeyword(text, ['this building', 'the building', 'proposed', 'development']);

      const checks = [
        { name: 'risk identification', passed: hasRiskIdentification },
        { name: 'likelihood assessment', passed: hasLikelihood },
        { name: 'consequence assessment', passed: hasConsequence },
        { name: 'mitigation measures', passed: hasMitigation },
        { name: 'building-specific', passed: hasBuildingSpecific }
      ];

      const passedChecks = checks.filter(c => c.passed);

      if (passedChecks.length >= 4) {
        const quote = extractQuote(text, 'risk');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fraDoc.filename, quote, matchType: 'keyword' },
          reasoning: `FRA complete with: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 2) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: fraDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: `FRA present but may need enhancement. Found: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 1) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: fraDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: 'FRA appears generic or incomplete. May not reference the specific building.',
          failureMode: 'FRA present but generic/template-based'
        };
      } else {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: fraDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: 'Document may be FRA but content does not appear to be risk assessment.',
          failureMode: "FRA doesn't reference the specific building"
        };
      }
    }
  },

  // ============================================
  // SM-023: London Fire Statement (London Only)
  // Category: LONDON_SPECIFIC | Severity: HIGH
  // ============================================
  {
    matrixId: 'SM-023',
    name: 'London Fire Statement Present (London Only)',
    category: 'LONDON_SPECIFIC',
    severity: 'high',
    check: (docs) => {
      // First check if this is a London project
      const allText = docs.map(d => d.extractedText).join(' ');
      const isLondon = containsAnyKeyword(allText, ['london', 'gla', 'greater london', 'tfl', 'london borough']);

      if (!isLondon) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'Project does not appear to be in London. Fire Statement (D12) not required.',
          failureMode: null
        };
      }

      const fireStatementDoc = findDocument(docs, ['fire statement', 'policy d12', 'd12']);

      if (!fireStatementDoc) {
        // Check if fire strategy addresses D12
        const fireDoc = findDocument(docs, ['fire strategy', 'fire safety']);
        if (fireDoc && containsAnyKeyword(fireDoc.extractedText, ['policy d12', 'd12', 'london plan', 'fire statement'])) {
          return {
            passed: true,
            confidence: 'needs_review',
            evidence: { found: true, document: fireDoc.filename, quote: extractQuote(fireDoc.extractedText, 'd12'), matchType: 'keyword' },
            reasoning: 'Fire Strategy appears to address D12 requirements. Dedicated Fire Statement format may be preferred.',
            failureMode: null
          };
        }
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'London project but no Fire Statement (Policy D12) found.',
          failureMode: 'No Fire Statement (London project)'
        };
      }

      const text = fireStatementDoc.extractedText;

      const hasD12Reference = containsAnyKeyword(text, ['policy d12', 'd12', 'london plan']);
      const hasQualifiedAuthor = containsAnyKeyword(text, ['fire engineer', 'third party', 'independent', 'chartered', 'mifirE']);
      const hasD12Sections = containsAnyKeyword(text, ['evacuation', 'access', 'construction', 'water supply', 'alarm']);

      if (hasD12Reference && hasQualifiedAuthor && hasD12Sections) {
        const quote = extractQuote(text, 'd12') || extractQuote(text, 'fire statement');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireStatementDoc.filename, quote, matchType: 'keyword' },
          reasoning: 'London Fire Statement present with D12 reference, qualified author, and required content.',
          failureMode: null
        };
      } else if (hasD12Reference || hasD12Sections) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: fireStatementDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: 'Fire Statement present but may not fully address D12 requirements or author qualifications unclear.',
          failureMode: null
        };
      } else {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: fireStatementDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: 'Document appears to be Fire Statement but D12-specific requirements not evident.',
          failureMode: "Doesn't address D12-specific requirements"
        };
      }
    }
  },

  // ============================================
  // SM-024: PEEP Considerations (London)
  // Category: LONDON_SPECIFIC | Severity: MEDIUM
  // ============================================
  {
    matrixId: 'SM-024',
    name: 'PEEP Considerations Addressed (London Residential)',
    category: 'LONDON_SPECIFIC',
    severity: 'medium',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const isLondon = containsAnyKeyword(allText, ['london', 'gla', 'greater london']);
      const isResidential = containsAnyKeyword(allText, ['residential', 'dwelling', 'flat', 'apartment', 'housing']);

      if (!isLondon || !isResidential) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'Project is not London residential. PEEP requirements may not apply.',
          failureMode: null
        };
      }

      const fireDoc = findDocument(docs, ['fire strategy', 'fire safety', 'fire statement', 'evacuation']);

      if (!fireDoc) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No fire documentation found to assess PEEP provisions.',
          failureMode: 'No mention of PEEPs or disabled evacuation'
        };
      }

      const text = fireDoc.extractedText;

      const hasPEEP = containsAnyKeyword(text, ['peep', 'personal emergency evacuation', 'evacuation plan']);
      const hasDisabledEvac = containsAnyKeyword(text, ['disabled', 'mobility impaired', 'wheelchair', 'impairment', 'accessibility']);
      const hasRefuge = containsAnyKeyword(text, ['refuge', 'protected area', 'evacuation lift', 'evac chair']);
      const hasManagement = containsAnyKeyword(text, ['management', 'procedure', 'building manager', 'concierge', 'fire warden']);

      const checks = [
        { name: 'PEEP mentioned', passed: hasPEEP },
        { name: 'disabled evacuation addressed', passed: hasDisabledEvac },
        { name: 'refuge areas', passed: hasRefuge },
        { name: 'management approach', passed: hasManagement }
      ];

      const passedChecks = checks.filter(c => c.passed);

      if (passedChecks.length >= 3) {
        const quote = extractQuote(text, 'peep') || extractQuote(text, 'disabled') || extractQuote(text, 'refuge');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: fireDoc.filename, quote, matchType: 'keyword' },
          reasoning: `PEEP considerations fully addressed: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 1) {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: fireDoc.filename, quote: null, matchType: 'keyword' },
          reasoning: `PEEP partially addressed. Found: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: 'PEEP mentioned but no management approach'
        };
      } else {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: fireDoc.filename, quote: null, matchType: 'absence' },
          reasoning: 'London residential project but no PEEP or disabled evacuation provisions mentioned.',
          failureMode: 'No mention of PEEPs or disabled evacuation'
        };
      }
    }
  },

  // ============================================
  // SM-025: Document Cross-References
  // Category: TRACEABILITY | Severity: LOW
  // ============================================
  {
    matrixId: 'SM-025',
    name: 'Documents Cross-Reference Each Other',
    category: 'TRACEABILITY',
    severity: 'low',
    check: (docs) => {
      if (docs.length < 2) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'Only one document in pack. Cross-referencing not applicable.',
          failureMode: null
        };
      }

      let crossRefCount = 0;
      const docNames = docs.map(d => d.filename.toLowerCase().replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));

      for (const doc of docs) {
        const text = normalise(doc.extractedText);

        // Check if this doc references other docs
        for (const otherName of docNames) {
          if (otherName !== normalise(doc.filename) && text.includes(otherName.slice(0, 15))) {
            crossRefCount++;
            break;
          }
        }

        // Also check for generic cross-references
        if (containsAnyKeyword(doc.extractedText, ['refer to', 'see also', 'as per', 'in accordance with', 'detailed in', 'drawing number', 'report reference'])) {
          crossRefCount++;
        }
      }

      const crossRefRate = crossRefCount / docs.length;

      if (crossRefRate >= 0.6) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'structure' },
          reasoning: `Good cross-referencing: ${crossRefCount} of ${docs.length} documents reference other documents.`,
          failureMode: null
        };
      } else if (crossRefRate >= 0.3) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'structure' },
          reasoning: `Some cross-referencing present (${crossRefCount} of ${docs.length} docs). Could be improved.`,
          failureMode: null
        };
      } else {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'structure' },
          reasoning: 'Documents appear isolated with minimal cross-referencing.',
          failureMode: 'Documents appear isolated/standalone'
        };
      }
    }
  },

  // ============================================
  // SM-026: Regulatory Compliance Mapping
  // Category: TRACEABILITY | Severity: MEDIUM
  // ============================================
  {
    matrixId: 'SM-026',
    name: 'Regulatory Compliance Mapping Present',
    category: 'TRACEABILITY',
    severity: 'medium',
    check: (docs) => {
      const complianceDoc = findDocument(docs, ['compliance', 'regulations', 'schedule 1', 'building regs']);
      const allText = docs.map(d => d.extractedText).join(' ');

      const hasComplianceMatrix = containsAnyKeyword(allText, ['compliance matrix', 'compliance statement', 'regulation compliance', 'schedule 1']);
      const hasPartReferences = containsAnyKeyword(allText, ['part a', 'part b', 'part c', 'part d', 'part e', 'part f', 'part g', 'part k', 'part l', 'part m', 'part o', 'part s']);
      const hasDocRefs = containsAnyKeyword(allText, ['refer to', 'see section', 'addressed in', 'demonstrated by']);

      if (hasComplianceMatrix) {
        const doc = complianceDoc || docs.find(d => containsAnyKeyword(d.extractedText, ['compliance'])) || docs[0];
        const quote = extractQuote(doc.extractedText, 'compliance');

        if (hasPartReferences && hasDocRefs) {
          return {
            passed: true,
            confidence: 'high',
            evidence: { found: true, document: doc.filename, quote, matchType: 'keyword' },
            reasoning: 'Compliance mapping present with Building Regulations references and document citations.',
            failureMode: null
          };
        } else {
          return {
            passed: true,
            confidence: 'needs_review',
            evidence: { found: true, document: doc.filename, quote, matchType: 'keyword' },
            reasoning: 'Compliance statement present but may not fully map all regulations.',
            failureMode: null
          };
        }
      }

      if (hasPartReferences) {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Building Regulation parts referenced but no dedicated compliance mapping document.',
          failureMode: 'Compliance claimed but not demonstrated'
        };
      }

      return {
        passed: false,
        confidence: 'high',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'No compliance mapping or Building Regulations matrix found.',
        failureMode: 'No compliance mapping'
      };
    }
  },

  // ============================================
  // SM-027: Document Version Control
  // Category: GOLDEN_THREAD | Severity: LOW
  // ============================================
  {
    matrixId: 'SM-027',
    name: 'Document Version Control Evident',
    category: 'GOLDEN_THREAD',
    severity: 'low',
    check: (docs) => {
      let versionedDocs = 0;
      let datedDocs = 0;
      let draftDocs = 0;

      for (const doc of docs) {
        const text = doc.extractedText.slice(0, 5000); // Check beginning of docs
        const filename = doc.filename;

        // Check for version numbers
        const hasVersion = /rev\s*[a-z\d]|revision\s*[a-z\d]|version\s*[\d.]+|v\d+\.\d+/i.test(text) || /rev\s*[a-z\d]|v\d+/i.test(filename);
        if (hasVersion) versionedDocs++;

        // Check for dates
        const hasDate = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b/i.test(text) || /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text);
        if (hasDate) datedDocs++;

        // Check for draft watermarks
        const hasDraft = containsAnyKeyword(text, ['draft', 'preliminary', 'for comment', 'not for construction']);
        if (hasDraft) draftDocs++;
      }

      const versionRate = versionedDocs / docs.length;
      const dateRate = datedDocs / docs.length;

      if (draftDocs > 0) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: `${draftDocs} document(s) appear to be marked as DRAFT.`,
          failureMode: 'Draft watermarks on submitted documents'
        };
      }

      if (versionRate >= 0.6 && dateRate >= 0.6) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: `Good version control: ${versionedDocs}/${docs.length} docs versioned, ${datedDocs}/${docs.length} dated.`,
          failureMode: null
        };
      } else if (dateRate >= 0.5) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: 'Documents are dated but formal revision tracking may be limited.',
          failureMode: null
        };
      } else {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: 'Limited version control evident. Many documents lack revision numbers or dates.',
          failureMode: 'No version numbers on documents'
        };
      }
    }
  },

  // ============================================
  // SM-028: Construction Phase Plan
  // Category: HRB_DUTIES | Severity: MEDIUM
  // ============================================
  {
    matrixId: 'SM-028',
    name: 'Construction Phase Plan Approach Outlined',
    category: 'HRB_DUTIES',
    severity: 'medium',
    check: (docs) => {
      const cppDoc = findDocument(docs, ['construction phase', 'construction plan', 'cpp', 'delivery', 'execution']);
      const allText = docs.map(d => d.extractedText).join(' ');

      const hasCPPMention = containsAnyKeyword(allText, ['construction phase plan', 'cpp', 'construction management', 'site management']);
      const hasQA = containsAnyKeyword(allText, ['quality assurance', 'qa', 'quality control', 'qc', 'inspection', 'test plan']);
      const hasSupervision = containsAnyKeyword(allText, ['supervision', 'clerk of works', 'site supervision', 'resident engineer']);
      const hasDesignIntent = containsAnyKeyword(allText, ['design intent', 'maintained', 'preserved', 'as designed']);

      const checks = [
        { name: 'CPP mentioned', passed: hasCPPMention },
        { name: 'quality assurance', passed: hasQA },
        { name: 'supervision approach', passed: hasSupervision },
        { name: 'design intent preservation', passed: hasDesignIntent }
      ];

      const passedChecks = checks.filter(c => c.passed);

      if (passedChecks.length >= 3) {
        const doc = cppDoc || docs.find(d => containsAnyKeyword(d.extractedText, ['construction', 'quality'])) || docs[0];
        const quote = extractQuote(doc.extractedText, 'construction');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: doc.filename, quote, matchType: 'keyword' },
          reasoning: `Construction phase approach outlined: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 1) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: `Construction management partially addressed. Found: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No construction phase management information found.',
          failureMode: 'No construction management information'
        };
      }
    }
  },

  // ============================================
  // SM-029: Building Description
  // Category: PACK_COMPLETENESS | Severity: MEDIUM
  // ============================================
  {
    matrixId: 'SM-029',
    name: 'Building Description Clear and Complete',
    category: 'PACK_COMPLETENESS',
    severity: 'medium',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');

      const hasUse = containsAnyKeyword(allText, ['residential', 'commercial', 'mixed use', 'office', 'retail', 'dwelling']);
      const hasHeight = /\d+\s*(m|metres?|meters?|storeys?|stories|floors?)/i.test(allText);
      const hasUnits = /\d+\s*(units?|flats?|apartments?|dwellings?)/i.test(allText) || /\d+\s*(sqm|sq\.?\s*m|m[²2])/i.test(allText);
      const hasConstruction = containsAnyKeyword(allText, ['concrete', 'steel', 'timber', 'masonry', 'frame', 'construction type']);

      const checks = [
        { name: 'use/purpose', passed: hasUse },
        { name: 'height/storeys', passed: hasHeight },
        { name: 'units/area', passed: hasUnits },
        { name: 'construction type', passed: hasConstruction }
      ];

      const passedChecks = checks.filter(c => c.passed);

      if (passedChecks.length >= 4) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: `Building clearly described with: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 2) {
        const failedChecks = checks.filter(c => !c.passed);
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: `Building description present but may be incomplete. Missing: ${failedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else {
        const failedChecks = checks.filter(c => !c.passed);
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: `Building description incomplete. Missing: ${failedChecks.map(c => c.name).join(', ')}.`,
          failureMode: 'Key parameters missing'
        };
      }
    }
  },

  // ============================================
  // SM-030: Site Location and Context
  // Category: PACK_COMPLETENESS | Severity: LOW
  // ============================================
  {
    matrixId: 'SM-030',
    name: 'Site Location and Context Documented',
    category: 'PACK_COMPLETENESS',
    severity: 'low',
    check: (docs) => {
      const siteDoc = findDocument(docs, ['site', 'location', 'context', 'das', 'design and access']);
      const allText = docs.map(d => d.extractedText).join(' ');

      const hasSitePlan = containsAnyKeyword(allText, ['site plan', 'site layout', 'location plan', 'block plan']);
      const hasContext = containsAnyKeyword(allText, ['surrounding', 'adjacent', 'neighbour', 'context', 'vicinity']);
      const hasAccess = containsAnyKeyword(allText, ['access', 'entrance', 'approach', 'road', 'vehicle']);
      const hasConstraints = containsAnyKeyword(allText, ['constraint', 'boundary', 'setback', 'easement', 'right of way']);

      const checks = [
        { name: 'site plan referenced', passed: hasSitePlan },
        { name: 'context described', passed: hasContext },
        { name: 'access routes', passed: hasAccess },
        { name: 'constraints noted', passed: hasConstraints }
      ];

      const passedChecks = checks.filter(c => c.passed);

      if (passedChecks.length >= 3) {
        const doc = siteDoc || docs[0];
        const quote = extractQuote(doc.extractedText, 'site');
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: doc.filename, quote, matchType: 'keyword' },
          reasoning: `Site context well documented: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else if (passedChecks.length >= 1) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: `Some site context present. Found: ${passedChecks.map(c => c.name).join(', ')}.`,
          failureMode: null
        };
      } else {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'Limited site context information found in submission pack.',
          failureMode: 'No site plan'
        };
      }
    }
  },

  // ============================================
  // ADDITIONAL GRANULAR RULES (SM-031 to SM-055)
  // More detailed checks for BSR compliance
  // ============================================

  // SM-031: Fire Door Specification
  {
    matrixId: 'SM-031',
    name: 'Fire Door Ratings Specified',
    category: 'FIRE_SAFETY',
    severity: 'high',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasFD30 = containsAnyKeyword(allText, ['fd30', 'fd 30', '30 minute door', '30-minute door']);
      const hasFD60 = containsAnyKeyword(allText, ['fd60', 'fd 60', '60 minute door', '60-minute door']);
      const hasFireDoor = containsAnyKeyword(allText, ['fire door', 'fire-rated door', 'fire rated door']);
      const hasSchedule = containsAnyKeyword(allText, ['door schedule', 'door specification', 'ironmongery']);

      if ((hasFD30 || hasFD60) && hasSchedule) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Fire door ratings (FD30/FD60) specified with door schedule.',
          failureMode: null
        };
      } else if (hasFireDoor) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Fire doors mentioned but specific ratings (FD30/FD60) not specified.',
          failureMode: 'Fire doors mentioned without FD ratings'
        };
      }
      return {
        passed: false,
        confidence: 'high',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'No fire door specification found.',
        failureMode: 'No fire door specification'
      };
    }
  },

  // SM-032: Emergency Lighting
  {
    matrixId: 'SM-032',
    name: 'Emergency Lighting Specification',
    category: 'FIRE_SAFETY',
    severity: 'medium',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasEmergencyLighting = containsAnyKeyword(allText, ['emergency lighting', 'emergency light', 'escape lighting']);
      const hasDuration = /\d+\s*(hour|hr).*emergency|emergency.*\d+\s*(hour|hr)/i.test(allText);
      const hasLuxLevel = containsAnyKeyword(allText, ['lux', 'illumination level', 'light level']);
      const hasBS5266 = containsAnyKeyword(allText, ['bs 5266', 'bs5266', 'en 1838']);

      if (hasEmergencyLighting && (hasDuration || hasBS5266)) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: 'Emergency lighting specified with duration or BS 5266 reference.',
          failureMode: null
        };
      } else if (hasEmergencyLighting) {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Emergency lighting mentioned but specification details missing.',
          failureMode: 'Emergency lighting without duration specification'
        };
      }
      return {
        passed: false,
        confidence: 'high',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'No emergency lighting specification found.',
        failureMode: 'No emergency lighting mentioned'
      };
    }
  },

  // SM-033: Fire Stopping Details
  {
    matrixId: 'SM-033',
    name: 'Fire Stopping and Penetration Seals',
    category: 'FIRE_SAFETY',
    severity: 'high',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasFireStopping = containsAnyKeyword(allText, ['fire stopping', 'firestopping', 'fire stop']);
      const hasPenetrations = containsAnyKeyword(allText, ['penetration', 'service penetration', 'pipe penetration', 'cable penetration']);
      const hasIntumescent = containsAnyKeyword(allText, ['intumescent', 'fire collar', 'fire sleeve', 'fire seal']);
      const hasInstallation = containsAnyKeyword(allText, ['third party certified', 'firas', 'bre', 'lpcb', 'competent installer']);

      const score = [hasFireStopping, hasPenetrations, hasIntumescent, hasInstallation].filter(Boolean).length;

      if (score >= 3) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Fire stopping strategy comprehensive with penetration seals and certification addressed.',
          failureMode: null
        };
      } else if (score >= 1) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Fire stopping partially addressed. Service penetration sealing details may be incomplete.',
          failureMode: 'Fire stopping mentioned but installation standards not referenced'
        };
      }
      return {
        passed: false,
        confidence: 'definitive',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'No fire stopping or penetration sealing information found.',
        failureMode: 'No fire stopping information'
      };
    }
  },

  // SM-034: Resident Evacuation Communication
  {
    matrixId: 'SM-034',
    name: 'Resident Communication of Evacuation Strategy',
    category: 'FIRE_SAFETY',
    severity: 'medium',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasResidentComms = containsAnyKeyword(allText, ['resident', 'occupant', 'tenant']);
      const hasEvacComms = containsAnyKeyword(allText, ['communicated', 'informed', 'notified', 'signage', 'notice']);
      const hasEvacStrategy = containsAnyKeyword(allText, ['stay put', 'simultaneous', 'evacuation strategy']);

      if (hasResidentComms && hasEvacComms && hasEvacStrategy) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Resident communication of evacuation strategy addressed.',
          failureMode: null
        };
      } else if (hasEvacStrategy) {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Evacuation strategy stated but resident communication approach not addressed.',
          failureMode: 'Strategy exists but communication plan unclear'
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'No resident evacuation communication approach found.',
        failureMode: 'No resident communication plan'
      };
    }
  },

  // SM-035: Wayfinding and Signage
  {
    matrixId: 'SM-035',
    name: 'Wayfinding and Escape Signage',
    category: 'FIRE_SAFETY',
    severity: 'low',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasWayfinding = containsAnyKeyword(allText, ['wayfinding', 'signage', 'sign', 'exit sign']);
      const hasEscapeSign = containsAnyKeyword(allText, ['escape sign', 'fire exit', 'running man', 'photoluminescent']);
      const hasBS5499 = containsAnyKeyword(allText, ['bs 5499', 'bs5499', 'iso 7010']);

      if ((hasWayfinding || hasEscapeSign) && hasBS5499) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Wayfinding and escape signage specified with standards reference.',
          failureMode: null
        };
      } else if (hasWayfinding || hasEscapeSign) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Signage mentioned but standards compliance not confirmed.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'No wayfinding or escape signage specification found.',
        failureMode: 'No signage specification'
      };
    }
  },

  // SM-036: Dry/Wet Riser Specification
  {
    matrixId: 'SM-036',
    name: 'Dry or Wet Riser Provision',
    category: 'FIRE_SAFETY',
    severity: 'high',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const heights = extractHeights(allText);
      const maxHeight = heights.length > 0 ? Math.max(...heights) : 0;

      const hasDryRiser = containsAnyKeyword(allText, ['dry riser', 'dry rising main']);
      const hasWetRiser = containsAnyKeyword(allText, ['wet riser', 'wet rising main']);
      const hasBS9990 = containsAnyKeyword(allText, ['bs 9990', 'bs9990']);

      // Dry riser required above 18m, wet riser above 50m
      if (maxHeight > 50 && !hasWetRiser) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: `Building appears to be ${maxHeight}m+ but wet riser not specified (required above 50m).`,
          failureMode: 'Building over 50m without wet riser specification'
        };
      } else if (maxHeight > 18 && !hasDryRiser && !hasWetRiser) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: `Building appears to be ${maxHeight}m+ but no dry/wet riser specified (required above 18m).`,
          failureMode: 'Building over 18m without riser specification'
        };
      } else if (hasDryRiser || hasWetRiser) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: `${hasWetRiser ? 'Wet' : 'Dry'} riser provision specified.`,
          failureMode: null
        };
      }
      return {
        passed: true,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'Building height unclear. Riser requirements cannot be verified.',
        failureMode: null
      };
    }
  },

  // SM-037: Balcony/Terrace Fire Safety
  {
    matrixId: 'SM-037',
    name: 'Balcony and Terrace Fire Safety',
    category: 'FIRE_SAFETY',
    severity: 'medium',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasBalcony = containsAnyKeyword(allText, ['balcony', 'terrace', 'roof terrace', 'external amenity']);

      if (!hasBalcony) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No balconies or terraces identified. Check not applicable.',
          failureMode: null
        };
      }

      const hasMaterials = containsAnyKeyword(allText, ['balcony material', 'decking', 'non-combustible', 'a1', 'a2']);
      const hasDrainage = containsAnyKeyword(allText, ['drainage', 'drain', 'outlet']);
      const hasCompartment = containsAnyKeyword(allText, ['balcony screen', 'fire break', 'compartment']);

      const score = [hasMaterials, hasDrainage, hasCompartment].filter(Boolean).length;

      if (score >= 2) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Balcony fire safety addressed including materials and/or compartmentation.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
        reasoning: 'Balconies present but fire safety treatment not fully specified.',
        failureMode: 'Balconies present but fire safety unclear'
      };
    }
  },

  // SM-038: Basement Fire Strategy
  {
    matrixId: 'SM-038',
    name: 'Basement Fire Safety Strategy',
    category: 'FIRE_SAFETY',
    severity: 'high',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasBasement = containsAnyKeyword(allText, ['basement', 'below ground', 'underground', 'lower ground']);

      if (!hasBasement) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No basement identified. Check not applicable.',
          failureMode: null
        };
      }

      const hasSmokeVent = containsAnyKeyword(allText, ['smoke vent', 'basement ventilation', 'smoke extract basement']);
      const hasSeparation = containsAnyKeyword(allText, ['basement separation', 'basement compartment', 'basement stair']);
      const hasEscape = containsAnyKeyword(allText, ['basement escape', 'basement exit', 'alternative exit']);

      const score = [hasSmokeVent, hasSeparation, hasEscape].filter(Boolean).length;

      if (score >= 2) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Basement fire safety strategy addressed with smoke ventilation and/or separation.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'high',
        evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
        reasoning: 'Basement present but fire safety strategy not fully addressed.',
        failureMode: 'Basement without dedicated fire strategy'
      };
    }
  },

  // SM-039: Car Park Fire Safety
  {
    matrixId: 'SM-039',
    name: 'Car Park Fire Safety (if applicable)',
    category: 'FIRE_SAFETY',
    severity: 'medium',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasCarPark = containsAnyKeyword(allText, ['car park', 'parking', 'garage', 'vehicle storage']);

      if (!hasCarPark) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No car park identified. Check not applicable.',
          failureMode: null
        };
      }

      const hasVentilation = containsAnyKeyword(allText, ['car park ventilation', 'co detection', 'carbon monoxide', 'impulse fan']);
      const hasEV = containsAnyKeyword(allText, ['ev charging', 'electric vehicle', 'charging point']);
      const hasFireSuppression = containsAnyKeyword(allText, ['car park sprinkler', 'vehicle fire', 'foam']);

      if (hasVentilation && (hasFireSuppression || !hasEV)) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Car park fire safety addressed with ventilation strategy.',
          failureMode: null
        };
      } else if (hasEV && !hasFireSuppression) {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'EV charging proposed but enhanced fire suppression may be required.',
          failureMode: 'EV charging without enhanced fire suppression consideration'
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
        reasoning: 'Car park present but fire safety strategy not evident.',
        failureMode: 'Car park without fire strategy'
      };
    }
  },

  // SM-040: Refuse/Bin Store Fire Safety
  {
    matrixId: 'SM-040',
    name: 'Refuse Store Fire Safety',
    category: 'FIRE_SAFETY',
    severity: 'low',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasRefuse = containsAnyKeyword(allText, ['refuse', 'bin store', 'waste storage', 'bin room']);

      if (!hasRefuse) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No refuse store identified. Check not applicable.',
          failureMode: null
        };
      }

      const hasSeparation = containsAnyKeyword(allText, ['refuse room', 'bin store compartment', 'fire rated', 'separated']);
      const hasSprinkler = containsAnyKeyword(allText, ['refuse sprinkler', 'bin store sprinkler']);

      if (hasSeparation) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Refuse store fire separation addressed.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
        reasoning: 'Refuse store present but fire separation not confirmed.',
        failureMode: 'Refuse store without confirmed fire separation'
      };
    }
  },

  // SM-041: Competent Person Scheme
  {
    matrixId: 'SM-041',
    name: 'Competent Person Scheme References',
    category: 'HRB_DUTIES',
    severity: 'medium',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasCompetent = containsAnyKeyword(allText, ['competent person', 'third party', 'certification']);
      const hasSchemes = containsAnyKeyword(allText, ['firas', 'bre', 'lpcb', 'bm trada', 'ias', 'ifcc', 'certifire']);

      if (hasCompetent && hasSchemes) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Third party certification schemes referenced for fire safety installations.',
          failureMode: null
        };
      } else if (hasCompetent) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Competent persons mentioned but specific certification schemes not named.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'No reference to competent person schemes or third party certification.',
        failureMode: 'No competent person scheme references'
      };
    }
  },

  // SM-042: Building Safety Manager Provisions
  {
    matrixId: 'SM-042',
    name: 'Building Safety Manager Considerations',
    category: 'HRB_DUTIES',
    severity: 'medium',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasBSM = containsAnyKeyword(allText, ['building safety manager', 'bsm', 'safety manager']);
      const hasAP = containsAnyKeyword(allText, ['accountable person', 'responsible person', 'duty holder']);
      const hasHandover = containsAnyKeyword(allText, ['handover', 'operational', 'management']);

      if (hasBSM || (hasAP && hasHandover)) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Building Safety Manager or Accountable Person provisions addressed.',
          failureMode: null
        };
      } else if (hasAP || hasHandover) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Some operational handover considerations present.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'No Building Safety Manager or operational provisions identified.',
        failureMode: 'No BSM/AP provisions'
      };
    }
  },

  // SM-043: Occupation During Works
  {
    matrixId: 'SM-043',
    name: 'Partial Occupation Strategy (if applicable)',
    category: 'HRB_DUTIES',
    severity: 'medium',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasPartialOcc = containsAnyKeyword(allText, ['partial occupation', 'phased occupation', 'occupied during', 'residents during']);
      const hasManagement = containsAnyKeyword(allText, ['management during construction', 'interim measures', 'temporary protection']);

      if (!hasPartialOcc) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'No partial occupation indicated. Check may not be applicable.',
          failureMode: null
        };
      }

      if (hasManagement) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Partial occupation strategy includes management provisions.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'high',
        evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
        reasoning: 'Partial occupation indicated but management strategy not clear.',
        failureMode: 'Partial occupation without management plan'
      };
    }
  },

  // SM-044: Specialist Subcontractor Competence
  {
    matrixId: 'SM-044',
    name: 'Specialist Subcontractor Competence Approach',
    category: 'HRB_DUTIES',
    severity: 'low',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasSubcontractor = containsAnyKeyword(allText, ['subcontractor', 'sub-contractor', 'specialist contractor', 'trade contractor']);
      const hasCompetence = containsAnyKeyword(allText, ['competence', 'competent', 'qualified', 'trained', 'certification']);
      const hasVetting = containsAnyKeyword(allText, ['vetting', 'assessment', 'approved', 'supply chain']);

      if (hasSubcontractor && hasCompetence) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Subcontractor competence approach addressed.',
          failureMode: null
        };
      } else if (hasSubcontractor) {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Subcontractors mentioned but competence verification approach not stated.',
          failureMode: 'Subcontractors without competence approach'
        };
      }
      return {
        passed: true,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'No specific subcontractor provisions identified.',
        failureMode: null
      };
    }
  },

  // SM-045: As-Built Documentation Commitment
  {
    matrixId: 'SM-045',
    name: 'As-Built Documentation Commitment',
    category: 'GOLDEN_THREAD',
    severity: 'medium',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasAsBuilt = containsAnyKeyword(allText, ['as-built', 'as built', 'record drawing', 'final documentation']);
      const hasOandM = containsAnyKeyword(allText, ['o&m', 'operation and maintenance', 'o & m', 'operational manual']);
      const hasCommitment = containsAnyKeyword(allText, ['will be provided', 'shall be provided', 'commitment', 'upon completion']);

      if ((hasAsBuilt || hasOandM) && hasCommitment) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'As-built documentation commitment clearly stated.',
          failureMode: null
        };
      } else if (hasAsBuilt || hasOandM) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'As-built documentation mentioned but commitment not explicit.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'No as-built documentation commitment found.',
        failureMode: 'No as-built documentation commitment'
      };
    }
  },

  // SM-046: BIM Level/Approach
  {
    matrixId: 'SM-046',
    name: 'BIM Strategy for Golden Thread',
    category: 'GOLDEN_THREAD',
    severity: 'low',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasBIM = containsAnyKeyword(allText, ['bim', 'building information model', 'revit', 'navisworks']);
      const hasLevel = containsAnyKeyword(allText, ['level 2', 'bim level', 'iso 19650', 'bs en iso 19650']);
      const hasCDE = containsAnyKeyword(allText, ['cde', 'common data environment', 'data platform']);

      if (hasBIM && (hasLevel || hasCDE)) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'BIM strategy defined with level/standard or CDE reference.',
          failureMode: null
        };
      } else if (hasBIM) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'BIM mentioned but specific approach not detailed.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'No BIM strategy identified.',
        failureMode: 'No BIM strategy'
      };
    }
  },

  // SM-047: Drawing Issue/Revision Control
  {
    matrixId: 'SM-047',
    name: 'Drawing Revision Control System',
    category: 'GOLDEN_THREAD',
    severity: 'low',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasDrawingControl = containsAnyKeyword(allText, ['drawing register', 'drawing issue', 'revision control', 'document register']);
      const hasRevision = /rev\s*[a-z\d]|revision\s*[a-z\d]|issue\s*\d/i.test(allText);
      const hasNaming = containsAnyKeyword(allText, ['naming convention', 'file naming', 'drawing number']);

      if (hasDrawingControl && hasRevision) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: 'Drawing revision control system evident.',
          failureMode: null
        };
      } else if (hasRevision) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: 'Revisions apparent but formal control system not confirmed.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'No drawing revision control system evident.',
        failureMode: 'No revision control system'
      };
    }
  },

  // SM-048: Overheating Assessment
  {
    matrixId: 'SM-048',
    name: 'Overheating Risk Assessment',
    category: 'VENTILATION',
    severity: 'medium',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasOverheating = containsAnyKeyword(allText, ['overheating', 'thermal comfort', 'summer overheating']);
      const hasTM59 = containsAnyKeyword(allText, ['tm59', 'tm 59', 'cibse tm59']);
      const hasTM52 = containsAnyKeyword(allText, ['tm52', 'tm 52', 'cibse tm52']);
      const hasPartO = containsAnyKeyword(allText, ['part o', 'approved document o', 'ado']);

      if (hasOverheating && (hasTM59 || hasTM52 || hasPartO)) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Overheating assessment referenced with appropriate methodology.',
          failureMode: null
        };
      } else if (hasOverheating) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Overheating addressed but methodology not specified.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'No overheating assessment found. Required for residential buildings.',
        failureMode: 'No overheating assessment'
      };
    }
  },

  // SM-049: Corridor/Common Area Ventilation
  {
    matrixId: 'SM-049',
    name: 'Common Area Ventilation',
    category: 'VENTILATION',
    severity: 'medium',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasCorridorVent = containsAnyKeyword(allText, ['corridor ventilation', 'common area ventilation', 'lobby ventilation']);
      const hasSmokeVent = containsAnyKeyword(allText, ['smoke shaft', 'aov', 'automatic opening vent', 'smoke ventilation']);
      const hasNaturalVent = containsAnyKeyword(allText, ['natural ventilation corridor', 'openable window corridor']);

      if (hasCorridorVent || hasSmokeVent || hasNaturalVent) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Common area ventilation strategy specified.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'Common area ventilation strategy not identified.',
        failureMode: 'No common area ventilation strategy'
      };
    }
  },

  // SM-050: Kitchen Extract Strategy
  {
    matrixId: 'SM-050',
    name: 'Kitchen Extract and Makeup Air',
    category: 'VENTILATION',
    severity: 'low',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasKitchenExtract = containsAnyKeyword(allText, ['kitchen extract', 'cooker hood', 'cooking extract', 'kitchen ventilation']);
      const hasMakeupAir = containsAnyKeyword(allText, ['makeup air', 'make-up air', 'replacement air']);
      const hasRate = /\d+\s*l\/s|litres?\s*per\s*second/i.test(allText) && containsAnyKeyword(allText, ['kitchen', 'extract']);

      if (hasKitchenExtract && (hasMakeupAir || hasRate)) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Kitchen extract strategy specified with rates or makeup air.',
          failureMode: null
        };
      } else if (hasKitchenExtract) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Kitchen extract mentioned but details not confirmed.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'No kitchen extract strategy identified.',
        failureMode: 'No kitchen extract strategy'
      };
    }
  },

  // SM-051: Building Use Consistency
  {
    matrixId: 'SM-051',
    name: 'Building Use Consistently Described',
    category: 'CONSISTENCY',
    severity: 'medium',
    check: (docs) => {
      const useTypes: { doc: string; uses: string[] }[] = [];
      const usePatterns = ['residential', 'commercial', 'office', 'retail', 'mixed use', 'hotel', 'student'];

      for (const doc of docs) {
        const foundUses = usePatterns.filter(u => containsAnyKeyword(doc.extractedText, [u]));
        if (foundUses.length > 0) {
          useTypes.push({ doc: doc.filename, uses: foundUses });
        }
      }

      if (useTypes.length === 0) {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: false, document: null, quote: null, matchType: 'absence' },
          reasoning: 'Building use type not clearly identified.',
          failureMode: 'Building use unclear'
        };
      }

      const allUses = [...new Set(useTypes.flatMap(u => u.uses))];
      const isMixedUse = allUses.includes('mixed use') || allUses.length > 1;

      if (isMixedUse && allUses.length <= 3) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: useTypes[0].doc, quote: null, matchType: 'pattern' },
          reasoning: `Building use consistent: ${allUses.join(', ')}.`,
          failureMode: null
        };
      } else if (allUses.length === 1) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: useTypes[0].doc, quote: null, matchType: 'pattern' },
          reasoning: `Building use consistently described as ${allUses[0]}.`,
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: true, document: useTypes[0].doc, quote: null, matchType: 'pattern' },
        reasoning: `Multiple use types found (${allUses.join(', ')}) - verify consistency.`,
        failureMode: 'Inconsistent building use descriptions'
      };
    }
  },

  // SM-052: Address/Location Consistency
  {
    matrixId: 'SM-052',
    name: 'Site Address Consistently Referenced',
    category: 'CONSISTENCY',
    severity: 'low',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasAddress = containsAnyKeyword(allText, ['address', 'site address', 'location', 'postcode']);
      const postcodePattern = /[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/gi;
      const postcodes = allText.match(postcodePattern) || [];
      const uniquePostcodes = [...new Set(postcodes.map(p => p.replace(/\s/g, '').toUpperCase()))];

      if (uniquePostcodes.length === 1) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: `Site address/postcode consistent (${uniquePostcodes[0]}).`,
          failureMode: null
        };
      } else if (uniquePostcodes.length > 1) {
        return {
          passed: false,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: `Multiple postcodes found: ${uniquePostcodes.join(', ')}. Verify consistency.`,
          failureMode: 'Multiple postcodes in documents'
        };
      } else if (hasAddress) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Address referenced but postcode not consistently extracted.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'Site address/postcode not clearly identified.',
        failureMode: 'No site address identified'
      };
    }
  },

  // SM-053: Project Name Consistency
  {
    matrixId: 'SM-053',
    name: 'Project Name Consistently Used',
    category: 'CONSISTENCY',
    severity: 'low',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasProjectName = containsAnyKeyword(allText, ['project name', 'project title', 'development name', 'scheme name']);

      if (hasProjectName) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Project name referenced. Manual verification of consistency recommended.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'Project name not clearly identified across documents.',
        failureMode: 'No clear project name'
      };
    }
  },

  // SM-054: Architect/Design Team Named
  {
    matrixId: 'SM-054',
    name: 'Design Team Identified',
    category: 'TRACEABILITY',
    severity: 'low',
    check: (docs) => {
      const allText = docs.map(d => d.extractedText).join(' ');
      const hasArchitect = containsAnyKeyword(allText, ['architect', 'architectural', 'riba', 'arb']);
      const hasEngineer = containsAnyKeyword(allText, ['structural engineer', 'fire engineer', 'm&e engineer', 'services engineer']);
      const hasDesignTeam = containsAnyKeyword(allText, ['design team', 'design consultant', 'prepared by', 'author']);

      const score = [hasArchitect, hasEngineer, hasDesignTeam].filter(Boolean).length;

      if (score >= 2) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Design team members identified.',
          failureMode: null
        };
      } else if (score >= 1) {
        return {
          passed: true,
          confidence: 'needs_review',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'keyword' },
          reasoning: 'Some design team members identified. Full team should be documented.',
          failureMode: null
        };
      }
      return {
        passed: false,
        confidence: 'needs_review',
        evidence: { found: false, document: null, quote: null, matchType: 'absence' },
        reasoning: 'Design team not clearly identified.',
        failureMode: 'Design team not identified'
      };
    }
  },

  // SM-055: Document Dates Current
  {
    matrixId: 'SM-055',
    name: 'Documents Dated Within Last 12 Months',
    category: 'TRACEABILITY',
    severity: 'medium',
    check: (docs) => {
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      let currentDocs = 0;
      let oldDocs = 0;
      let undatedDocs = 0;

      for (const doc of docs) {
        const text = doc.extractedText.slice(0, 5000);
        const hasCurrentYear = text.includes(String(currentYear));
        const hasLastYear = text.includes(String(lastYear));
        const hasOldYear = /20[0-1]\d|202[0-3]/.test(text) && !hasLastYear && !hasCurrentYear;

        if (hasCurrentYear || hasLastYear) {
          currentDocs++;
        } else if (hasOldYear) {
          oldDocs++;
        } else {
          undatedDocs++;
        }
      }

      if (oldDocs > 0 && oldDocs > currentDocs) {
        return {
          passed: false,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: `${oldDocs} documents appear to be dated before ${lastYear}. May need updating.`,
          failureMode: 'Documents may be outdated'
        };
      } else if (currentDocs > 0) {
        return {
          passed: true,
          confidence: 'high',
          evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
          reasoning: `${currentDocs} documents dated ${lastYear}-${currentYear}.`,
          failureMode: null
        };
      }
      return {
        passed: true,
        confidence: 'needs_review',
        evidence: { found: true, document: docs[0].filename, quote: null, matchType: 'pattern' },
        reasoning: 'Document dates could not be reliably extracted. Manual verification recommended.',
        failureMode: null
      };
    }
  }
];

// ============================================
// MAIN EXPORTS
// ============================================

export interface DeterministicAssessment {
  matrixId: string;
  ruleName: string;
  category: string;
  severity: 'high' | 'medium' | 'low';
  result: RuleResult;
  requiresLLMReview: boolean;
}

export function runDeterministicChecks(docs: DocumentEvidence[]): DeterministicAssessment[] {
  const results: DeterministicAssessment[] = [];

  for (const rule of DETERMINISTIC_RULES) {
    const result = rule.check(docs);
    results.push({
      matrixId: rule.matrixId,
      ruleName: rule.name,
      category: rule.category,
      severity: rule.severity,
      result,
      requiresLLMReview: result.confidence === 'needs_review'
    });
  }

  return results;
}

export function runSingleRule(matrixId: string, docs: DocumentEvidence[]): DeterministicAssessment | null {
  const rule = DETERMINISTIC_RULES.find(r => r.matrixId === matrixId);
  if (!rule) return null;

  const result = rule.check(docs);
  return {
    matrixId: rule.matrixId,
    ruleName: rule.name,
    category: rule.category,
    severity: rule.severity,
    result,
    requiresLLMReview: result.confidence === 'needs_review'
  };
}

export function getRulesByCategory(category: string): DeterministicRule[] {
  return DETERMINISTIC_RULES.filter(r => r.category === category);
}

export function getRulesBySeverity(severity: 'high' | 'medium' | 'low'): DeterministicRule[] {
  return DETERMINISTIC_RULES.filter(r => r.severity === severity);
}
