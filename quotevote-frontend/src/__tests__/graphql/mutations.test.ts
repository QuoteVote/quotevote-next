/**
 * GraphQL Mutations Tests
 *
 * Tests that all GraphQL mutation definitions are valid DocumentNode objects
 * with the correct operation types, names, and variables.
 */

import {
  LOGIN_MUTATION,
  SIGNUP_MUTATION,
  SEND_PASSWORD_RESET_EMAIL,
  UPDATE_USER_PASSWORD,
  REQUEST_USER_ACCESS_MUTATION,
  SEND_INVESTOR_EMAIL,
  VOTE,
  ADD_COMMENT,
  SUBMIT_POST,
} from '@/graphql/mutations'

function getOperationDef(doc: { definitions: ReadonlyArray<{ kind: string; operation?: string; name?: { value: string }; variableDefinitions?: ReadonlyArray<{ variable: { name: { value: string } } }> }> }) {
  return doc.definitions.find((d) => d.kind === 'OperationDefinition')
}

function getVarNames(doc: ReturnType<typeof getOperationDef>) {
  return doc?.variableDefinitions?.map((v) => v.variable.name.value) ?? []
}

describe('GraphQL Mutations', () => {
  describe('LOGIN_MUTATION', () => {
    it('is a valid DocumentNode', () => {
      expect(LOGIN_MUTATION).toBeDefined()
      expect(LOGIN_MUTATION.kind).toBe('Document')
    })

    it('is a mutation operation', () => {
      const op = getOperationDef(LOGIN_MUTATION)
      expect(op?.operation).toBe('mutation')
    })

    it('has username and password variables', () => {
      const vars = getVarNames(getOperationDef(LOGIN_MUTATION))
      expect(vars).toContain('username')
      expect(vars).toContain('password')
    })
  })

  describe('SIGNUP_MUTATION', () => {
    it('is a valid DocumentNode', () => {
      expect(SIGNUP_MUTATION).toBeDefined()
      expect(SIGNUP_MUTATION.kind).toBe('Document')
    })

    it('is a mutation operation', () => {
      const op = getOperationDef(SIGNUP_MUTATION)
      expect(op?.operation).toBe('mutation')
    })

    it('has username, email, and password variables', () => {
      const vars = getVarNames(getOperationDef(SIGNUP_MUTATION))
      expect(vars).toContain('username')
      expect(vars).toContain('email')
      expect(vars).toContain('password')
    })
  })

  describe('SEND_PASSWORD_RESET_EMAIL', () => {
    it('is a valid DocumentNode', () => {
      expect(SEND_PASSWORD_RESET_EMAIL).toBeDefined()
      expect(SEND_PASSWORD_RESET_EMAIL.kind).toBe('Document')
    })

    it('has email variable', () => {
      const vars = getVarNames(getOperationDef(SEND_PASSWORD_RESET_EMAIL))
      expect(vars).toContain('email')
    })
  })

  describe('UPDATE_USER_PASSWORD', () => {
    it('is a valid DocumentNode', () => {
      expect(UPDATE_USER_PASSWORD).toBeDefined()
      expect(UPDATE_USER_PASSWORD.kind).toBe('Document')
    })

    it('has username, password, and token variables', () => {
      const vars = getVarNames(getOperationDef(UPDATE_USER_PASSWORD))
      expect(vars).toContain('username')
      expect(vars).toContain('password')
      expect(vars).toContain('token')
    })
  })

  describe('REQUEST_USER_ACCESS_MUTATION', () => {
    it('is a valid DocumentNode', () => {
      expect(REQUEST_USER_ACCESS_MUTATION).toBeDefined()
      expect(REQUEST_USER_ACCESS_MUTATION.kind).toBe('Document')
    })

    it('has requestUserAccessInput variable', () => {
      const vars = getVarNames(getOperationDef(REQUEST_USER_ACCESS_MUTATION))
      expect(vars).toContain('requestUserAccessInput')
    })
  })

  describe('SEND_INVESTOR_EMAIL', () => {
    it('is a valid DocumentNode', () => {
      expect(SEND_INVESTOR_EMAIL).toBeDefined()
      expect(SEND_INVESTOR_EMAIL.kind).toBe('Document')
    })

    it('has email variable', () => {
      const vars = getVarNames(getOperationDef(SEND_INVESTOR_EMAIL))
      expect(vars).toContain('email')
    })
  })

  describe('VOTE', () => {
    it('is a valid DocumentNode', () => {
      expect(VOTE).toBeDefined()
      expect(VOTE.kind).toBe('Document')
    })

    it('has vote variable', () => {
      const vars = getVarNames(getOperationDef(VOTE))
      expect(vars).toContain('vote')
    })
  })

  describe('ADD_COMMENT', () => {
    it('is a valid DocumentNode', () => {
      expect(ADD_COMMENT).toBeDefined()
      expect(ADD_COMMENT.kind).toBe('Document')
    })

    it('has comment variable', () => {
      const vars = getVarNames(getOperationDef(ADD_COMMENT))
      expect(vars).toContain('comment')
    })
  })

  describe('SUBMIT_POST', () => {
    it('is a valid DocumentNode', () => {
      expect(SUBMIT_POST).toBeDefined()
      expect(SUBMIT_POST.kind).toBe('Document')
    })

    it('has post variable', () => {
      const vars = getVarNames(getOperationDef(SUBMIT_POST))
      expect(vars).toContain('post')
    })
  })
})
