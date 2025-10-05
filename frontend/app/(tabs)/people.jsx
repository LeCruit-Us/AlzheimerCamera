import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { api } from "../../services/api";

function PersonRow({ item, onDelete, onEdit }) {
  const handleDelete = () => {
    Alert.alert(
      'Delete Person',
      `Are you sure you want to delete ${item.name}? This will remove them from all records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDelete(item.person_id, item.name)
        }
      ]
    );
  };

  return (
    <View style={styles.row}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.relation}>{item.relation}</Text>
      </View>
      <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(item)}>
        <Text style={{ fontSize: 16 }}>✏️</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={{ fontSize: 16 }}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function People() {
  const router = useRouter();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reload people when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadPeople();
    }, [])
  );

  const loadPeople = async () => {
    console.log('Loading people from backend...');
    try {
      const response = await api.getReminders();
      console.log('Backend response:', response);
      if (response.reminders) {
        const formattedPeople = response.reminders.map((person, index) => ({
          id: index.toString(),
          person_id: person.person_id,
          name: person.name,
          relation: person.relationship,
          age: person.age,
          notes: person.notes,
          avatar: person.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=7C4DFF&color=fff&size=200`
        }));
        console.log('Formatted people:', formattedPeople);
        setPeople(formattedPeople);
      }
    } catch (error) {
      console.error('Error loading people:', error);
      Alert.alert('Error', 'Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePerson = async (personId, personName) => {
    try {
      const result = await api.deletePerson(personId);
      if (result.success) {
        Alert.alert('Success', `${personName} has been deleted`);
        loadPeople();
      } else {
        Alert.alert('Error', result.error || 'Failed to delete person');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete person');
    }
  };

  const handleEditPerson = (person) => {
    router.push({
      pathname: '/add-person-modal',
      params: { 
        editMode: 'true',
        personId: person.person_id,
        name: person.name,
        relationship: person.relation,
        age: person.age || '',
        notes: person.notes || ''
      }
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <Text style={styles.h1}>People Stored</Text>
        <Text style={styles.sub}>{people.length} people recognized</Text>

        <FlatList
          style={{ marginTop: 12 }}
          data={people}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <PersonRow item={item} onDelete={handleDeletePerson} onEdit={handleEditPerson} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshing={loading}
          onRefresh={loadPeople}
        />

        <TouchableOpacity 
          style={styles.fab}
          onPress={() => router.push('/add-person-modal')}
        >
          <Text style={styles.fabPlus}>＋</Text>
        </TouchableOpacity>
        
        {/* Debug button */}
        <TouchableOpacity 
          style={[styles.fab, { right: 90, backgroundColor: '#FF6B6B' }]}
          onPress={loadPeople}
        >
          <Text style={styles.fabPlus}>↻</Text>
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
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 18, padding: 14, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  avatar: { width: 56, height: 56, borderRadius: 14, marginRight: 12 },
  name: { fontSize: 18, fontWeight: "800", color: "#1C1B1F" },
  relation: { fontSize: 14, color: "#6B6B6B", marginTop: 2 },
  editBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#E7F3FF", marginRight: 8 },
  deleteBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#FFE7E7" },
  fab: { position: "absolute", right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: "#7C4DFF", alignItems: "center", justifyContent: "center", elevation: 5 },
  fabPlus: { color: "#FFF", fontSize: 28, lineHeight: 28, fontWeight: "800" },
});
