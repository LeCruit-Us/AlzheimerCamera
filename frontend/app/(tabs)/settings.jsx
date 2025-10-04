import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  const [voiceOn, setVoiceOn] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.h1}>Settings</Text>
        <Text style={styles.sub}>Customize your experience</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voice & Sound</Text>
          <View style={styles.tile}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tileTitle}>Enable Voice Output</Text>
              <Text style={styles.tileSub}>Speak names aloud when scanning</Text>
            </View>
            <Switch value={voiceOn} onValueChange={setVoiceOn} trackColor={{ false: "#D6D6D6", true: "#CDBAFD" }} thumbColor={voiceOn ? "#7C4DFF" : "#f4f3f4"} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device Connection</Text>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Connect Glasses Camera</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.tile}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tileTitle}>User ID</Text>
              <Text style={styles.tileSub}>USER-2024-ABC123</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF7FF" },
  container: { flex: 1, paddingTop: 8, paddingHorizontal: 20 },
  h1: { fontSize: 28, fontWeight: "800", color: "#1C1B1F" },
  sub: { color: "#6B6B6B", marginTop: 6, marginBottom: 12, fontSize: 16 },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#5C49C9", marginBottom: 8 },
  tile: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  tileTitle: { fontSize: 16, fontWeight: "800", color: "#1C1B1F" },
  tileSub: { fontSize: 14, color: "#6B6B6B", marginTop: 4 },
  button: { backgroundColor: "#EEE7FF", padding: 14, borderRadius: 14, alignItems: "center" },
  buttonText: { color: "#5C49C9", fontWeight: "800", fontSize: 16 },
});
