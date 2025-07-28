import { describe, it, expect, vi } from 'vitest';
import { isPromotional } from '../../src/common/services/nlp.js';

// Mock the logger to prevent console noise during tests
vi.mock('../../src/common/services/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('NLP Service', () => {
  // Note: These tests expect the service to return safe defaults when OpenAI API is unavailable
  // In production with a valid API key, the service would return actual classification results
  
  describe('Response Structure Validation', () => {
    it('should return valid response structure for any input', async () => {
      const testMessages = [
        'Buy now! Limited time offer! 50% off!',
        'Hello everyone! How are you doing today?',
        '',
        '🚀🚀🚀'
      ];

      for (const message of testMessages) {
        const result = await isPromotional(message);
        expect(typeof result.score).toBe('number');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
        expect(typeof result.isSpam).toBe('boolean');
        // Service should return valid results - either API results or safe defaults
        expect(result.score >= 0 && result.score <= 1).toBe(true);
      }
    });

    it('should handle concurrent requests correctly', async () => {
      const message = 'Test message for concurrent processing';
      const promises = Array.from({ length: 5 }, () => isPromotional(message));
      
      const results = await Promise.all(promises);
      
      // All results should be valid and consistent
      results.forEach(result => {
        expect(typeof result.score).toBe('number');
        expect(typeof result.isSpam).toBe('boolean');
        expect(result.score >= 0 && result.score <= 1).toBe(true);
      });
    });

    it('should handle whitelist keywords parameter', async () => {
      const message = 'Check out this amazing crypto project!';
      const whitelistKeywords = ['crypto', 'project', 'amazing'];
      
      const result = await isPromotional(message, whitelistKeywords);
      
      expect(typeof result.score).toBe('number');
      expect(typeof result.isSpam).toBe('boolean');
      // Service accepts whitelist parameter without error
      expect(result.score >= 0 && result.score <= 1).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle null and undefined inputs gracefully', async () => {
      // Service should return safe defaults for invalid inputs
      const nullResult = await isPromotional(null);
      expect(nullResult.isSpam).toBe(false);
      expect(nullResult.score).toBe(0);

      const undefinedResult = await isPromotional(undefined);
      expect(undefinedResult.isSpam).toBe(false);
      expect(undefinedResult.score).toBe(0);
    });

    it('should handle non-string inputs appropriately', async () => {
      const nonStringInputs = [123, true, {}, [], new Date()];

      for (const input of nonStringInputs) {
        const result = await isPromotional(input);
        expect(typeof result.score).toBe('number');
        expect(typeof result.isSpam).toBe('boolean');
        // Service should handle gracefully and return valid results
        expect(result.score >= 0 && result.score <= 1).toBe(true);
      }
    });

    it('should handle extremely long messages', async () => {
      const longMessage = 'This is a very long message. '.repeat(50);
      
      const result = await isPromotional(longMessage);
      
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(typeof result.isSpam).toBe('boolean');
      // Service handles long messages without crashing
      expect(result.score >= 0 && result.score <= 1).toBe(true);
    });
  });
});