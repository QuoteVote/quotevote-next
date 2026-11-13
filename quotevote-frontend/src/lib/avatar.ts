import { AVATAAARS_VALUES, AVATAR_KEYS } from '@/lib/avatarOptions';
import type { AvatarDraft, AvatarStyle } from '@/types/avatar';

const AVATAAARS_QUALITY_KEYS = new Set([
  'topType',
  'accessoriesType',
  'hairColor',
  'facialHairType',
  'facialHairColor',
  'clotheType',
  'clotheColor',
  'graphicType',
  'eyeType',
  'eyebrowType',
  'mouthType',
  'skinColor',
  'hatColor',
]);

// Curated option sets used to generate deterministic default avatars.
// Kept compact deliberately — the full editor option list stays in the editor page.
const DEFAULT_OPTIONS: Record<string, readonly string[]> = {
  topType: [
    'ShortHairShortFlat', 'ShortHairShortRound', 'ShortHairShortWaved',
    'LongHairStraight', 'LongHairCurly', 'LongHairBun',
    'ShortHairDreads01', 'Hat', 'LongHairFro',
  ],
  accessoriesType: ['Blank', 'Blank', 'Blank', 'Prescription01', 'Round', 'Sunglasses'],
  hairColor: ['Auburn', 'Black', 'Blonde', 'Brown', 'BrownDark', 'PastelPink', 'Red', 'SilverGray'],
  facialHairType: ['Blank', 'Blank', 'Blank', 'BeardMedium', 'BeardLight', 'MoustacheMagnum'],
  facialHairColor: ['Auburn', 'Black', 'Blonde', 'Brown', 'BrownDark'],
  clotheType: ['BlazerShirt', 'BlazerSweater', 'Hoodie', 'ShirtCrewNeck', 'ShirtVNeck', 'CollarSweater'],
  clotheColor: ['Black', 'Blue01', 'Blue02', 'Blue03', 'Gray01', 'PastelBlue', 'PastelGreen', 'Red', 'White'],
  eyeType: ['Default', 'Happy', 'Side', 'Surprised', 'Wink'],
  eyebrowType: ['Default', 'DefaultNatural', 'RaisedExcited', 'RaisedExcitedNatural'],
  mouthType: ['Default', 'Smile', 'Serious', 'Twinkle'],
  skinColor: ['Light', 'Brown', 'DarkBrown', 'Yellow', 'Pale', 'Tanned'],
};

export type AvatarQualities = Record<string, string>;

export function buildAvatarUrl(qualities: AvatarQualities, style: AvatarStyle = 'Circle'): string {
  const params = new URLSearchParams({ avatarStyle: style });
  Object.entries(qualities).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return `https://avataaars.io/?${params.toString()}`;
}

/**
 * Generates a deterministic avataaars qualities set from a seed string (username).
 * Same seed always produces the same avatar.
 */
export function getDefaultAvatar(seed: string): AvatarQualities {
  // DJB2-style hash
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0;
  }
  const abs = Math.abs(h);
  return Object.fromEntries(
    Object.entries(DEFAULT_OPTIONS).map(([key, opts], i) => [
      key,
      opts[(abs + i * 7) % opts.length],
    ])
  );
}

/**
 * Converts any stored avatar value to a renderable URL:
 *  - avataaars qualities object → avataaars.io URL
 *  - JSON-encoded qualities string → avataaars.io URL
 *  - plain URL string → returned as-is
 *  - { url: string } → the url field
 */
export function parseAvatarToUrl(
  avatar: string | Record<string, unknown> | undefined | null
): string | undefined {
  if (!avatar) return undefined;

  if (typeof avatar === 'string') {
    try {
      const parsed: unknown = JSON.parse(avatar);
      if (typeof parsed === 'object' && parsed !== null) {
        return parseAvatarToUrl(parsed as Record<string, unknown>);
      }
    } catch {
      // Not JSON — treat as a URL
    }
    return avatar;
  }

  if (typeof avatar === 'object') {
    if ('url' in avatar && typeof avatar.url === 'string') {
      return avatar.url;
    }

    const qualities: AvatarQualities = {};
    for (const [key, value] of Object.entries(avatar)) {
      if (AVATAAARS_QUALITY_KEYS.has(key) && typeof value === 'string') {
        qualities[key] = value;
      }
    }
    if (Object.keys(qualities).length > 0) {
      return buildAvatarUrl(qualities);
    }
  }

  return undefined;
}

/**
 * Reads any stored avatar into a full set of the 13 Avataaars qualities.
 * Keys or values Avataaars doesn't know are dropped and filled from the member's
 * deterministic default, so a save always sends a complete, valid object.
 * Returns null when the stored avatar is an image URL or empty.
 */
export function readAvatarQualities(
  avatar: string | Record<string, unknown> | undefined | null
): Partial<AvatarDraft> | null {
  if (!avatar) return null;
  let value: unknown = avatar;
  if (typeof avatar === 'string') {
    try {
      value = JSON.parse(avatar);
    } catch {
      return null;
    }
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const out: Partial<AvatarDraft> = {};
  for (const key of AVATAR_KEYS) {
    const v = (value as Record<string, unknown>)[key];
    if (typeof v === 'string' && AVATAAARS_VALUES[key].includes(v)) out[key] = v;
  }
  return Object.keys(out).length > 0 ? out : null;
}

/** A complete draft: known stored values first, then the deterministic default for the seed. */
export function completeDraft(partial: Partial<AvatarDraft> | null, seed: string): AvatarDraft {
  const base = getDefaultAvatar(seed);
  const draft = {} as AvatarDraft;
  for (const key of AVATAR_KEYS) {
    const fallback = base[key] ?? AVATAAARS_VALUES[key][0];
    draft[key] = partial?.[key] ?? fallback;
  }
  return draft;
}

/** True when every key holds a value Avataaars accepts. */
export function isValidDraft(value: Record<string, unknown>): value is AvatarDraft {
  return AVATAR_KEYS.every((key) => {
    const v = value[key];
    return typeof v === 'string' && AVATAAARS_VALUES[key].includes(v);
  });
}
