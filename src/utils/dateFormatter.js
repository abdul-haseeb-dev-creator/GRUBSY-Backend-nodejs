// src/utils/dateFormatter.js
// Utility functions for formatting dates to ISO 8601 format

/**
 * Normalize a date string to ISO 8601 format
 * Handles various date formats including time-only strings
 * @param {string|null|undefined} dateString - Date string in various formats
 * @param {Date} fallbackDate - Fallback date if dateString is invalid (defaults to current date)
 * @returns {string|null} - ISO 8601 date string or null
 */
export function formatToISO(dateString, fallbackDate = new Date()) {
  if (!dateString) {
    return null;
  }

  // If it's already a valid ISO date string, return it
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    try {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (e) {
      // Continue to try other formats
    }
  }

  // Handle time-only format (e.g., "08:33", "09:02")
  const timeOnlyRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
  const timeMatch = dateString.match(timeOnlyRegex);
  
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
    
    // Use fallback date (or current date) and set the time
    const date = new Date(fallbackDate);
    date.setHours(hours, minutes, seconds, 0);
    return date.toISOString();
  }

  // Handle date + time format (e.g., "2026-01-15 08:33")
  const dateTimeRegex = /^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
  const dateTimeMatch = dateString.match(dateTimeRegex);
  
  if (dateTimeMatch) {
    const datePart = dateTimeMatch[1];
    const hours = parseInt(dateTimeMatch[2], 10);
    const minutes = parseInt(dateTimeMatch[3], 10);
    const seconds = dateTimeMatch[4] ? parseInt(dateTimeMatch[4], 10) : 0;
    
    const date = new Date(`${datePart}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  // Try to parse as Date object
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch (e) {
    // Invalid date format
  }

  // If all parsing fails, return null or use fallback
  console.warn(`⚠️ Could not parse date string: "${dateString}", using fallback date`);
  return fallbackDate.toISOString();
}

/**
 * Format DateTime field from Prisma to ISO string
 * @param {DateTime|string|null|undefined} dateTime - Prisma DateTime or string
 * @returns {string|null} - ISO 8601 date string or null
 */
export function formatDateTimeToISO(dateTime) {
  if (!dateTime) {
    return null;
  }

  // If it's already a Date object (from Prisma DateTime)
  if (dateTime instanceof Date) {
    return dateTime.toISOString();
  }

  // If it's a string, use formatToISO
  if (typeof dateTime === 'string') {
    return formatToISO(dateTime);
  }

  return null;
}

/**
 * Format multiple date fields in an object to ISO format
 * @param {Object} obj - Object containing date fields
 * @param {string[]} dateFields - Array of field names to format
 * @returns {Object} - Object with formatted date fields
 */
export function formatDatesInObject(obj, dateFields = ['createdAt', 'updatedAt', 'deliveredAt', 'acceptedAt', 'readyAt', 'pickedUpAt', 'cancelledAt']) {
  const formatted = { ...obj };
  
  for (const field of dateFields) {
    if (field in formatted) {
      formatted[field] = formatDateTimeToISO(formatted[field]);
    }
  }
  
  return formatted;
}
