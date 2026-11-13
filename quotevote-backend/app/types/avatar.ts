/** The 13 Avataaars qualities a member's avatar is stored as. */
export type AvatarQualityKey =
  | 'topType'
  | 'accessoriesType'
  | 'hatColor'
  | 'hairColor'
  | 'facialHairType'
  | 'facialHairColor'
  | 'clotheType'
  | 'clotheColor'
  | 'graphicType'
  | 'eyeType'
  | 'eyebrowType'
  | 'mouthType'
  | 'skinColor';

export type AvatarQualities = Record<AvatarQualityKey, string>;
