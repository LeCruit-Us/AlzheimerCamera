import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

function GradientCard({ colors, title, subtitle, onPress, icon }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.cardWrap, styles.blockShadow]}>
      <LinearGradient colors={colors} start={{ x:0, y:0 }} end={{ x:1, y:1 }} style={styles.card}>
        <View style={styles.iconBadge}><Text style={{ fontSize: 22 }}>{icon}</Text></View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function Home() {
  const router = useRouter();

  const goToPeopleTab = () => {
    // change this path if your tabs group is named differently
    router.replace("/(tabs)/people"); 
    // If your People route is just /people at the root of tabs, use:
    // router.replace("/people");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.h1}>Remember Me</Text>
        <Text style={styles.sub}>What would you like to do today?</Text>

        <GradientCard
          colors={["#FFB679", "#FFA36E"]}
          title="Memories"
          subtitle="View all your recognized loved ones"
          onPress={goToPeopleTab}
          icon="👫"
        />

        <GradientCard
          colors={["#A686FF", "#6C5CE7"]}
          title="Scan Face"
          subtitle="Point camera at someone to learn who they are"
          onPress={goToPeopleTab}
          icon="📷"
        />

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.replace("/(tabs)/reminders")}
          style={[styles.mutedCard, styles.blockShadow]}
        >
          <View style={[styles.iconBadge, { backgroundColor: "rgba(124,77,255,0.12)" }]}>
            <Text style={{ fontSize: 22 }}>⏰</Text>
          </View>
          <Text style={styles.cardTitle}>Reminders</Text>
          <Text style={styles.cardSubtitle}>Important tasks and medication times</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF7FF" },
  container: { flex: 1, paddingTop: 8, paddingHorizontal: 20, paddingBottom: 28 },
  h1: { fontSize: 28, fontWeight: "800", color: "#1C1B1F", marginBottom: 8 },
  sub: { fontSize: 16, color: "#6B6B6B", marginBottom: 20 },
  cardWrap: { marginBottom: 24, borderRadius: 22 },
  blockShadow: Platform.select({
    ios: { shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 12 } },
    android: { elevation: 10 },
  }),
  card: { borderRadius: 22, padding: 22, overflow: "hidden" },
  mutedCard: { borderRadius: 22, padding: 22, backgroundColor: "#CFE3FA", marginBottom: 24 },
  iconBadge: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
    ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 3 } }),
  },
  cardTitle: { fontSize: 20, fontWeight: "800", color: "#1C1B1F" },
  cardSubtitle: { fontSize: 14, color: "#2E2E2E", opacity: 0.85, marginTop: 6, lineHeight: 20 },
});
