'use client';

/**
 * Avatar Editor Page
 *
 * Dashboard page for editing user avatar properties.
 * Migrated from SimpleAvatarEditor component in the React monorepo.
 *
 * Renders dropdown selects for each avatar property (topType, hairColor, etc.),
 * a live preview using avataaars.io, and Save / Randomize actions.
 * On save it calls UPDATE_USER_AVATAR, updates the Zustand store, and
 * redirects back to the user's profile page.
 */

import { useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { toast } from 'sonner';
import { Dices, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store';
import { UPDATE_USER_AVATAR } from '@/graphql/mutations';
import { buildAvatarUrl, type AvatarQualities } from '@/lib/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ---------------------------------------------------------------------------
// Avatar option definitions (migrated from monorepo utils/display.jsx)
// ---------------------------------------------------------------------------

interface AvatarOption {
  name: string;
  displayName: string;
  options: string[];
}

const avatarOptions: AvatarOption[] = [
  {
    name: 'topType',
    displayName: 'Top / Hair',
    options: [
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
  },
  {
    name: 'accessoriesType',
    displayName: 'Accessories',
    options: [
      'Blank',
      'Kurt',
      'Prescription01',
      'Prescription02',
      'Round',
      'Sunglasses',
      'Wayfarers',
    ],
  },
  {
    name: 'hatColor',
    displayName: 'Hat Color',
    options: [
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
    ],
  },
  {
    name: 'hairColor',
    displayName: 'Hair Color',
    options: [
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
  },
  {
    name: 'facialHairType',
    displayName: 'Facial Hair',
    options: [
      'Blank',
      'BeardMedium',
      'BeardLight',
      'BeardMajestic',
      'MoustacheFancy',
      'MoustacheMagnum',
    ],
  },
  {
    name: 'facialHairColor',
    displayName: 'Facial Hair Color',
    options: [
      'Auburn',
      'Black',
      'Blonde',
      'BlondeGolden',
      'Brown',
      'BrownDark',
      'Platinum',
      'Red',
    ],
  },
  {
    name: 'clotheType',
    displayName: 'Clothes',
    options: [
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
  },
  {
    name: 'clotheColor',
    displayName: 'Clothes Color',
    options: [
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
    ],
  },
  {
    name: 'graphicType',
    displayName: 'Graphic',
    options: [
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
  },
  {
    name: 'eyeType',
    displayName: 'Eyes',
    options: [
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
  },
  {
    name: 'eyebrowType',
    displayName: 'Eyebrows',
    options: [
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
  },
  {
    name: 'mouthType',
    displayName: 'Mouth',
    options: [
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
  },
  {
    name: 'skinColor',
    displayName: 'Skin Color',
    options: ['Tanned', 'Yellow', 'Pale', 'Light', 'Brown', 'DarkBrown', 'Black'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Pick one random option for each avatar property. */
function getRandomAvatar(): AvatarQualities {
  const result: AvatarQualities = {};
  avatarOptions.forEach((opt) => {
    const idx = Math.floor(Math.random() * opt.options.length);
    result[opt.name] = opt.options[idx];
  });
  return result;
}

/**
 * Extract avatar qualities from the stored avatar value.
 * The backend stores avatar as a JSON object with the property keys.
 * It may also be a string URL or undefined.
 */
function parseStoredAvatar(
  avatar: string | Record<string, unknown> | undefined
): AvatarQualities | null {
  if (!avatar) return null;

  // If avatar is already an object with known keys, extract them
  if (typeof avatar === 'object') {
    const qualities: AvatarQualities = {};
    const knownKeys = new Set(avatarOptions.map((o) => o.name));
    for (const [key, value] of Object.entries(avatar)) {
      if (knownKeys.has(key) && typeof value === 'string') {
        qualities[key] = value;
      }
    }
    return Object.keys(qualities).length > 0 ? qualities : null;
  }

  // If avatar is a JSON string, try to parse it
  if (typeof avatar === 'string') {
    try {
      const parsed = JSON.parse(avatar);
      if (typeof parsed === 'object' && parsed !== null) {
        return parseStoredAvatar(parsed);
      }
    } catch {
      // Not JSON -- it's a URL string, ignore
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Mutation result type
// ---------------------------------------------------------------------------

interface UpdateUserAvatarData {
  updateUserAvatar: {
    _id: string;
    username: string;
    name: string;
    email: string;
    avatar: string;
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AvatarEditorPage(): React.ReactNode {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;

  const userData = useAppStore((state) => state.user.data);
  const updateStoreAvatar = useAppStore((state) => state.updateAvatar);
  const userId = (userData._id || userData.id) as string | undefined;

  // Initialise avatar state from the store or random values
  const initialAvatar = useMemo(() => {
    const stored = parseStoredAvatar(
      userData.avatar as string | Record<string, unknown> | undefined
    );
    return stored ?? getRandomAvatar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [avatar, setAvatar] = useState<AvatarQualities>(initialAvatar);

  const [updateUserAvatar, { loading: saving }] = useMutation<UpdateUserAvatarData>(UPDATE_USER_AVATAR);

  // Live preview URL
  const previewUrl = useMemo(() => buildAvatarUrl(avatar), [avatar]);

  // ---- Handlers -----------------------------------------------------------

  const handleChange = useCallback((name: string, value: string) => {
    setAvatar((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleRandomize = useCallback(() => {
    setAvatar(getRandomAvatar());
  }, []);

  const handleSave = useCallback(async () => {
    if (!userId) {
      toast.error('You must be logged in to update your avatar.');
      return;
    }

    try {
      const result = await updateUserAvatar({
        variables: { user_id: userId, avatarQualities: avatar },
      });

      const returnedAvatar = result.data?.updateUserAvatar?.avatar;
      if (returnedAvatar) {
        updateStoreAvatar(returnedAvatar);
      }

      toast.success('Avatar updated successfully!');
      router.push(`/dashboard/profile/${username}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update avatar.';
      toast.error(message);
    }
  }, [userId, avatar, updateUserAvatar, updateStoreAvatar, router, username]);

  const handleBack = useCallback(() => {
    router.push(`/dashboard/profile/${username}`);
  }, [router, username]);

  // ---- Render -------------------------------------------------------------

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Back to profile">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Avatar</h1>
      </div>

      {/* Preview + action buttons */}
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <div className="relative h-[180px] w-[180px] overflow-hidden rounded-full bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Avatar preview"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-row gap-2 sm:flex-col">
          <Button
            variant="outline"
            onClick={handleRandomize}
            className="gap-2"
            disabled={saving}
          >
            <Dices className="h-4 w-4" />
            Randomize
          </Button>
          <Button
            onClick={handleSave}
            className="gap-2"
            disabled={saving || !userId}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Property selects */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {avatarOptions.map((opt) => (
          <div key={opt.name} className="space-y-1.5">
            <Label htmlFor={`avatar-${opt.name}`}>{opt.displayName}</Label>
            <Select
              value={avatar[opt.name] || ''}
              onValueChange={(value) => handleChange(opt.name, value)}
            >
              <SelectTrigger id={`avatar-${opt.name}`} className="w-full">
                <SelectValue placeholder={`Select ${opt.displayName}`} />
              </SelectTrigger>
              <SelectContent>
                {opt.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
