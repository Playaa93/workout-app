import { Text, YStack, H2 } from 'tamagui';

export default function ProfileScreen() {
  return (
    <YStack flex={1} backgroundColor="$background" padding="$4" justifyContent="center" alignItems="center">
      <H2 color="$primary">Profil</H2>
      <Text color="$textSecondary" marginTop="$2">Mesures, achievements, parametres</Text>
    </YStack>
  );
}
