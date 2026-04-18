export interface WireWheel {
  _id: string;
  name: string;
  spokes: number;
  finish: string;
  price: number;
  stock: number;
}

export interface WireWheelState {
  items: WireWheel[];
  loading: boolean;
  error: string | null;
}
