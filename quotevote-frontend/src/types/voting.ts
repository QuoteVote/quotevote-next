export interface Vote {
  _id?: string;
  userId: string;
  type: 'up' | 'down';
  content?: string;
  startWordIndex: number;
  endWordIndex: number;
  tags?: string[];
  deleted?: boolean;
}

export interface SelectedText {
  text: string;
  startIndex: number;
  endIndex: number;
}

export interface VotingBoardProps {
  content: string;
  onSelect?: (selection: SelectedText) => void;
  highlights?: boolean;
  votes?: Vote[];
  selectedText?: SelectedText;
  topOffset?: number;
  children: (props: SelectedText) => React.ReactNode;
}

export interface SelectionPopoverProps {
  showPopover: boolean;
  topOffset?: number;
  onSelect: (selection: Selection) => void;
  onDeselect: () => void;
  children: React.ReactNode;
}

export interface VotingPopupProps {
  text: string;
  selectedText: SelectedText;
  votedBy: Vote[];
  hasVoted: boolean;
  userVoteType: 'up' | 'down' | null;
  onVote: (obj: { type: 'up' | 'down'; tags: string[] }) => Promise<void>;
  onAddComment: (comment: string, commentWithQuote?: boolean) => Promise<void>;
  onAddQuote: () => Promise<void>;
}
