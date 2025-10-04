import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const PURPLE = "#7C4DFF";

function GradientCard({ colors, title, subtitle, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.cardWrap}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.iconBadge}><Text style={{ fontSize: 22 }}>📷</Text></View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function Home() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.h1}>Welcome back! 👋</Text>
        <Text style={styles.sub}>What would you like to do today?</Text>

        <GradientCard
          colors={["#FFB679", "#FFA36E"]}
          title="Scan Face"
          subtitle="Point camera at someone to learn who they are"
          onPress={() => router.push("/people")}
        />

        <GradientCard
          colors={["#A686FF", "#6C5CE7"]}
          title="People Stored"
          subtitle="View all your recognized loved ones"
          onPress={() => router.push("/people")}
        />

        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/reminders")} style={styles.mutedCard}>
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
  container: { flex: 1, paddingTop: 8, paddingHorizontal: 20 },
  h1: { fontSize: 28, fontWeight: "800", color: "#1C1B1F", marginBottom: 8 },
  sub: { fontSize: 16, color: "#6B6B6B", marginBottom: 16 },
  cardWrap: { marginBottom: 16 },
  card: { borderRadius: 20, padding: 20, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  mutedCard: { borderRadius: 20, padding: 20, backgroundColor: "#EEE7FF", marginBottom: 16 },
  iconBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  cardTitle: { fontSize: 20, fontWeight: "800", color: "#1C1B1F" },
  cardSubtitle: { fontSize: 14, color: "#2E2E2E", opacity: 0.85, marginTop: 6, lineHeight: 20 },
});
