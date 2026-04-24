import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Quote from '~/data/models/Quote';

describe('Quote Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Quote();
      const errors = getValidationErrors(doc);
      expect(errors?.userId).toBeDefined();
      expect(errors?.postId).toBeDefined();
      expect(errors?.quote).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Quote({
        userId: createObjectId(),
        postId: createObjectId(),
        quote: 'A highlighted quote',
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default created date', () => {
      const doc = new Quote({
        userId: createObjectId(),
        postId: createObjectId(),
        quote: 'Test',
      });
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should accept optional fields', () => {
      const doc = new Quote({
        userId: createObjectId(),
        postId: createObjectId(),
        quote: 'Test',
        startWordIndex: 3,
        endWordIndex: 10,
      });
      expect(doc.startWordIndex).toBe(3);
      expect(doc.endWordIndex).toBe(10);
    });
  });

  describe('Static Methods', () => {
    it('findByPostId should query by postId', async () => {
      const postId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Quote, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof Quote.find>);

      await Quote.findByPostId(postId);

      expect(findSpy).toHaveBeenCalledWith({ postId });
      findSpy.mockRestore();
    });

    it('findLatest should sort descending and limit', async () => {
      const limitMock = jest.fn().mockResolvedValue([]);
      const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
      const findSpy = jest.spyOn(Quote, 'find').mockReturnValue({
        sort: sortMock,
      } as unknown as ReturnType<typeof Quote.find>);

      await Quote.findLatest(5);

      expect(findSpy).toHaveBeenCalledWith({});
      expect(sortMock).toHaveBeenCalledWith({ created: -1 });
      expect(limitMock).toHaveBeenCalledWith(5);
      findSpy.mockRestore();
    });
  });
});
