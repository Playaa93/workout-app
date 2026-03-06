import { Text, YStack, H2 } from 'tamagui';

export default function WorkoutScreen() {
  return (
    <YStack flex={1} backgroundColor="$background" padding="$4" justifyContent="center" alignItems="center">
      <H2 color="$primary">Entrainement</H2>
      <Text color="$textSecondary" marginTop="$2">Sessions, exercices, programmes</Text>
    </YStack>
  );
}
