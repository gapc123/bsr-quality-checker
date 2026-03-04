/**
 * Utility functions for report formatting
 */

export function formatCurrency(amount: number): string {
  if (amount === 0) return '£0';
  if (amount < 1000) return `£${amount}`;
  return `£${(amount / 1000).toFixed(0)}K`;
}

export function formatCurrencyRange(min: number, max: number): string {
  if (min === 0 && max === 0) return '£0';
  if (min === max) return formatCurrency(min);
  return `${formatCurrency(min)}-${formatCurrency(max)}`;
}

export function formatDaysAsWeeks(days: number): string {
  if (days === 0) return '<1 day';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  const weeks = Math.round(days / 7);
  if (weeks === 1) return '1 week';
  return `${weeks} weeks`;
}

export function getSeverityEmoji(severity: string): string {
  const map: Record<string, string> = {
    'critical': '🔴 CRIT',
    'high': '🟠 HIGH',
    'medium': '🟡 MED',
    'low': '🟢 LOW',
  };
  return map[severity] || '⚪ N/A';
}

export function getVerdictEmoji(verdict: string): string {
  const map: Record<string, string> = {
    'RED': '🔴',
    'AMBER': '🟠',
    'GREEN': '🟢',
  };
  return map[verdict] || '⚪';
}

export function truncateTitle(title: string, maxLength: number = 45): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 3) + '...';
}

export function formatRegulatoryRef(criterion: any): string {
  // Try to extract a short reference
  if (criterion.reference_evidence?.doc_title) {
    const title = criterion.reference_evidence.doc_title;
    // Try to shorten common titles
    if (title.includes('Approved Document B')) return 'ADB';
    if (title.includes('Approved Document A')) return 'ADA';
    if (title.includes('Approved Document F')) return 'ADF';
    if (title.includes('Building Safety Act')) return 'BSA 2022';
    if (title.includes('Regulation')) {
      const match = title.match(/Regulation (\d+)/);
      if (match) return `Reg ${match[1]}`;
    }
    return title.substring(0, 20);
  }

  // Fallback to category
  const catMap: Record<string, string> = {
    'FIRE_SAFETY': 'ADB',
    'STRUCTURAL': 'ADA',
    'HRB_DUTIES': 'BSA s.75+',
    'GOLDEN_THREAD': 'BSA Pt3',
    'VENTILATION': 'ADF',
    'CONSISTENCY': 'BSA Comp',
    'TRACEABILITY': 'BSA GT',
  };
  return catMap[criterion.category] || 'Various';
}

export function createTableRow(columns: string[], widths: number[]): string {
  return '│ ' + columns.map((col, i) => col.padEnd(widths[i])).join(' │ ') + ' │';
}

export function createTableSeparator(widths: number[], type: 'top' | 'middle' | 'bottom'): string {
  const chars = {
    top: { left: '┌', mid: '┬', right: '┐', horiz: '─' },
    middle: { left: '├', mid: '┼', right: '┤', horiz: '─' },
    bottom: { left: '└', mid: '┴', right: '┘', horiz: '─' },
  };
  const c = chars[type];
  const parts = widths.map(w => c.horiz.repeat(w + 2));
  return c.left + parts.join(c.mid) + c.right;
}

export function cleanOwnerName(owner: string): string {
  return owner
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
