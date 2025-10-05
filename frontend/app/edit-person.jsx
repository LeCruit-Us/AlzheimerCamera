// app/edit-person.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";

export default function EditPerson() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const personId = params.personId;
  // If these are passed from the previous screen, we’ll use them.
  // Otherwise we will fetch via fetchPersonDetail(personId)
  const passedName = params.name || "";
  const passedRelationship = params.relationship || "";
  const passedAge = params.age || "";
  const passedNotes = params.notes || "";

  // Form state
  const [name, setName] = useState(passedName);
  const [relationship, setRelationship] = useState(passedRelationship);
  const [age, setAge] = useState(String(passedAge || ""));
  const [notes, setNotes] = useState(passedNotes);
  const [images, setImages] = useState([]); // array of { uri }
  const [loading, setLoading] = useState(false);
  const [hydrating, setHydrating] = useState(false);

  // If fields weren’t provided, fetch them (stub below)
  useEffect(() => {
    const needsFetch =
      !passedName && !passedRelationship && !passedAge && !passedNotes && personId;
    if (!needsFetch) return;

    (async () => {
      try {
        setHydrating(true);
        const info = await fetchPersonDetail(personId);
        if (info) {
          setName(info.name ?? "");
          setRelationship(info.relationship ?? "");
          setAge(info.age != null ? String(info.age) : "");
          setNotes(info.notes ?? "");
        }
      } catch (e) {
        console.warn("load person info error", e);
      } finally {
        setHydrating(false);
      }
    })();
  }, [personId]);

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert("Permission required", "We need access to your photos to upload memories.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,       // iOS 14+ (Android usually single)
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      selectionLimit: 0,                   // 0 => unlimited (iOS)
    });

    if (!res.canceled) {
      const picked = res.assets?.map((a) => ({ uri: a.uri })) ?? [];
      setImages((prev) => [...prev, ...picked]);
    }
  };

  const onSave = async () => {
    try {
      setLoading(true);

      // 1) Update person info
      // await api.updatePerson({ personId, name, relationship, age: Number(age) || null, notes });

      // 2) Upload photos if any
      if (images.length) {
        const form = new FormData();
        form.append("personId", String(personId));
        images.forEach((img, idx) => {
          form.append("photos", {
            uri: img.uri,
            name: `photo_${idx}.jpg`,
            type: "image/jpeg",
          });
        });

        // Example:
        // await fetch("https://your.api/upload-photos", {
        //   method: "POST",
        //   headers: { "Content-Type": "multipart/form-data" },
        //   body: form,
        // });
      }

      Alert.alert("Saved", "Changes have been saved.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    Alert.alert(
      "Delete person",
      "This will permanently remove this person and their memories. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // await api.deletePerson(personId);
              Alert.alert("Deleted", "Person removed.", [
                { text: "OK", onPress: () => router.replace("/people") },
              ]);
            } catch (e) {
              console.error(e);
              Alert.alert("Error", "Failed to delete person.");
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Edit Person" }} />

      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
      >
        {/* Tap anywhere outside inputs to dismiss keyboard */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={styles.root}
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {hydrating ? (
              <View style={{ paddingVertical: 24 }}>
                <ActivityIndicator />
              </View>
            ) : null}

            {/* Image upload */}
            <Text style={styles.sectionTitle}>Photos</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImages}>
              <Text style={styles.uploadTxt}>+ Add photos from gallery</Text>
            </TouchableOpacity>

            {/* Preview row */}
            {images.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 10 }}
              >
                {images.map((img, idx) => (
                  <Image key={idx} source={{ uri: img.uri }} style={styles.preview} />
                ))}
              </ScrollView>
            )}

            {/* Form */}
            <Text style={styles.sectionTitle}>Information</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholder="Full name"
                returnKeyType="done"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Relationship</Text>
              <TextInput
                value={relationship}
                onChangeText={setRelationship}
                style={styles.input}
                placeholder="e.g., Son, Daughter, Friend"
                returnKeyType="done"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                style={styles.input}
                keyboardType="number-pad"
                placeholder="e.g., 72"
                returnKeyType="done"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                style={[styles.input, { height: 110, textAlignVertical: "top" }]}
                multiline
                placeholder="Helpful details or reminders…"
                returnKeyType="default"
              />
            </View>

            {/* Save */}
            <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={loading}>
              <Text style={styles.saveTxt}>{loading ? "Saving..." : "Save changes"}</Text>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} disabled={loading}>
              <Text style={styles.deleteTxt}>Delete person</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </>
  );
}

/* ---------- Replace these with your real API calls ---------- */
async function fetchPersonDetail(personId) {
  // Example shape returned from your backend:
  // { name: 'Alice', relationship: 'Daughter', age: 34, notes: 'Visits on Sundays' }
  // Stubbed for now:
  await new Promise((r) => setTimeout(r, 300));
  return {
    name: "Sample Name",
    relationship: "Family",
    age: 70,
    notes: "Example notes from backend.",
  };
}
/* ----------------------------------------------------------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAF7FF", paddingHorizontal: 16, paddingTop: 12 },

  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1C1B1F", marginTop: 12, marginBottom: 8 },

  uploadBtn: {
    borderRadius: 12,
    backgroundColor: "#EEE7FF",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTxt: { color: "#4A3AFF", fontWeight: "700" },

  preview: { width: 90, height: 90, borderRadius: 8, marginRight: 8, backgroundColor: "#ddd" },

  field: { marginTop: 14 },
  label: { marginBottom: 6, color: "#5B5B5B" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#DDD",
  },

  saveBtn: {
    marginTop: 20,
    backgroundColor: "#7C4DFF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveTxt: { color: "#fff", fontWeight: "800" },

  deleteBtn: {
    marginTop: 14,
    backgroundColor: "#FFE7E7",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteTxt: { color: "#C03636", fontWeight: "800" },
});
