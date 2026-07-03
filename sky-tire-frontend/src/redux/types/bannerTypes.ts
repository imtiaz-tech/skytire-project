import { BannerData } from '@/lib/bannerValidation';

export interface BannerState {
  data: BannerData;
  loading: boolean;
  saving: boolean;
  uploading: boolean;
  error: string | null;
}

export type { BannerData, BannerSegment } from '@/lib/bannerValidation';
