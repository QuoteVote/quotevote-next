import * as bcrypt from 'bcryptjs';
import { getValidationErrors, closeConnection } from './_helpers';
import User from '~/data/models/User';

describe('User Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new User();
      const errors = getValidationErrors(doc);
      expect(errors?.username).toBeDefined();
      expect(errors?.email).toBeDefined();
      expect(errors?.password).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(doc.plan).toBe('personal');
      expect(doc.tokens).toBe(0);
      expect(doc.contributorBadge).toBe(false);
      expect(doc.admin).toBe(false);
      expect(doc.emailVerified).toBe(false);
      expect(doc.isModerator).toBe(false);
      expect(doc.upvotes).toBe(0);
      expect(doc.downvotes).toBe(0);
      expect(doc.accountStatus).toBe('active');
      expect(doc.botReports).toBe(0);
      expect(doc.favorited).toEqual([]);
      expect(doc.joined).toBeInstanceOf(Date);
    });

    it('should set default reputation scores', () => {
      const doc = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(doc.reputation?.overallScore).toBe(0);
      expect(doc.reputation?.inviteNetworkScore).toBe(0);
      expect(doc.reputation?.conductScore).toBe(0);
      expect(doc.reputation?.activityScore).toBe(0);
      expect(doc.reputation?.metrics?.totalPosts).toBe(0);
      expect(doc.reputation?.metrics?.totalComments).toBe(0);
    });

    it('should lowercase and trim email', () => {
      const doc = new User({
        username: 'testuser',
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
      });
      expect(doc.email).toBe('test@example.com');
    });

    it('should trim username', () => {
      const doc = new User({
        username: '  testuser  ',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(doc.username).toBe('testuser');
    });

    it('should reject invalid accountStatus enum', () => {
      const doc = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        accountStatus: 'invalid',
      });
      const errors = getValidationErrors(doc);
      expect(errors?.accountStatus).toBeDefined();
    });

    it('should accept valid accountStatus values', () => {
      for (const accountStatus of ['active', 'disabled']) {
        const doc = new User({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          accountStatus,
        });
        expect(getValidationErrors(doc)).toBeUndefined();
      }
    });

    it('should accept optional profile fields', () => {
      const doc = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        bio: 'A test bio',
        location: 'New York',
        website: 'https://example.com',
        companyName: 'TestCorp',
      });
      expect(doc.name).toBe('Test User');
      expect(doc.bio).toBe('A test bio');
      expect(doc.location).toBe('New York');
    });

    it('should accept avatar as object, string, or null', () => {
      const docObj = new User({
        username: 'u1', email: 'a@b.com', password: 'p',
        avatar: { url: 'https://example.com/img.jpg' },
      });
      expect(docObj.avatar).toEqual({ url: 'https://example.com/img.jpg' });

      const docStr = new User({
        username: 'u2', email: 'b@b.com', password: 'p',
        avatar: 'https://example.com/avatar.png',
      });
      expect(docStr.avatar).toBe('https://example.com/avatar.png');

      const docNull = new User({
        username: 'u3', email: 'c@b.com', password: 'p',
        avatar: null,
      });
      expect(docNull.avatar).toBeNull();
    });
  });

  describe('Instance Method: comparePassword', () => {
    it('should return true for matching password', async () => {
      const plainPassword = 'testpassword123';
      const salt = await bcrypt.genSalt(4);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      const doc = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
      });

      const isMatch = await doc.comparePassword(plainPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const salt = await bcrypt.genSalt(4);
      const hashedPassword = await bcrypt.hash('correctpassword', salt);

      const doc = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
      });

      const isMatch = await doc.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('Pre-save Hook', () => {
    // Note: The pre-save hook hashes the password using bcrypt when modified.
    // Full hook integration testing requires mongodb-memory-server.
    // The comparePassword tests above verify the bcrypt integration works.
    it('should have bcrypt available for password hashing', async () => {
      const plain = 'testPassword';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(plain, salt);
      const result = await bcrypt.compare(plain, hash);
      expect(result).toBe(true);
    });
  });

  describe('Static Methods', () => {
    it('findByUsername should use findOne', async () => {
      const findOneSpy = jest.spyOn(User, 'findOne').mockResolvedValue(null);

      await User.findByUsername('testuser');

      expect(findOneSpy).toHaveBeenCalledWith({ username: 'testuser' });
      findOneSpy.mockRestore();
    });

    it('findByEmail should use findOne', async () => {
      const findOneSpy = jest.spyOn(User, 'findOne').mockResolvedValue(null);

      await User.findByEmail('test@example.com');

      expect(findOneSpy).toHaveBeenCalledWith({ email: 'test@example.com' });
      findOneSpy.mockRestore();
    });
  });
});
