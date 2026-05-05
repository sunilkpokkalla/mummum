import { useBabyStore } from '@/store/useBabyStore';

export function usePremium() {
  const { isPro, isTrial, trialStartedAt } = useBabyStore();

  const getTrialStatus = () => {
    if (isPro) return { active: true, label: 'PRO', remainingDays: 0, expired: false };
    if (!trialStartedAt) return { active: false, label: 'Free', remainingDays: 0, expired: false };

    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const elapsed = Date.now() - trialStartedAt;
    const remaining = sevenDaysInMs - elapsed;
    const expired = remaining <= 0;
    const remainingDays = Math.ceil(remaining / (1000 * 60 * 60 * 24));

    return {
      active: !expired,
      label: expired ? 'Free' : 'Trial',
      remainingDays: expired ? 0 : remainingDays,
      expired
    };
  };

  const status = getTrialStatus();
  
  // The master switch for all digital features
  const isFeatureUnlocked = isPro || (isTrial && !status.expired);

  return {
    isPro,
    isTrial,
    isFeatureUnlocked,
    trialStatus: status,
    isTrialActive: isTrial && !status.expired
  };
}
