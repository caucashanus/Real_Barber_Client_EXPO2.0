/**
 * Statická videa pro sekci "Kudy k nám?" – načítají se z projektu (assets/videos),
 * ne z API. Přidejte .mp4 soubory do assets/videos a odkazujte je zde.
 */
export interface KudyKNamVideoItem {
  id: string;
  title: string;
  /** require('@/assets/videos/nazev.mp4') nebo { uri: '...' } */
  source: number | { uri: string };
}

export const KUDY_K_NAM_VIDEOS: KudyKNamVideoItem[] = [
  { id: 'hagibor', title: 'Hagibor', source: require('@/assets/videos/hagibor.mp4') },
];
