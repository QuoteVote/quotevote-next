/**
 * GraphQL Queries Tests
 *
 * Tests that all GraphQL query definitions are valid DocumentNode objects
 * with the correct operation types and names.
 */

import {
  GET_BUDDY_LIST,
  GET_ROSTER,
  GET_ROOM_MESSAGES,
  VERIFY_PASSWORD_RESET_TOKEN,
  GET_USER,
  GET_USER_BIO,
} from '@/graphql/queries'

function getOperationDef(doc: { definitions: ReadonlyArray<{ kind: string; operation?: string; name?: { value: string }; variableDefinitions?: ReadonlyArray<{ variable: { name: { value: string } } }> }> }) {
  return doc.definitions.find((d) => d.kind === 'OperationDefinition')
}

describe('GraphQL Queries', () => {
  describe('GET_BUDDY_LIST', () => {
    it('is a valid DocumentNode', () => {
      expect(GET_BUDDY_LIST).toBeDefined()
      expect(GET_BUDDY_LIST.kind).toBe('Document')
    })

    it('is a query operation', () => {
      const op = getOperationDef(GET_BUDDY_LIST)
      expect(op?.operation).toBe('query')
    })

    it('has GetBuddyList name', () => {
      const op = getOperationDef(GET_BUDDY_LIST)
      expect(op?.name?.value).toBe('GetBuddyList')
    })
  })

  describe('GET_ROSTER', () => {
    it('is a valid DocumentNode', () => {
      expect(GET_ROSTER).toBeDefined()
      expect(GET_ROSTER.kind).toBe('Document')
    })

    it('is a query operation', () => {
      const op = getOperationDef(GET_ROSTER)
      expect(op?.operation).toBe('query')
    })
  })

  describe('GET_ROOM_MESSAGES', () => {
    it('is a valid DocumentNode', () => {
      expect(GET_ROOM_MESSAGES).toBeDefined()
      expect(GET_ROOM_MESSAGES.kind).toBe('Document')
    })

    it('is a query operation', () => {
      const op = getOperationDef(GET_ROOM_MESSAGES)
      expect(op?.operation).toBe('query')
    })

    it('has messageRoomId variable', () => {
      const op = getOperationDef(GET_ROOM_MESSAGES) as {
        variableDefinitions?: { variable: { name: { value: string } } }[]
      }
      const varNames = op?.variableDefinitions?.map((v) => v.variable.name.value) ?? []
      expect(varNames).toContain('messageRoomId')
    })
  })

  describe('VERIFY_PASSWORD_RESET_TOKEN', () => {
    it('is a valid DocumentNode', () => {
      expect(VERIFY_PASSWORD_RESET_TOKEN).toBeDefined()
      expect(VERIFY_PASSWORD_RESET_TOKEN.kind).toBe('Document')
    })

    it('is a query operation', () => {
      const op = getOperationDef(VERIFY_PASSWORD_RESET_TOKEN)
      expect(op?.operation).toBe('query')
    })

    it('has token variable', () => {
      const op = getOperationDef(VERIFY_PASSWORD_RESET_TOKEN) as {
        variableDefinitions?: { variable: { name: { value: string } } }[]
      }
      const varNames = op?.variableDefinitions?.map((v) => v.variable.name.value) ?? []
      expect(varNames).toContain('token')
    })
  })

  describe('GET_USER / GET_USER_BIO', () => {
    function userFieldNames(doc: {
      definitions: ReadonlyArray<{
        kind: string
        selectionSet?: {
          selections: ReadonlyArray<{
            kind: string
            name?: { value: string }
            selectionSet?: { selections: ReadonlyArray<{ name?: { value: string } }> }
          }>
        }
      }>
    }) {
      const op = doc.definitions.find((d) => d.kind === 'OperationDefinition')
      const userField = op?.selectionSet?.selections.find((s) => s.name?.value === 'user')
      return userField?.selectionSet?.selections.map((s) => s.name?.value) ?? []
    }

    it('keeps bio off GET_USER so hosted schemas cannot take down the profile', () => {
      expect(userFieldNames(GET_USER as never)).not.toContain('bio')
    })

    it('loads About text through a separate GET_USER_BIO query', () => {
      const op = getOperationDef(GET_USER_BIO)
      expect(op?.operation).toBe('query')
      expect(userFieldNames(GET_USER_BIO as never)).toContain('bio')
    })
  })
})
