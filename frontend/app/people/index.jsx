import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "../../services/api";

const BG = "#F6F2FF";            // soft lilac
const CARD = "#FFFFFF";          // card surface
const PURPLE = "#7C4DFF";        // brand purple
const LILAC = "#EEE7FF";         // light purple surface
const TEXT_PRIMARY = "#161618";
const TEXT_SECOND = "#6B6B6B";

function PersonRow({ item, onOpen }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onOpen(item)} style={styles.rowWrap}>
      {/* Gradient ring */}
      <LinearGradient
        colors={["#BBA7FF", "#8AC5FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ring}
      >
        {/* Inner card */}
        <View style={styles.rowCard}>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />

          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.relation} numberOfLines={1}>
              {item.relation || "—"}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function People() {
  const router = useRouter();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadPeople();
    }, [])
  );

  const loadPeople = async () => {
    try {
      const response = await api.getReminders();
      if (response?.reminders) {
        const formatted = response.reminders.map((p, i) => ({
          id: String(i),
          person_id: p.person_id,
          name: p.name,
          relation: p.relationship,
          age: p.age,
          notes: p.notes,
          avatar:
            p.image_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=7C4DFF&color=fff&size=200`,
        }));
        setPeople(formatted);
      }
    } catch {
      Alert.alert("Error", "Failed to load people");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPerson = (person) => {
    router.push({
      pathname: "/memories/[personId]",
      params: {
        personId: person.person_id,
        name: person.name,
        relationship: person.relation ?? "",
        age: person.age ?? "",
        notes: person.notes ?? "",
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.h1}>People Stored 1 1</Text>
        <Text style={styles.sub}>
          <Text style={{ fontWeight: "800", color: TEXT_PRIMARY }}>{people.length}</Text>{" "}
          people recognized
        </Text>

        {/* List */}
        <FlatList
          style={{ marginTop: 6 }}
          data={people}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <PersonRow
              item={item}
              onOpen={handleOpenPerson}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 110, paddingTop: 6 }}
          refreshing={loading}
          onRefresh={loadPeople}
        />

        {/* FABs */}
        <TouchableOpacity style={[styles.fab, styles.addFab]} onPress={() => router.push("/add-person-modal")}>
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.fab, styles.refreshFab]} onPress={loadPeople}>
          <Text style={styles.fabText}>↻</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, paddingHorizontal: 20 },

  h1: {
    fontSize: 34,
    fontWeight: "900",
    color: TEXT_PRIMARY,
    marginTop: 8,
  },
  sub: {
    color: TEXT_SECOND,
    marginTop: 6,
    marginBottom: 10,
    fontSize: 17,
  },

  // Row card with gradient ring + soft shadow
  rowWrap: { marginVertical: 8 },
  ring: {
    borderRadius: 22,
    padding: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 5 },
    }),
  },
  rowCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 16,
    marginRight: 14,
    backgroundColor: LILAC,
  },
  name: { fontSize: 22, fontWeight: "900", color: TEXT_PRIMARY },
  relation: { fontSize: 16, color: TEXT_SECOND, marginTop: 2 },

  separator: { height: 12, backgroundColor: "transparent" },

  // FABs
  fab: {
    position: "absolute",
    bottom: 26,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 8 },
    }),
  },
  addFab: { right: 20, backgroundColor: PURPLE },
  refreshFab: { right: 100, backgroundColor: "#FF7066" },
  fabText: { color: "#fff", fontSize: 28, fontWeight: "900", lineHeight: 28 },
});
