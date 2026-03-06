import { View, Text, YStack, H2 } from 'tamagui';

export default function HomeScreen() {
  return (
    <YStack flex={1} backgroundColor="$background" padding="$4" justifyContent="center" alignItems="center">
      <H2 color="$primary">Accueil</H2>
      <Text color="$textSecondary" marginTop="$2">Dashboard, XP, streaks</Text>
    </YStack>
  );
}
