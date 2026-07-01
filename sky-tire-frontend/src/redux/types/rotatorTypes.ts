export interface RotatorColors {
  bgGradientStart: string;
  bgGradientMiddle: string;
  bgGradientEnd: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
}

export interface RotatorAnimation {
  animationDuration: number;
  animationCurve: string;
  stayDuration: number;
}

export interface RotatorHeadline {
  id: string;
  title: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface RotatorState {
  colors: RotatorColors;
  animation: RotatorAnimation;
  headlines: RotatorHeadline[];
  loading: boolean;
  savingColors: boolean;
  savingAnimation: boolean;
  error: string | null;
}

export interface RotatorHeadlineFormData {
  title: string;
}
