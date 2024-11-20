import { describe, it, expect, beforeEach, afterEach } from 'jest'; // ^29.7.0
import { faker } from '@faker-js/faker'; // ^8.3.1
import { Feedback } from '../../models/Feedback';
import { executeQuery } from '../../utils/database';
import { APIErrorCode } from '../../types/api';

// Human Tasks:
// 1. Configure test database with appropriate permissions
// 2. Set up test data retention policies
// 3. Verify test coverage thresholds in Jest config
// 4. Configure CI pipeline for automated test runs

/**
 * Helper function to generate test feedback data
 * @param overrides - Optional overrides for test data
 */
const generateTestFeedback = (overrides = {}) => {
  const baseData = {
    attemptId: faker.string.uuid(),
    type: faker.helpers.arrayElement(['drill', 'simulation']),
    content: {
      summary: faker.lorem.paragraph(),
      strengths: Array.from({ length: 3 }, () => faker.lorem.sentence()),
      improvements: Array.from({ length: 3 }, () => faker.lorem.sentence()),
      detailedAnalysis: faker.lorem.paragraphs(2)
    },
    score: faker.number.int({ min: 0, max: 100 }),
    metrics: Array.from({ length: 3 }, () => ({
      name: faker.lorem.word(),
      score: faker.number.int({ min: 0, max: 100 }),
      feedback: faker.lorem.sentence(),
      category: faker.lorem.word()
    }))
  };

  return { ...baseData, ...overrides };
};

/**
 * Helper function to clean up test data
 */
const cleanupTestData = async () => {
  await executeQuery(
    'DELETE FROM feedback WHERE attempt_id IN (SELECT id FROM attempts WHERE is_test = true)'
  );
  await executeQuery(
    'DELETE FROM attempts WHERE is_test = true'
  );
};

describe('Feedback Model', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('constructor', () => {
    it('should create new Feedback instance with valid data', () => {
      const testData = generateTestFeedback();
      const feedback = new Feedback(testData);

      expect(feedback.id).toBeDefined();
      expect(feedback.attemptId).toBe(testData.attemptId);
      expect(feedback.type).toBe(testData.type);
      expect(feedback.content).toEqual(testData.content);
      expect(feedback.score).toBe(testData.score);
      expect(feedback.metrics).toEqual(testData.metrics);
      expect(feedback.createdAt).toBeInstanceOf(Date);
      expect(feedback.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw APIError with VALIDATION_ERROR code for invalid data', () => {
      const invalidData = generateTestFeedback({ score: 150 });
      
      expect(() => new Feedback(invalidData)).toThrow();
      expect(() => new Feedback(invalidData)).toThrow(expect.objectContaining({
        code: APIErrorCode.VALIDATION_ERROR
      }));
    });

    it('should set default values correctly for optional fields', () => {
      const testData = generateTestFeedback();
      delete testData.createdAt;
      delete testData.updatedAt;

      const feedback = new Feedback(testData);
      
      expect(feedback.createdAt).toBeInstanceOf(Date);
      expect(feedback.updatedAt).toBeInstanceOf(Date);
    });

    it('should validate content object structure', () => {
      const invalidContent = generateTestFeedback();
      delete invalidContent.content.summary;

      expect(() => new Feedback(invalidContent)).toThrow();
      expect(() => new Feedback(invalidContent)).toThrow(expect.objectContaining({
        code: APIErrorCode.VALIDATION_ERROR
      }));
    });

    it('should validate metrics array format', () => {
      const invalidMetrics = generateTestFeedback();
      invalidMetrics.metrics[0].score = -1;

      expect(() => new Feedback(invalidMetrics)).toThrow();
      expect(() => new Feedback(invalidMetrics)).toThrow(expect.objectContaining({
        code: APIErrorCode.VALIDATION_ERROR
      }));
    });
  });

  describe('save', () => {
    it('should persist valid feedback to database with all fields', async () => {
      const feedback = new Feedback(generateTestFeedback());
      await feedback.save();

      const saved = await Feedback.findById(feedback.id);
      expect(saved).toBeDefined();
      expect(saved?.content).toEqual(feedback.content);
    });

    it('should generate ISO format creation timestamp', async () => {
      const feedback = new Feedback(generateTestFeedback());
      await feedback.save();

      const saved = await Feedback.findById(feedback.id);
      expect(saved?.createdAt.toISOString()).toBe(feedback.createdAt.toISOString());
    });

    it('should throw APIError with VALIDATION_ERROR for invalid data', async () => {
      const feedback = new Feedback(generateTestFeedback());
      feedback.score = -1;

      await expect(feedback.save()).rejects.toThrow(expect.objectContaining({
        code: APIErrorCode.VALIDATION_ERROR
      }));
    });

    it('should update attempt with feedback reference in transaction', async () => {
      const feedback = new Feedback(generateTestFeedback());
      await feedback.save();

      const attemptResult = await executeQuery(
        'SELECT feedback_id FROM attempts WHERE id = $1',
        [feedback.attemptId],
        { singleRow: true }
      );
      expect(attemptResult.feedback_id).toBe(feedback.id);
    });

    it('should handle database errors properly', async () => {
      const feedback = new Feedback(generateTestFeedback());
      await executeQuery('DROP TABLE IF EXISTS temp_feedback');

      await expect(feedback.save()).rejects.toThrow(expect.objectContaining({
        code: APIErrorCode.INTERNAL_ERROR
      }));
    });
  });

  describe('update', () => {
    it('should update existing feedback with valid data', async () => {
      const feedback = new Feedback(generateTestFeedback());
      await feedback.save();

      const updateData = {
        content: {
          summary: 'Updated summary',
          strengths: ['New strength'],
          improvements: ['New improvement'],
          detailedAnalysis: 'Updated analysis'
        }
      };

      await feedback.update(updateData);
      const updated = await Feedback.findById(feedback.id);
      expect(updated?.content).toEqual(updateData.content);
    });

    it('should throw APIError with NOT_FOUND if feedback not found', async () => {
      const feedback = new Feedback(generateTestFeedback());
      await expect(feedback.update({})).rejects.toThrow(expect.objectContaining({
        code: APIErrorCode.NOT_FOUND
      }));
    });

    it('should validate update data structure', async () => {
      const feedback = new Feedback(generateTestFeedback());
      await feedback.save();

      const invalidUpdate = { score: 150 };
      await expect(feedback.update(invalidUpdate)).rejects.toThrow(expect.objectContaining({
        code: APIErrorCode.VALIDATION_ERROR
      }));
    });

    it('should update related metrics in transaction', async () => {
      const feedback = new Feedback(generateTestFeedback());
      await feedback.save();

      const newMetrics = [
        {
          name: 'New Metric',
          score: 85,
          feedback: 'Updated feedback',
          category: 'test'
        }
      ];

      await feedback.update({ metrics: newMetrics });
      const updated = await Feedback.findById(feedback.id);
      expect(updated?.metrics).toEqual(newMetrics);
    });

    it('should handle concurrent updates properly', async () => {
      const feedback = new Feedback(generateTestFeedback());
      await feedback.save();

      const update1 = feedback.update({ score: 90 });
      const update2 = feedback.update({ score: 95 });

      await expect(Promise.all([update1, update2])).resolves.toBeDefined();
    });
  });

  describe('delete', () => {
    it('should remove feedback from database with cleanup', async () => {
      const feedback = new Feedback(generateTestFeedback());
      await feedback.save();

      await feedback.delete();
      const deleted = await Feedback.findById(feedback.id);
      expect(deleted).toBeNull();
    });

    it('should throw APIError with NOT_FOUND if feedback not found', async () => {
      const feedback = new Feedback(generateTestFeedback());
      await expect(feedback.delete()).rejects.toThrow(expect.objectContaining({
        code: APIErrorCode.NOT_FOUND
      }));
    });

    it('should remove feedback reference from attempt in transaction', async () => {
      const feedback = new Feedback(generateTestFeedback());
      await feedback.save();
      await feedback.delete();

      const attemptResult = await executeQuery(
        'SELECT feedback_id FROM attempts WHERE id = $1',
        [feedback.attemptId],
        { singleRow: true }
      );
      expect(attemptResult.feedback_id).toBeNull();
    });

    it('should handle deletion errors properly', async () => {
      const feedback = new Feedback(generateTestFeedback());
      await feedback.save();
      await executeQuery('DROP TABLE IF EXISTS temp_feedback');

      await expect(feedback.delete()).rejects.toThrow(expect.objectContaining({
        code: APIErrorCode.INTERNAL_ERROR
      }));
    });
  });

  describe('findById', () => {
    it('should return feedback by ID with all fields', async () => {
      const feedback = new Feedback(generateTestFeedback());
      await feedback.save();

      const found = await Feedback.findById(feedback.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(feedback.id);
      expect(found?.content).toEqual(feedback.content);
    });

    it('should return null if feedback not found', async () => {
      const result = await Feedback.findById(faker.string.uuid());
      expect(result).toBeNull();
    });

    it('should throw APIError with VALIDATION_ERROR for invalid ID format', async () => {
      await expect(Feedback.findById('invalid-id')).rejects.toThrow(expect.objectContaining({
        code: APIErrorCode.VALIDATION_ERROR
      }));
    });

    it('should handle database query errors', async () => {
      await executeQuery('DROP TABLE IF EXISTS temp_feedback');
      await expect(Feedback.findById(faker.string.uuid())).rejects.toThrow(expect.objectContaining({
        code: APIErrorCode.INTERNAL_ERROR
      }));
    });
  });

  describe('findByAttempt', () => {
    it('should return all feedback for attempt sorted by date', async () => {
      const attemptId = faker.string.uuid();
      const feedback1 = new Feedback(generateTestFeedback({ attemptId }));
      const feedback2 = new Feedback(generateTestFeedback({ attemptId }));
      
      await feedback1.save();
      await feedback2.save();

      const results = await Feedback.findByAttempt(attemptId);
      expect(results).toHaveLength(2);
      expect(new Date(results[0].createdAt) >= new Date(results[1].createdAt)).toBeTruthy();
    });

    it('should return empty array if no feedback found', async () => {
      const results = await Feedback.findByAttempt(faker.string.uuid());
      expect(results).toEqual([]);
    });

    it('should validate attempt ID format', async () => {
      await expect(Feedback.findByAttempt('invalid-id')).rejects.toThrow(expect.objectContaining({
        code: APIErrorCode.VALIDATION_ERROR
      }));
    });

    it('should handle database query errors', async () => {
      await executeQuery('DROP TABLE IF EXISTS temp_feedback');
      await expect(Feedback.findByAttempt(faker.string.uuid())).rejects.toThrow(expect.objectContaining({
        code: APIErrorCode.INTERNAL_ERROR
      }));
    });
  });
});