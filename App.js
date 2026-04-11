// App.js — root entry point
//
// Navigation is set up here. Right now there's only HomeScreen,
// but this structure makes it easy to add a History screen,
// Settings screen, etc. later.

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#1565C0' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700' },
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'perForm' }}
          />
          {/* Add future screens here, e.g.:
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          */}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
