export interface Wheel {
  _id: string;
  name: string;
  brand: string;
  price: number;
  diameter: number;
  width: number;
  finish: string;
  stock: number;
  imageUrl?: string;
}

export interface WheelState {
  items: Wheel[];
  loading: boolean;
  error: string | null;
}
