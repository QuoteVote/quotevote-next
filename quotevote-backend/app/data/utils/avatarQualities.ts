/**
 * Validation for saved avatars (#705). An avatar is exactly the 13 Avataaars
 * qualities, each with a value Avataaars supports. The frontend keeps the same
 * list in `quotevote-frontend/src/lib/avatarOptions.ts`.
 */
import type { AvatarQualities, AvatarQualityKey } from '~/types/avatar';

const FABRIC = [
  'Black',
  'Blue01',
  'Blue02',
  'Blue03',
  'Gray01',
  'Gray02',
  'Heather',
  'PastelBlue',
  'PastelGreen',
  'PastelOrange',
  'PastelRed',
  'PastelYellow',
  'Pink',
  'Red',
  'White',
];

export const AVATAR_QUALITY_VALUES: Record<AvatarQualityKey, readonly string[]> = {
  topType: [
    'NoHair',
    'Eyepatch',
    'Hat',
    'Hijab',
    'Turban',
    'WinterHat1',
    'WinterHat2',
    'WinterHat3',
    'WinterHat4',
    'LongHairBigHair',
    'LongHairBob',
    'LongHairBun',
    'LongHairCurly',
    'LongHairCurvy',
    'LongHairDreads',
    'LongHairFrida',
    'LongHairFro',
    'LongHairFroBand',
    'LongHairNotTooLong',
    'LongHairShavedSides',
    'LongHairMiaWallace',
    'LongHairStraight',
    'LongHairStraight2',
    'LongHairStraightStrand',
    'ShortHairDreads01',
    'ShortHairDreads02',
    'ShortHairFrizzle',
    'ShortHairShaggyMullet',
    'ShortHairShortCurly',
    'ShortHairShortFlat',
    'ShortHairShortRound',
    'ShortHairShortWaved',
    'ShortHairSides',
    'ShortHairTheCaesar',
    'ShortHairTheCaesarSidePart',
  ],
  accessoriesType: [
    'Blank',
    'Kurt',
    'Prescription01',
    'Prescription02',
    'Round',
    'Sunglasses',
    'Wayfarers',
  ],
  hatColor: FABRIC,
  hairColor: [
    'Auburn',
    'Black',
    'Blonde',
    'BlondeGolden',
    'Brown',
    'BrownDark',
    'PastelPink',
    'Platinum',
    'Red',
    'SilverGray',
  ],
  facialHairType: [
    'Blank',
    'BeardMedium',
    'BeardLight',
    'BeardMajestic',
    'MoustacheFancy',
    'MoustacheMagnum',
  ],
  facialHairColor: [
    'Auburn',
    'Black',
    'Blonde',
    'BlondeGolden',
    'Brown',
    'BrownDark',
    'Platinum',
    'Red',
  ],
  clotheType: [
    'BlazerShirt',
    'BlazerSweater',
    'CollarSweater',
    'GraphicShirt',
    'Hoodie',
    'Overall',
    'ShirtCrewNeck',
    'ShirtScoopNeck',
    'ShirtVNeck',
  ],
  clotheColor: FABRIC,
  graphicType: [
    'Bat',
    'Cumbia',
    'Deer',
    'Diamond',
    'Hola',
    'Pizza',
    'Resist',
    'Selena',
    'Bear',
    'SkullOutline',
    'Skull',
  ],
  eyeType: [
    'Close',
    'Cry',
    'Default',
    'Dizzy',
    'EyeRoll',
    'Happy',
    'Hearts',
    'Side',
    'Squint',
    'Surprised',
    'Wink',
    'WinkWacky',
  ],
  eyebrowType: [
    'Angry',
    'AngryNatural',
    'Default',
    'DefaultNatural',
    'FlatNatural',
    'RaisedExcited',
    'RaisedExcitedNatural',
    'SadConcerned',
    'SadConcernedNatural',
    'UnibrowNatural',
    'UpDown',
    'UpDownNatural',
  ],
  mouthType: [
    'Concerned',
    'Default',
    'Disbelief',
    'Eating',
    'Grimace',
    'Sad',
    'ScreamOpen',
    'Serious',
    'Smile',
    'Tongue',
    'Twinkle',
    'Vomit',
  ],
  skinColor: ['Tanned', 'Yellow', 'Pale', 'Light', 'Brown', 'DarkBrown', 'Black'],
};

export const AVATAR_QUALITY_KEYS = Object.keys(AVATAR_QUALITY_VALUES) as AvatarQualityKey[];

/**
 * Returns the 13 qualities as a fresh object, or throws an Error with a
 * member-facing message when the input isn't a complete, known avatar.
 */
export function validateAvatarQualities(input: unknown): AvatarQualities {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('avatarQualities must be an object');
  }
  const record = input as Record<string, unknown>;
  const unknownKey = Object.keys(record).find(
    (key) => !(AVATAR_QUALITY_KEYS as string[]).includes(key)
  );
  if (unknownKey) {
    throw new Error(`Unknown avatar quality: ${unknownKey.slice(0, 40)}`);
  }
  const qualities = {} as AvatarQualities;
  for (const key of AVATAR_QUALITY_KEYS) {
    const value = record[key];
    if (typeof value !== 'string') {
      throw new Error(`Avatar quality ${key} is required`);
    }
    if (!AVATAR_QUALITY_VALUES[key].includes(value)) {
      throw new Error(`Avatar quality ${key} has an unsupported value`);
    }
    qualities[key] = value;
  }
  return qualities;
}
