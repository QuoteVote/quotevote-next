export interface CommentUser {
  _id?: string;
  username: string;
  avatar: {
    // avatar props might be complex based on the legacy AvatarDisplay usage
    // but initially treating it as an object that AvatarDisplay accepts
    [key: string]: unknown;
  } | string; 
  name?: string;
}

export interface CommentData {
  _id: string;
  userId: string;
  content: string;
  created: string | Date;
  user: CommentUser;
  [key: string]: unknown;
}

export interface Reaction {
  _id: string;
  userId: string;
  actionId: string;
  emoji: string;
}

export interface ReactionInput {
  userId: string;
  actionId: string;
  emoji: string;
}
