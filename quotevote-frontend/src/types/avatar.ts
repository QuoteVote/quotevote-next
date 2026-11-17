/** Types for the avatar editor (#656). */

import type { KeyboardEvent, ReactNode } from "react";

export type AvatarKey =
  | "topType"
  | "accessoriesType"
  | "hatColor"
  | "hairColor"
  | "facialHairType"
  | "facialHairColor"
  | "clotheType"
  | "clotheColor"
  | "graphicType"
  | "eyeType"
  | "eyebrowType"
  | "mouthType"
  | "skinColor";

/** All 13 saved Avataaars qualities. Both backends replace the stored object, so saves send all. */
export type AvatarDraft = Record<AvatarKey, string>;

export interface AvatarOption {
  value: string;
  label: string;
}

export interface ColorOption extends AvatarOption {
  hex: string;
}

export interface HairGroup {
  id: string;
  label: string;
  options: AvatarOption[];
}

export interface MoodOption {
  label: string;
  values: Pick<AvatarDraft, "eyeType" | "eyebrowType" | "mouthType">;
}

export interface ColorPreset {
  label: string;
  values: Pick<AvatarDraft, "clotheColor" | "hairColor">;
}

export type ShuffleGroup = "Hair" | "Face" | "Clothing" | "Colors";

/** Avataaars render styles: a colored circle, or the figure alone. */
export type AvatarStyle = "Circle" | "Transparent";

/** What an option tile zooms in on. */
export type AvatarCrop = "head" | "face" | "torso";

export type AvatarTab = "hair" | "face" | "clothing" | "colors";

export interface AvatarEditorState {
  saved: AvatarDraft;
  draft: AvatarDraft;
  past: AvatarDraft[];
  future: AvatarDraft[];
}

export interface AvatarEditorApi {
  draft: AvatarDraft;
  saved: AvatarDraft;
  changeCount: number;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  locks: ShuffleGroup[];
  set: (patch: Partial<AvatarDraft>) => void;
  undo: () => void;
  redo: () => void;
  shuffle: () => void;
  reset: () => void;
  toggleLock: (group: ShuffleGroup) => void;
  markSaved: (next: AvatarDraft) => void;
}

/** Props shared by the four editor tabs. */
export interface AvatarTabProps {
  draft: AvatarDraft;
  set: (patch: Partial<AvatarDraft>) => void;
}

export interface AvatarCropProps {
  draft: AvatarDraft;
  crop: AvatarCrop;
  height: number;
}

export interface AvatarFigureProps {
  draft: AvatarDraft;
  size: number;
  className?: string;
  alt?: string;
}

export interface OptionGridItem {
  value: string;
  label: string;
  preview: AvatarDraft;
}

export interface OptionGridProps {
  label: string;
  items: OptionGridItem[];
  value: string | undefined;
  onChange: (value: string) => void;
  crop: AvatarCrop;
  height: number;
  /** Tailwind grid-cols classes per breakpoint. */
  colsClassName: string;
  accent?: "green" | "blue";
}

export interface OptionTileProps {
  item: OptionGridItem;
  checked: boolean;
  tabIndex: number;
  crop: AvatarCrop;
  height: number;
  accent: "green" | "blue";
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  register: (node: HTMLButtonElement | null) => void;
}

export interface ColorSwatchesProps {
  label: string;
  options: ColorOption[];
  value: string | undefined;
  onChange: (value: string) => void;
  /** Dot diameter in px; skin tone uses a larger dot. */
  size?: number;
}

export interface EditorSectionProps {
  title: string;
  /** Current choice, shown bold on the right. */
  value?: string;
  /** Muted helper text on the right, used when there is no single value. */
  note?: string;
  children: ReactNode;
  className?: string;
}

export interface HairFilterProps {
  filter: string;
  query: string;
  onFilter: (filter: string) => void;
  onQuery: (query: string) => void;
}

export interface AvatarStageProps {
  draft: AvatarDraft;
  saved: AvatarDraft;
  showSaved: boolean;
  onShowSaved: (showSaved: boolean) => void;
  compact?: boolean;
}

export interface AvatarToolbarProps {
  editor: AvatarEditorApi;
  downloading: boolean;
  onDownload: () => void;
}

export interface ShuffleLocksProps {
  locks: ShuffleGroup[];
  onToggle: (group: ShuffleGroup) => void;
}

export interface LeaveDialogProps {
  open: boolean;
  saved: AvatarDraft;
  draft: AvatarDraft;
  changeCount: number;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

export interface AvatarEditorProps {
  initial: AvatarDraft;
  userId: string;
  username: string;
  /** The stored avatar is an image URL, kept until the member saves. */
  hasImageAvatar: boolean;
}

export interface UpdateUserAvatarData {
  updateUserAvatar: { _id: string; avatar: unknown } | null;
}

export interface PhoneToolbarProps {
  editor: AvatarEditorApi;
  downloading: boolean;
  onDownload: () => void;
}
