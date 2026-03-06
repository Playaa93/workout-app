import * as Haptics from 'expo-haptics';

export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  const map = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  } as const;
  Haptics.impactAsync(map[style]);
};

export const triggerNotification = (type: 'success' | 'warning' | 'error' = 'success') => {
  const map = {
    success: Haptics.NotificationFeedbackType.Success,
    warning: Haptics.NotificationFeedbackType.Warning,
    error: Haptics.NotificationFeedbackType.Error,
  } as const;
  Haptics.notificationAsync(map[type]);
};
