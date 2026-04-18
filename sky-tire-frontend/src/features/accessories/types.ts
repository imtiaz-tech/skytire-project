export interface Accessory {
  _id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

export interface AccessoryState {
  items: Accessory[];
  loading: boolean;
  error: string | null;
}
