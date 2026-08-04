import type { ImageSourcePropType } from 'react-native';

import type { BranchInternalId } from '@/constants/crmBranchIds';
import { BRANCH_MARKER_IMAGES } from '@/constants/branch-marker-images';

export type BranchContactMeta = {
  id: BranchInternalId;
  shortLabel: string;
  address: string;
  latitude: number;
  longitude: number;
  carouselImage: ImageSourcePropType;
};

const BRANCH_CONTACTS: Record<BranchInternalId, Omit<BranchContactMeta, 'carouselImage'>> = {
  kacerov: {
    id: 'kacerov',
    shortLabel: 'Kačerov',
    address: 'Budějovická 615/47, Praha 4',
    latitude: 50.04219531986807,
    longitude: 14.459689653073983,
  },
  hagibor: {
    id: 'hagibor',
    shortLabel: 'Hagibor',
    address: 'Počernická 3492/1a, Praha 10',
    latitude: 50.07850819920388,
    longitude: 14.48365959725635,
  },
  modrany: {
    id: 'modrany',
    shortLabel: 'Modřany',
    address: 'Čs. exilu 40, Praha 12',
    latitude: 50.00477408096832,
    longitude: 14.416534741433177,
  },
  barrandov: {
    id: 'barrandov',
    shortLabel: 'Barrandov',
    address: 'O. Scheinpflugové 1293/4, Praha 5',
    latitude: 50.030533187365194,
    longitude: 14.361240910745531,
  },
};

function markerImageForId(id: BranchInternalId): ImageSourcePropType {
  switch (id) {
    case 'kacerov':
      return BRANCH_MARKER_IMAGES.Kačerov;
    case 'hagibor':
      return BRANCH_MARKER_IMAGES.Hagibor;
    case 'modrany':
      return BRANCH_MARKER_IMAGES.Modřany;
    case 'barrandov':
      return BRANCH_MARKER_IMAGES.Barrandov;
    default:
      return BRANCH_MARKER_IMAGES.Kačerov;
  }
}

export function getBranchContactMeta(id: BranchInternalId): BranchContactMeta {
  const base = BRANCH_CONTACTS[id];
  return {
    ...base,
    carouselImage: markerImageForId(id),
  };
}

export const ALL_BRANCH_INTERNAL_IDS: BranchInternalId[] = [
  'kacerov',
  'modrany',
  'hagibor',
  'barrandov',
];
