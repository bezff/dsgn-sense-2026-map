export interface MapData {
  id: number;
  image_url: string;
}

export interface MarkerData {
  id: number;
  x_percent: number;
  y_percent: number;
  title: string;
  description: string;
  photo_url: string | null;
}
