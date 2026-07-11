import { CardPaymentMethodInput } from './CardPaymentMethodInput';
import { CommentInput } from './CommentInput';
import { GroupInput } from './GroupInput';
import { MessageInput } from './MessageInput';
import { PostInput } from './PostInput';
import { PresenceInput } from './PresenceInput';
import { QuoteInput } from './QuoteInput';
import { ReactionInput } from './ReactionInput';
import { ReportUserInput, SendUserInviteInput } from './ReportUserInput';
import { RequestUserAccessInput } from './RequestUserAccessInput';
import { StripeCustomerInput } from './StripeCustomerInput';
import { UserInput } from './UserInput';
import { VoteInput } from './VoteInput';

export * from './CardPaymentMethodInput';
export * from './CommentInput';
export * from './GroupInput';
export * from './MessageInput';
export * from './PostInput';
export * from './PresenceInput';
export * from './QuoteInput';
export * from './ReactionInput';
export * from './ReportUserInput';
export * from './RequestUserAccessInput';
export * from './StripeCustomerInput';
export * from './UserInput';
export * from './VoteInput';

export const domainInputTypes = [
  CardPaymentMethodInput,
  CommentInput,
  GroupInput,
  MessageInput,
  PostInput,
  PresenceInput,
  QuoteInput,
  ReactionInput,
  ReportUserInput,
  SendUserInviteInput,
  RequestUserAccessInput,
  StripeCustomerInput,
  UserInput,
  VoteInput,
];
