// App.js — root entry point
//
// Apple Fitness-style navigation with premium tab bar.

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          }
          return (
            <View style={[styles.tabIconBg, focused && styles.tabIconBgActive]}>
              <Ionicons name={iconName} size={22} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: `${colors.bgSecondary}E6`,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 4,
          letterSpacing: 0.3,
        },
        headerStyle: { 
          backgroundColor: colors.bgPrimary,
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { 
          fontWeight: '900',
          fontSize: 20,
          letterSpacing: -0.5,
        },
        headerShadowVisible: false,
      })}>
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'perForm',
          headerTitle: () => (
            <Text style={styles.headerTitle}>perForm</Text>
          ),
        }} 
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ 
          title: 'Session History',
          headerTitle: () => (
            <Text style={styles.headerTitle}>Activity</Text>
          ),
        }} 
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="HomeTabs"
            component={HomeTabs}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tabIconBg: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  tabIconBgActive: {
    backgroundColor: colors.primaryMuted,
  },
});
