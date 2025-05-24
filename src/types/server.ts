export interface Server {
  id: string;
  name: string;
  icon: string | null;
  hasBot: boolean;
  hasTagsFeature?: boolean;
} 