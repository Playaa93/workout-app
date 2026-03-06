import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'tamagui';
import HomeScreen from '../screens/home/HomeScreen';
import WorkoutScreen from '../screens/workout/WorkoutScreen';
import DietScreen from '../screens/diet/DietScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary.val,
        tabBarInactiveTintColor: theme.textSecondary.val,
        tabBarStyle: {
          backgroundColor: theme.surface.val,
          borderTopColor: theme.borderColor.val,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Workout"
        component={WorkoutScreen}
        options={{
          tabBarLabel: 'Training',
          tabBarIcon: ({ color, size }) => <TabIcon name="fitness" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Diet"
        component={DietScreen}
        options={{
          tabBarLabel: 'Nutrition',
          tabBarIcon: ({ color, size }) => <TabIcon name="restaurant" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <TabIcon name="person" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Simple text-based tab icons (will be replaced with proper icons later)
function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const icons: Record<string, string> = {
    home: '🏠',
    fitness: '💪',
    restaurant: '🍽️',
    person: '👤',
  };
  const { Text } = require('react-native');
  return <Text style={{ fontSize: size * 0.8 }}>{icons[name] || '•'}</Text>;
}
