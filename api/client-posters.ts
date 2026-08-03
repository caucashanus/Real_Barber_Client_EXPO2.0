/** Marketingový plakát z GET /api/home (posters). */
export interface ClientPoster {
  id: string;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  websiteUrl: string | null;
  buttonText?: string | null;
  sortOrder: number;
}
