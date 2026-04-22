export const Quote: string = `#graphql
  type Quote {
    _id: String
    created: Date
    postId: Int
    quote: String
    quoted: String
    quoter: String
    startWordIndex: Int
    endWordIndex: Int
    deleted: Boolean
    user: User
  }
`;
