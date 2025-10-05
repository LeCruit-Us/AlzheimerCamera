import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, FlatList, RefreshControl, Vibration } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  getReminders as getStoredReminders,
  subscribe as subscribeToReminders,
  updateReminder as updateStoredReminder,
  deleteReminder as deleteStoredReminder,
  normalizeTimeString,
} from "../../state/remindersStore";

function ReminderCard({ id, title, time, description, value, onValueChange, onDelete, onEdit, onBellPress }) {
  const handleDelete = () => {
    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete(id)
        }
      ]
    );
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.bell} onPress={onBellPress} activeOpacity={0.7}>
        <Text style={{ fontSize: 22 }}>🔔</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
      <View style={styles.side}>
        <Switch value={value} onValueChange={onValueChange} trackColor={{ false: "#D6D6D6", true: "#CDBAFD" }} thumbColor={value ? "#7C4DFF" : "#f4f3f4"} />
        <View style={styles.buttons}>
          <TouchableOpacity onPress={() => onEdit(id, title, time, description)} style={styles.editBtn}><Text style={{ fontSize: 14 }}>✏️</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.trash}><Text style={{ fontSize: 14 }}>🗑️</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function Reminders() {
  const router = useRouter();
  const [reminders, setReminders] = useState(getStoredReminders());
  const [refreshing, setRefreshing] = useState(false);
  const remindersRef = useRef(reminders);
  const triggeredRef = useRef({ date: new Date().toDateString(), ids: new Set() });

  useEffect(() => {
    const unsubscribe = subscribeToReminders(setReminders);
    return unsubscribe;
  }, []);

  useEffect(() => {
    remindersRef.current = reminders;
  }, [reminders]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const currentDate = now.toDateString();

      if (triggeredRef.current.date !== currentDate) {
        triggeredRef.current = { date: currentDate, ids: new Set() };
      }

      remindersRef.current.forEach((reminder) => {
        if (!reminder.enabled) return;
        const { time24 } = normalizeTimeString(reminder.time24 || reminder.time);
        if (time24 !== currentTime) return;

        if (triggeredRef.current.ids.has(reminder.id)) return;
        triggeredRef.current.ids.add(reminder.id);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Vibration.vibrate(600);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleToggle = (id, value) => {
    updateStoredReminder(id, { enabled: value }).catch(() => {});
  };

  const handleDelete = (id) => {
    deleteStoredReminder(id).catch(() => {});
    Alert.alert('Success', 'Reminder deleted');
  };

  const handleEdit = (id, title, time, description) => {
    router.push({
      pathname: '/edit-reminder-modal',
      params: { id, title, time, description }
    });
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setReminders(getStoredReminders());
    setRefreshing(false);
  }, []);

  const renderReminder = ({ item }) => (
    <ReminderCard
      id={item.id}
      title={item.title}
      time={item.time}
      description={item.description}
      value={item.enabled}
      onValueChange={(value) => handleToggle(item.id, value)}
      onDelete={handleDelete}
      onEdit={handleEdit}
      onBellPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        Vibration.vibrate(400);
      }}
    />
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.h1}>Reminders</Text>
        <Text style={styles.sub}>{reminders.length} reminders set</Text>

        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id}
          renderItem={renderReminder}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ paddingBottom: 110, paddingTop: 6 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#7C4DFF"
            />
          }
        />

        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push({
            pathname: '/edit-reminder-modal',
            params: { title: '', time: '', description: '' }
          })}
        >
          <Text style={styles.fabPlus}>＋</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF7FF" },
  container: { flex: 1, paddingTop: 8, paddingHorizontal: 20 },
  h1: { fontSize: 28, fontWeight: "800", color: "#1C1B1F" },
  sub: { color: "#6B6B6B", marginTop: 6, marginBottom: 12, fontSize: 16 },
  card: { flexDirection: "row", padding: 16, borderRadius: 18, backgroundColor: "#FFF", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  bell: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#E9E0FF", alignItems: "center", justifyContent: "center", marginRight: 12 },
  title: { fontSize: 18, fontWeight: "800", color: "#1C1B1F" },
  time: { fontSize: 16, color: "#5C49C9", marginTop: 4, fontWeight: "700" },
  desc: { fontSize: 14, color: "#6B6B6B", marginTop: 6, lineHeight: 20 },
  side: { alignItems: "center", justifyContent: "space-between", height: 64, marginLeft: 10 },
  buttons: { flexDirection: "row", marginTop: 8 },
  editBtn: { marginRight: 8 },
  trash: {},
  fab: { position: "absolute", right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#7C4DFF", alignItems: "center", justifyContent: "center", elevation: 5 },
  fabPlus: { color: "#FFF", fontSize: 28, lineHeight: 28, fontWeight: "800" },
});
