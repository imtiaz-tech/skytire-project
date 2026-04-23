export interface User {
  id: number;
  name: string;
  memberId: number;
  email: string;
  role: string;
  isActive: boolean;
  phone?: string;
}

export interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  total: number;
  pages: number;
}
