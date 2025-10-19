import validator from 'validator';

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Escape HTML to prevent XSS
  return validator.escape(input.trim());
}

/**
 * Sanitize HTML content (for rich text fields)
 * Allows only safe HTML tags
 */
export function sanitizeHTML(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  const trimmed = email.trim().toLowerCase();

  if (!validator.isEmail(trimmed)) {
    return null;
  }

  return validator.normalizeEmail(trimmed) || trimmed;
}

/**
 * Validate and sanitize URL
 */
export function sanitizeURL(url: string): string | null {
  if (typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  if (!validator.isURL(trimmed, { protocols: ['http', 'https'], require_protocol: true })) {
    return null;
  }

  return trimmed;
}

/**
 * Validate and sanitize phone number (Nigerian format)
 */
export function sanitizePhone(phone: string): string | null {
  if (typeof phone !== 'string') {
    return null;
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Nigerian phone numbers are 11 digits starting with 0, or 10 digits without leading 0
  // Also accept international format +234
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits;
  }

  if (digits.length === 10) {
    return '0' + digits;
  }

  if (digits.length === 13 && digits.startsWith('234')) {
    return '0' + digits.substring(3);
  }

  return null;
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: any): number | null {
  const num = Number(input);

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  return num;
}

/**
 * Sanitize integer input
 */
export function sanitizeInteger(input: any): number | null {
  const num = sanitizeNumber(input);

  if (num === null) {
    return null;
  }

  return Math.floor(num);
}

/**
 * Sanitize boolean input
 */
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === 'boolean') {
    return input;
  }

  if (typeof input === 'string') {
    const lower = input.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }

  return Boolean(input);
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(input: any): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(item => typeof item === 'string')
    .map(item => sanitizeString(item))
    .filter(item => item.length > 0);
}

/**
 * Validate and sanitize JSON
 */
export function sanitizeJSON(input: string): any | null {
  if (typeof input !== 'string') {
    return null;
  }

  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string | null {
  if (typeof filename !== 'string') {
    return null;
  }

  // Remove path separators and null bytes
  const safe = filename
    .replace(/[/\\]/g, '')
    .replace(/\0/g, '')
    .replace(/\.\./g, '')
    .trim();

  if (safe.length === 0 || safe.startsWith('.')) {
    return null;
  }

  return safe;
}

/**
 * Sanitize object by applying sanitization to all string values
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value) as any;
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeStringArray(value) as any;
    } else if (value && typeof value === 'object') {
      sanitized[key as keyof T] = sanitizeObject(value) as any;
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
}

/**
 * Validate length constraints
 */
export function validateLength(
  input: string,
  options: { min?: number; max?: number }
): boolean {
  const length = input.length;

  if (options.min !== undefined && length < options.min) {
    return false;
  }

  if (options.max !== undefined && length > options.max) {
    return false;
  }

  return true;
}

/**
 * Validate that input matches a pattern
 */
export function validatePattern(input: string, pattern: RegExp): boolean {
  return pattern.test(input);
}

/**
 * Check if string contains only alphanumeric characters
 */
export function isAlphanumeric(input: string): boolean {
  return validator.isAlphanumeric(input);
}

/**
 * Check if string is a valid UUID
 */
export function isUUID(input: string): boolean {
  return validator.isUUID(input);
}

/**
 * Check if string is a valid date
 */
export function isValidDate(input: string): boolean {
  return validator.isISO8601(input);
}
