export interface Device {
  id: number;
  visitorId: string;
  isBanned: boolean;
  bannedAt: string | null;
  browserName?: string;
  browserVersion?: string;
  os?: string;
  device?: string;
  ipAddress?: string;
  city?: string;
  country?: string;
  vpnDetected?: boolean;
  proxyDetected?: boolean;
  botDetected?: boolean;
  incognito?: boolean;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  createdAt: string;
  userId: number;
}

export interface User {
  id: number;
  name: string;
  memberId: number;
  email: string;
  role: string;
  isActive: boolean;
  phone?: string;
  /** True only when the user has devices and ALL of them are banned */
  allDevicesBanned?: boolean;
  deviceCount?: number;
}

export interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  total: number;
  pages: number;
  /** Per-user device lists fetched on demand */
  devicesByUserId: Record<number, Device[]>;
  deviceLoading: boolean;
}
