// App.js
//
// Apple Fitness-inspired navigation: 3-tab bottom nav.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RepDetailScreen from './src/screens/RepDetailScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home', label: 'Home', icon: 'home', screen: HomeScreen },
  { name: 'Stats', label: 'Stats', icon: 'stats-chart', screen: StatsScreen },
  { name: 'Profile', label: 'Profile', icon: 'person', screen: ProfileScreen },
];

function HomeTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          const tab = TABS.find((t) => t.name === route.name);
          return (
            <View style={[styles.tabIconBg, focused && styles.tabIconBgActive]}>
              <Ionicons
                name={focused ? tab?.icon : `${tab?.icon}-outline`}
                size={20}
                color={color}
              />
            </View>
          );
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: `${colors.bgSecondary}F2`,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 68 + insets.bottom,
          paddingBottom: 8 + insets.bottom * 0.4,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOpacity: 0.5,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
          letterSpacing: 0.2,
        },
        headerStyle: {
          backgroundColor: colors.bgPrimary,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 17,
          letterSpacing: -0.3,
        },
        headerShadowVisible: false,
      })}
    >
      {TABS.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.screen}
          options={{
            title: tab.label,
            headerShown: false,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="HomeTabs" component={HomeTabs} />
            <Stack.Screen
              name="RepDetail"
              component={RepDetailScreen}
              options={{
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabIconBg: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  tabIconBgActive: {
    backgroundColor: `${colors.textPrimary}15`,
  },
});
