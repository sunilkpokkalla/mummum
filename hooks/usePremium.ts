import { useBabyStore } from '@/store/useBabyStore';

export function usePremium() {
  const { isPro } = useBabyStore();

  return {
    isPro,
    isFeatureUnlocked: isPro,
  };
}
