export interface ParsedAttendanceResult {
  names: string[];
  inferredTitle: string;
  inferredDate?: string; // YYYY-MM-DD
  inferredTime?: string;
}

const MONTH_MAP: Record<string, number> = {
  JAN: 0, JANU: 0, JANUARY: 0,
  FEB: 1, FEBR: 1, FEBRUARY: 1,
  MAR: 2, MARC: 2, MARCH: 2,
  APR: 3, APRI: 3, APRIL: 3,
  MAY: 4,
  JUN: 5, JUNE: 5,
  JUL: 6, JULY: 6,
  AUG: 7, AUGU: 7, AUGUST: 7,
  SEP: 8, SEPT: 8, SEPTEMBER: 8,
  OCT: 9, OCTO: 9, OCTOBER: 9,
  NOV: 10, NOVE: 10, NOVEMBER: 10,
  DEC: 11, DECE: 11, DECEMBER: 11,
};

// Ignore lines that are strictly system headers, labels, or section titles
const IGNORE_HEADER_WORDS = [
  'ATTENDANCE',
  'ROLL CALL',
  'SQUAD MEET',
  'PRESENT',
  'ABSENT',
  'INACTIVE',
  'ACTIVE',
  'NAMES',
  'DATE',
  'TIME',
  'HOST',
  'CO-HOST',
  'TOTAL',
  'MEMBERS',
  'REPORT'
];

/**
 * Strips away numbers, bullet characters, bracket notes, and messy formatting
 * to produce a clean, standardized in-game gamer tag (IGN).
 */
export function cleanMemberName(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();

  // Strip leading numbering or bullet markers, e.g. "1.", "01)", "14_", "3 -", "[2]", "(5)", "• ", "* ", "#1 "
  cleaned = cleaned.replace(/^\s*(?:\[?\d+[\.\)\s_\-]+|\(\d+\)\s*|\[\d+\]\s*|#\d+\s*|[\-\*•>\+]\s*)+/gi, '');

  // Strip trailing notes in parentheses or brackets, e.g. "(host)", "[VIP]", "(Leader)", "(late)", "- present"
  cleaned = cleaned.replace(/\s*(?:\([^)]*\)|\[[^\]]*\]|\{[^}]*\})/gi, '');
  cleaned = cleaned.replace(/\s*-\s*(?:present|active|host|admin|co-host|late|excused|afk).*$/gi, '');

  // Remove surrounding quotes or stray backticks
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '');

  // Collapse multiple whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Standardize uppercase for community gamer tags
  return cleaned.toUpperCase();
}

/**
 * Sort an array of strings or member names alphabetically (A to Z)
 */
export function sortNamesAlphabetically(names: string[]): string[] {
  return [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function parseAttendanceDetailed(text: string): ParsedAttendanceResult {
  const lines = text.split('\n');
  const rawNames: string[] = [];
  let inferredTitle = '';
  let inferredDate: string | undefined = undefined;
  let inferredTime: string | undefined = undefined;

  // Matches a line starting with one or more digits, followed by delimiter (. _ - or space) or bullet
  const numberedNameRegex = /^\s*(?:\d+[\.\s_\-\)]+|\[\d+\]|\(\d+\)|[\-\*•])\s*(.+)$/;
  const timeRegex = /\b(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)\s*-\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))\b/i;
  const dateRegex = /\b(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEPT?|OCT|NOV|DEC)[A-Z]*\.?\s*(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(\d{4}))?\b/i;
  const isoDateRegex = /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for title in header lines
    if (!inferredTitle && (trimmed.toUpperCase().includes('ATTENDANCE') || trimmed.toUpperCase().includes('MEET') || trimmed.toUpperCase().includes('ROLL CALL'))) {
      inferredTitle = trimmed.replace(/^[\s\*\-_=#]+|[\s\*\-_=#]+$/g, '');
    }

    // Check for time
    if (!inferredTime) {
      const timeMatch = trimmed.match(timeRegex);
      if (timeMatch) {
        inferredTime = timeMatch[1].toUpperCase();
      }
    }

    // Check for date in text e.g. "AUG. 26", "August 25, 2026" or "2026-08-25"
    if (!inferredDate) {
      const isoMatch = trimmed.match(isoDateRegex);
      if (isoMatch) {
        const year = isoMatch[1];
        const month = String(isoMatch[2]).padStart(2, '0');
        const day = String(isoMatch[3]).padStart(2, '0');
        inferredDate = `${year}-${month}-${day}`;
      } else {
        const dateMatch = trimmed.match(dateRegex);
        if (dateMatch) {
          const monthStr = dateMatch[1].toUpperCase().slice(0, 3);
          const monthIdx = MONTH_MAP[monthStr];
          const day = parseInt(dateMatch[2], 10);
          const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : new Date().getFullYear();
          if (monthIdx !== undefined && !isNaN(day)) {
            const padM = String(monthIdx + 1).padStart(2, '0');
            const padD = String(day).padStart(2, '0');
            inferredDate = `${year}-${padM}-${padD}`;
          }
        }
      }
    }

    // Check if line contains a numbered name
    const match = trimmed.match(numberedNameRegex);
    if (match) {
      const candidate = cleanMemberName(match[1]);
      if (candidate.length >= 2 && !IGNORE_HEADER_WORDS.includes(candidate)) {
        if (!rawNames.includes(candidate)) {
          rawNames.push(candidate);
        }
      }
    } else {
      // If line is not a header, not a time, and not a date, check if it's a raw un-numbered name
      const upper = trimmed.toUpperCase();
      const isHeader = IGNORE_HEADER_WORDS.some(hw => upper === hw || upper.startsWith(hw + ':') || upper.startsWith(hw + ' -'));
      const isTimeOrDate = timeRegex.test(trimmed) || isoDateRegex.test(trimmed) || dateRegex.test(trimmed);

      if (!isHeader && !isTimeOrDate && trimmed.length >= 2 && trimmed.length <= 40) {
        const candidate = cleanMemberName(trimmed);
        if (candidate.length >= 2 && !IGNORE_HEADER_WORDS.includes(candidate)) {
          if (!rawNames.includes(candidate)) {
            rawNames.push(candidate);
          }
        }
      }
    }
  }

  // Automatically organize names alphabetically from A to Z!
  const sortedNames = sortNamesAlphabetically(rawNames);

  return {
    names: sortedNames,
    inferredTitle: inferredTitle || (inferredDate ? `Attendance ${inferredDate}` : `Attendance ${new Date().toISOString().split('T')[0]}`),
    inferredDate,
    inferredTime
  };
}

export function parseAttendance(text: string): string[] {
  return parseAttendanceDetailed(text).names;
}
