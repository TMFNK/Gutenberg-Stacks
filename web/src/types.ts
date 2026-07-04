export interface Book {
  id: number;
  title: string;
  author: string;
  year: number | null;
  lang: string;
  downloads: number;
  x: number;
  y: number;
  cluster: number;
  mood: string | null;
  themes: string[] | null;
  difficulty: string | null;
  hook: string | null;
  url: string;
}

export interface Cluster {
  id: number;
  label: string;
  x: number;
  y: number;
}
