export interface Tire {
  _id: string;
  name: string;
  brand: string;
  price: number;
  size: string;
  stock: number;
  imageUrl?: string;
  description?: string;
}

export interface TireState {
  items: Tire[];
  loading: boolean;
  error: string | null;
}
