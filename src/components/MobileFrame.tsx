import { View } from 'react-native';

// Native version - just pass through children without frame
export function MobileFrame({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
