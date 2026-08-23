import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { View } from 'react-native';

import { fontAssets } from '@/constants/theme';

export default function WebRootLayout() {
  const [fontsReady, fontError] = useFonts(fontAssets);

  if (!fontsReady && !fontError) return null;

  return (
    <View style={{ flex: 1 }}>
      <Slot />
    </View>
  );
}
