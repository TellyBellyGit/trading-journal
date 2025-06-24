/**
 * JSON Content Sanitization Utilities
 * Handles Unicode surrogate pairs and other JSON-breaking characters
 */

export const sanitizeForJSON = (content: string): string => {
  if (!content || typeof content !== 'string') {
    return content;
  }

  try {
    // Remove unpaired Unicode surrogates that break JSON parsing
    let sanitized = content
      // Remove orphaned high surrogates (0xD800-0xDBFF without low surrogates)
      .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
      // Remove orphaned low surrogates (0xDC00-0xDFFF without high surrogates)
      .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
      // Remove null bytes and other control characters that can break JSON
      .replace(/\u0000/g, '')
      .replace(/[\u0001-\u0008\u000B-\u000C\u000E-\u001F]/g, '');

    // Test if the sanitized content can be safely JSON stringified
    JSON.stringify(sanitized);
    
    return sanitized;
  } catch (error) {
    console.warn('Content sanitization failed, using fallback:', error);
    
    // Fallback: remove all potentially problematic characters
    return content
      .replace(/[\uD800-\uDFFF]/g, '') // Remove all surrogates
      .replace(/[^\x00-\x7F]/g, (char) => { // Convert non-ASCII to Unicode escape
        const code = char.charCodeAt(0);
        return code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : char;
      })
      .replace(/\u0000/g, ''); // Remove null bytes
  }
};

export const sanitizeJsonPayload = (payload: any): any => {
  if (typeof payload === 'string') {
    return sanitizeForJSON(payload);
  }
  
  if (Array.isArray(payload)) {
    return payload.map(sanitizeJsonPayload);
  }
  
  if (payload && typeof payload === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(payload)) {
      sanitized[key] = sanitizeJsonPayload(value);
    }
    return sanitized;
  }
  
  return payload;
};

export const safeJsonStringify = (data: any): string => {
  try {
    const sanitized = sanitizeJsonPayload(data);
    return JSON.stringify(sanitized);
  } catch (error) {
    console.error('Failed to stringify JSON data:', error);
    throw new Error('Unable to serialize data to JSON');
  }
};

export const validateJsonContent = (content: string): boolean => {
  try {
    JSON.stringify(content);
    return true;
  } catch {
    return false;
  }
};