export interface ContentItem {
  id: string;
  title: string;
  content: string; // maps to 'text' from old component
  upvotes: number;
  downvotes: number;
  url: string;
  createdAt?: string;
  author?: string;
}

export interface ContentListProps {
  data?: ContentItem[];
  isLoading?: boolean;
  error?: string | null;
}

export interface ContentCardProps {
  item: ContentItem;
}
