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
 * Format date as iCalendar datetime string (YYYYMMDDTHHMMSSZ)
 */
function formatICSDateTime(date) {
  return formatICSDate(date) + 'T' +
    String(date.getHours()).padStart(2, '0') +
    String(date.getMinutes()).padStart(2, '0') +
    String(date.getSeconds()).padStart(2, '0') + 'Z';
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

  return calendar;
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

  URL.revokeObjectURL(url);
}

/**
 * Export and download roadmap calendar with date picker prompt
 * @param {Object} roadmap - Generated roadmap
 */
export function exportAndDownloadCalendar(roadmap) {
  // Prompt user for start date
  const dateStr = prompt(
    'Enter your learning start date (YYYY-MM-DD):',
    new Date().toISOString().split('T')[0]
  );

  if (!dateStr) return; // User cancelled

  const startDate = new Date(dateStr);
  if (isNaN(startDate.getTime())) {
    alert('Invalid date format. Please use YYYY-MM-DD.');
    return;
  }

  const icsContent = exportRoadmapCalendar(roadmap, startDate);
  const filename = `dlai-${roadmap.pathway}-pathway.ics`;
  downloadCalendar(icsContent, filename);
}
