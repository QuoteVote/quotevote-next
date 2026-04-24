import mongoose from 'mongoose';
import Quote from '~/data/models/Quote';

describe('Quote Model', () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const quote = new Quote();
      const err = quote.validateSync();
      expect(err?.errors.userId).toBeDefined();
      expect(err?.errors.postId).toBeDefined();
      expect(err?.errors.quote).toBeDefined();
    });

    it('should set default values', () => {
      const quote = new Quote({
        userId: new mongoose.Types.ObjectId(),
        postId: new mongoose.Types.ObjectId(),
        quote: 'This is a highlighted quote.',
      });
      expect(quote.created).toBeDefined();
    });

    it('should accept optional fields', () => {
      const quote = new Quote({
        userId: new mongoose.Types.ObjectId(),
        postId: new mongoose.Types.ObjectId(),
        quote: 'Test quote text',
        startWordIndex: 3,
        endWordIndex: 10,
      });
      expect(quote.startWordIndex).toBe(3);
      expect(quote.endWordIndex).toBe(10);
    });
  });

  describe('Static Methods', () => {
    it('findByPostId should query by postId and sort by created ascending', async () => {
      const postId = new mongoose.Types.ObjectId().toHexString();
      const findSpy = jest.spyOn(Quote, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof Quote.find>);

      await Quote.findByPostId(postId);

      expect(findSpy).toHaveBeenCalledWith({ postId });
      findSpy.mockRestore();
    });

    it('findLatest should query all quotes, sort descending, and limit', async () => {
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
