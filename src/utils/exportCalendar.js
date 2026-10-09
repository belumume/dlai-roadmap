/**
 * Export roadmap to iCalendar (.ics) format
 * RFC 5545 compliant - no external dependencies
 */

/**
 * Format date as iCalendar date string (YYYYMMDD)
 */
function formatICSDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Format date as iCalendar UTC datetime string (YYYYMMDDTHHMMSSZ)
 */
function formatICSDateTime(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Fold a content line to at most 75 octets per line (RFC 5545 section 3.1)
 */
function foldLine(line) {
  const encoder = new TextEncoder();
  const parts = [];
  let current = '';
  let currentBytes = 0;
  for (const char of line) {
    const charBytes = encoder.encode(char).length;
    // Continuation lines start with a space, which counts toward the limit
    const limit = parts.length === 0 ? 75 : 74;
    if (currentBytes + charBytes > limit) {
      parts.push(current);
      current = '';
      currentBytes = 0;
    }
    current += char;
    currentBytes += charBytes;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

/**
 * Generate a unique identifier for calendar events
 */
function generateUID(prefix, index) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${index}-${timestamp}-${random}@dlai-roadmap`;
}

/**
 * Escape special characters for iCalendar text fields
 */
function escapeICS(text) {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Add days to a date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add weeks to a date
 */
function addWeeks(date, weeks) {
  return addDays(date, weeks * 7);
}

/**
 * Build VEVENT block for a course
 */
function buildCourseEvent(course, startDate, index, phaseName) {
  const courseStart = addWeeks(startDate, course.startWeek);
  const courseEnd = addWeeks(startDate, course.endWeek);

  const description = [
    course.description || '',
    '',
    `Duration: ${course.estimatedWeeks} week${course.estimatedWeeks === 1 ? '' : 's'}`,
    `Difficulty: ${course.difficulty || 'intermediate'}`,
    course.url ? `Link: ${course.url}` : '',
    '',
    `Phase: ${phaseName}`,
  ].filter(Boolean).join('\n');

  return [
    'BEGIN:VEVENT',
    `UID:${generateUID('course', index)}`,
    `DTSTAMP:${formatICSDateTime(new Date())}`,
    `DTSTART;VALUE=DATE:${formatICSDate(courseStart)}`,
    `DTEND;VALUE=DATE:${formatICSDate(courseEnd)}`,
    `SUMMARY:${escapeICS(course.title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    `CATEGORIES:DLAI Course,${escapeICS(phaseName)}`,
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  ].join('\r\n');
}

/**
 * Build VEVENT block for a milestone
 */
function buildMilestoneEvent(milestone, startDate, index) {
  const milestoneDate = addWeeks(startDate, milestone.week);
  const nextDay = addDays(milestoneDate, 1);

  return [
    'BEGIN:VEVENT',
    `UID:${generateUID('milestone', index)}`,
    `DTSTAMP:${formatICSDateTime(new Date())}`,
    `DTSTART;VALUE=DATE:${formatICSDate(milestoneDate)}`,
    `DTEND;VALUE=DATE:${formatICSDate(nextDay)}`,
    `SUMMARY:🎯 ${escapeICS(milestone.label)} (${milestone.percent}%)`,
    `DESCRIPTION:Learning journey milestone - ${milestone.percent}% complete`,
    'CATEGORIES:DLAI Milestone',
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  ].join('\r\n');
}

/**
 * Build VEVENT block for a phase completion
 */
function buildPhaseEvent(phase, startDate, index) {
  const phaseEndDate = addWeeks(startDate, phase.endWeek);
  const nextDay = addDays(phaseEndDate, 1);

  return [
    'BEGIN:VEVENT',
    `UID:${generateUID('phase', index)}`,
    `DTSTAMP:${formatICSDateTime(new Date())}`,
    `DTSTART;VALUE=DATE:${formatICSDate(phaseEndDate)}`,
    `DTEND;VALUE=DATE:${formatICSDate(nextDay)}`,
    `SUMMARY:✅ ${escapeICS(phase.phaseName)} Complete`,
    `DESCRIPTION:${escapeICS(phase.milestone || 'Phase completed')}`,
    'CATEGORIES:DLAI Phase',
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  ].join('\r\n');
}

/**
 * Export roadmap to iCalendar format and trigger download
 * @param {Object} roadmap - Generated roadmap from pathwayGenerator
 * @param {Date} startDate - Start date for the learning journey (default: today)
 * @returns {string} - ICS file content
 */
export function exportRoadmapCalendar(roadmap, startDate = new Date()) {
  const events = [];
  let courseIndex = 0;

  // Add course events for each phase
  roadmap.phases.forEach((phase, phaseIndex) => {
    phase.courses.forEach(course => {
      events.push(buildCourseEvent(course, startDate, courseIndex++, phase.phaseName));
    });

    // Add phase completion event
    events.push(buildPhaseEvent(phase, startDate, phaseIndex));
  });

  // Add milestone events
  roadmap.milestones.forEach((milestone, index) => {
    events.push(buildMilestoneEvent(milestone, startDate, index));
  });

  // Build complete calendar
  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DLAI Roadmap//Learning Pathway//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:DLAI ${roadmap.pathwayName} Pathway`,
    'X-WR-TIMEZONE:UTC',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  return calendar.split('\r\n').map(foldLine).join('\r\n') + '\r\n';
}

/**
 * Format date as YYYY-MM-DD in local time
 */
function formatISODate(date) {
  const ymd = formatICSDate(date);
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

/**
 * Parse YYYY-MM-DD as a local calendar date. new Date('YYYY-MM-DD') would
 * parse it as UTC midnight, which is the previous day west of UTC.
 * @returns {Date|null}
 */
export function parseLocalDate(dateStr) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/**
 * Trigger download of the calendar file
 * @param {string} icsContent - Calendar content
 * @param {string} filename - Download filename
 */
export function downloadCalendar(icsContent, filename = 'dlai-roadmap.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke after the click has been handled so the download is not cancelled
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Export and download roadmap calendar with date picker prompt
 * @param {Object} roadmap - Generated roadmap
 * @returns {boolean} - true when a file was downloaded
 */
export function exportAndDownloadCalendar(roadmap) {
  // Prompt user for start date, defaulting to today in their own time zone
  const dateStr = prompt(
    'Enter your learning start date (YYYY-MM-DD):',
    formatISODate(new Date())
  );

  if (!dateStr) return false; // User cancelled

  const startDate = parseLocalDate(dateStr.trim());
  if (!startDate) {
    alert('Invalid date format. Please use YYYY-MM-DD.');
    return false;
  }

  const icsContent = exportRoadmapCalendar(roadmap, startDate);
  const filename = `dlai-${roadmap.pathway}-pathway.ics`;
  downloadCalendar(icsContent, filename);
  return true;
}
