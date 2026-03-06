import { Text, YStack, H2 } from 'tamagui';

export default function DietScreen() {
  return (
    <YStack flex={1} backgroundColor="$background" padding="$4" justifyContent="center" alignItems="center">
      <H2 color="$primary">Nutrition</H2>
      <Text color="$textSecondary" marginTop="$2">Journal alimentaire, scan, macros</Text>
    </YStack>
  );
}
