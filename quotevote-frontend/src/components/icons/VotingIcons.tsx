// src/components/icons/VotingIcons.tsx

export function LikeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 30"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7.5 13.5h-3c-0.825 0-1.5 0.675-1.5 1.5v10.5c0 0.825 0.675 1.5 1.5 1.5h3c0.825 0 1.5-0.675 1.5-1.5v-10.5c0-0.825-0.675-1.5-1.5-1.5zM22.5 13.5h-6v-6c0-1.65-1.35-3-3-3s-3 1.35-3 3v9l-1.5 7.5h12c0.825 0 1.5-0.675 1.5-1.5v-7.5c0-0.825-0.675-1.5-1.5-1.5z" />
    </svg>
  );
}

export function DislikeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 30"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M22.5 3h-3c-0.825 0-1.5 0.675-1.5 1.5v10.5c0 0.825 0.675 1.5 1.5 1.5h3c0.825 0 1.5-0.675 1.5-1.5v-10.5c0-0.825-0.675-1.5-1.5-1.5zM7.5 3h-1.5c-0.825 0-1.5 0.675-1.5 1.5v7.5c0 0.825 0.675 1.5 1.5 1.5h6v6c0 1.65 1.35 3 3 3s3-1.35 3-3v-9l1.5-7.5h-12z" />
    </svg>
  );
}

export function CommentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 30 30"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M25.5 3h-21c-0.825 0-1.5 0.675-1.5 1.5v15c0 0.825 0.675 1.5 1.5 1.5h3v4.5l6-4.5h12c0.825 0 1.5-0.675 1.5-1.5v-15c0-0.825-0.675-1.5-1.5-1.5zM7.5 12h15v1.5h-15v-1.5zM18 16.5h-10.5v-1.5h10.5v1.5zM22.5 10.5h-15v-1.5h15v1.5z" />
    </svg>
  );
}

export function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 25 15"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 0c-3.3 0-6 2.7-6 6v9h9v-9h-6c0-1.65 1.35-3 3-3v-3zM19 0c-3.3 0-6 2.7-6 6v9h9v-9h-6c0-1.65 1.35-3 3-3v-3z" />
    </svg>
  );
}
