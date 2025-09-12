/**
 * Utility class for robust JSON parsing with multiple recovery strategies
 * Handles various edge cases where LLMs might return invalid or wrapped JSON
 */
export class JsonParserUtility {
  /**
   * Parse JSON content with multiple fallback strategies
   */
  static parseWithRecovery(content: string): any | null {
    // Strategy 1: Direct JSON parsing
    try {
      return JSON.parse(content);
    } catch {
      // Continue to next strategy
    }

    // Strategy 2: Extract from markdown code blocks
    const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch {
        // Continue to next strategy
      }
    }

    // Strategy 3: Find JSON object in mixed content
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Continue to next strategy
      }
    }

    // Strategy 4: Fix common JSON errors and retry
    const fixed = this.fixCommonJsonErrors(content);
    try {
      return JSON.parse(fixed);
    } catch {
      // Continue to next strategy
    }

    // Strategy 5: Parse as array if content starts with [
    if (content.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return { items: parsed };
        }
      } catch {
        // Continue to next strategy
      }
    }

    // Strategy 6: Try to extract and fix array from mixed content
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed)) {
          return { items: parsed };
        }
      } catch {
        // All strategies failed
      }
    }

    return null;
  }

  /**
   * Fix common JSON syntax errors
   */
  private static fixCommonJsonErrors(content: string): string {
    let fixed = content;
    
    // Remove trailing commas
    fixed = fixed.replace(/,\s*}/g, '}');
    fixed = fixed.replace(/,\s*\]/g, ']');
    
    // Fix single quotes to double quotes (but be careful with apostrophes in text)
    // Only replace single quotes that are used as JSON string delimiters
    fixed = fixed.replace(/(\{|,|\[)\s*'([^']*)'(\s*:|\s*,|\s*\]|\s*\})/g, '$1"$2"$3');
    fixed = fixed.replace(/:\s*'([^']*)'/g, ': "$1"');
    
    // Fix unquoted keys (but avoid breaking URLs and other edge cases)
    fixed = fixed.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Remove JavaScript-style comments
    fixed = fixed.replace(/\/\/.*$/gm, '');
    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Fix undefined/null as strings
    fixed = fixed.replace(/:\s*undefined/g, ': null');
    fixed = fixed.replace(/:\s*'undefined'/g, ': null');
    fixed = fixed.replace(/:\s*"undefined"/g, ': null');
    
    return fixed;
  }

  /**
   * Get parsing strategy name for logging
   */
  static getParsingStrategy(content: string): string {
    try {
      JSON.parse(content);
      return 'direct';
    } catch {
      if (content.includes('```')) return 'code-block';
      if (content.match(/\{[\s\S]*\}/) && !content.trim().startsWith('{')) return 'mixed-content';
      if (content.trim().startsWith('[')) return 'array';
      return 'auto-fixed';
    }
  }
}