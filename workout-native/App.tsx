import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/powersync/auth-context';
import { PowerSyncProvider } from './src/powersync/PowerSyncProvider';

export default function App() {
  return (
    <AuthProvider>
      <PowerSyncProvider>
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>💪</Text>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#6750a4', marginTop: 16 }}>Workout</Text>
          <Text style={{ fontSize: 16, color: '#888', marginTop: 8 }}>Ca marche !</Text>
          <StatusBar style="dark" />
        </View>
      </PowerSyncProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },
});
