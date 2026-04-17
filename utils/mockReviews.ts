import type { EntityReviewItem } from '@/api/reviews';

const MOCK_REVIEW_POOL: Omit<EntityReviewItem, 'id'>[] = [
  {
    rating: 5,
    positiveFeedback: null,
    negativeFeedback: null,
    description: 'Skvělý střih, přesně podle mých představ. Určitě se vrátím.',
    images: [],
    isAnonymous: false,
    createdAt: '2025-02-14T10:30:00Z',
    updatedAt: '2025-02-14T10:30:00Z',
    client: { id: 'mock-1', name: 'Tomáš Kovář', firstName: 'Tomáš', lastName: 'Kovář', avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg' },
  },
  {
    rating: 5,
    positiveFeedback: null,
    negativeFeedback: null,
    description: 'Přivedla jsem sem syna a byl nadšený. Konečně někdo kdo ví co dělá.',
    images: [],
    isAnonymous: false,
    createdAt: '2025-02-28T14:15:00Z',
    updatedAt: '2025-02-28T14:15:00Z',
    client: { id: 'mock-2', name: 'Markéta Veselá', firstName: 'Markéta', lastName: 'Veselá', avatarUrl: null },
  },
  {
    rating: 4,
    positiveFeedback: null,
    negativeFeedback: null,
    description: 'Konečně holič, který poslouchá co chcete. Výsledek super.',
    images: [],
    isAnonymous: false,
    createdAt: '2025-03-05T09:00:00Z',
    updatedAt: '2025-03-05T09:00:00Z',
    client: { id: 'mock-3', name: 'Jan Procházka', firstName: 'Jan', lastName: 'Procházka', avatarUrl: null },
  },
  {
    rating: 5,
    positiveFeedback: null,
    negativeFeedback: null,
    description: 'Rychlá obsluha a výborný výsledek. Přijdu znovu.',
    images: [],
    isAnonymous: false,
    createdAt: '2025-03-12T16:45:00Z',
    updatedAt: '2025-03-12T16:45:00Z',
    client: { id: 'mock-4', name: 'Lukáš Mareš', firstName: 'Lukáš', lastName: 'Mareš', avatarUrl: 'https://randomuser.me/api/portraits/men/45.jpg' },
  },
  {
    rating: 4,
    positiveFeedback: null,
    negativeFeedback: null,
    description: 'Vzala jsem sem manžela, byl spokojený a hned si objednal další termín.',
    images: [],
    isAnonymous: false,
    createdAt: '2025-03-20T11:00:00Z',
    updatedAt: '2025-03-20T11:00:00Z',
    client: { id: 'mock-5', name: 'Petra Horáková', firstName: 'Petra', lastName: 'Horáková', avatarUrl: null },
  },
  {
    rating: 5,
    positiveFeedback: null,
    negativeFeedback: null,
    description: 'Nejlepší holič v okolí, chodím sem pravidelně.',
    images: [],
    isAnonymous: false,
    createdAt: '2025-04-01T13:20:00Z',
    updatedAt: '2025-04-01T13:20:00Z',
    client: { id: 'mock-6', name: 'Ondřej Svoboda', firstName: 'Ondřej', lastName: 'Svoboda', avatarUrl: 'https://randomuser.me/api/portraits/men/12.jpg' },
  },
  {
    rating: 5,
    positiveFeedback: null,
    negativeFeedback: null,
    description: 'Tátu sem vozím každý měsíc, vždy spokojený. Doporučuji všem.',
    images: [],
    isAnonymous: false,
    createdAt: '2025-04-08T15:10:00Z',
    updatedAt: '2025-04-08T15:10:00Z',
    client: { id: 'mock-7', name: 'Tereza Bláhová', firstName: 'Tereza', lastName: 'Bláhová', avatarUrl: null },
  },
  {
    rating: 4,
    positiveFeedback: null,
    negativeFeedback: null,
    description: 'Pohodová atmosféra, střih přesně jak jsem chtěl.',
    images: [],
    isAnonymous: false,
    createdAt: '2025-04-10T10:00:00Z',
    updatedAt: '2025-04-10T10:00:00Z',
    client: { id: 'mock-8', name: 'Martin Řezáč', firstName: 'Martin', lastName: 'Řezáč', avatarUrl: 'https://randomuser.me/api/portraits/men/67.jpg' },
  },
  {
    rating: 5,
    positiveFeedback: null,
    negativeFeedback: null,
    description: 'Přišla jsem sem s tátou poprvé a určitě se vrátíme. Super přístup.',
    images: [],
    isAnonymous: false,
    createdAt: '2025-04-12T09:30:00Z',
    updatedAt: '2025-04-12T09:30:00Z',
    client: { id: 'mock-9', name: 'Lucie Nováková', firstName: 'Lucie', lastName: 'Nováková', avatarUrl: null },
  },
  {
    rating: 5,
    positiveFeedback: null,
    negativeFeedback: null,
    description: 'Perfektní práce, vždy přesně podle přání. Syn nadšený.',
    images: [],
    isAnonymous: false,
    createdAt: '2025-04-13T12:00:00Z',
    updatedAt: '2025-04-13T12:00:00Z',
    client: { id: 'mock-10', name: 'Pavel Dvořák', firstName: 'Pavel', lastName: 'Dvořák', avatarUrl: 'https://randomuser.me/api/portraits/men/78.jpg' },
  },
];

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Vrátí 3-4 mock recenze vybrané deterministicky podle ID entity.
 * Každá entita dostane jiné recenze ze společného poolu.
 */
export function getMockReviews(entityId: string): EntityReviewItem[] {
  const hash = simpleHash(entityId);
  const count = 3 + (hash % 2); // 3 nebo 4 recenze
  const pool = [...MOCK_REVIEW_POOL];
  const result: EntityReviewItem[] = [];

  for (let i = 0; i < count; i++) {
    const index = (hash + i * 7) % pool.length;
    const item = pool[index];
    result.push({
      ...item,
      id: `mock-review-${entityId}-${i}`,
    });
  }

  return result;
}
