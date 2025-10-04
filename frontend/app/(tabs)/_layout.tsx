// @ts-nocheck

import React from "react";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeOutline from "@/assets/icons/HomeOutline";
import PeopleOutline from "@/assets/icons/PeopleOutline";
import ReminderOutline from "@/assets/icons/ReminderOutline";
import SettingsOutline from "@/assets/icons/SettingsOutline";

const PURPLE = "#7C4DFF";
const INACTIVE = "#8E8E93";

/**
 * @param {{ focused: boolean, Icon: React.ComponentType<{ size: number, color: string }> }} props
 */
function TabIcon({ focused, Icon }) {
  return <Icon size={26} color={focused ? PURPLE : INACTIVE} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: PURPLE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: Platform.OS === "ios" ? -2 : 4,
          fontWeight: "600",
        },
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6,
          borderTopWidth: 0,
          backgroundColor: "#ffffff",
          elevation: 8,
        },
        // This applies a rounded purple highlight when active
        tabBarItemStyle: {
          marginHorizontal: 6,
          borderRadius: 16, // gives the shape to active background
          overflow: "hidden", // ensures the purple background clips nicely
        },
        tabBarActiveBackgroundColor: "rgba(124,77,255,0.12)",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={HomeOutline} />,
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: "People",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={PeopleOutline} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: "Reminders",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={ReminderOutline} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={SettingsOutline} />,
        }}
      />
    </Tabs>
  );
}
