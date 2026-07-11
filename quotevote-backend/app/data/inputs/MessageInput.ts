import { GraphQLInputObjectType, GraphQLString, GraphQLNonNull } from 'graphql';

export const MessageInput = new GraphQLInputObjectType({
  name: 'MessageInput',
  fields: {
    messageRoomId: { type: GraphQLString, description: 'Message Room ID' },
    componentId: { type: GraphQLString, description: 'Either user._id or post._id' },
    title: { type: new GraphQLNonNull(GraphQLString), description: 'Title of the chat message' },
    text: { type: new GraphQLNonNull(GraphQLString), description: 'Content of the chat message' },
    type: { type: GraphQLString, description: 'Type of the message USER or POST' },
  },
});
