import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import {
  addReminder as addStoredReminder,
  updateReminder as updateStoredReminder,
} from '../state/remindersStore';

const PURPLE = "#7C4DFF";

export default function EditReminderModal() {
  const params = useLocalSearchParams();
  const isEditMode = params.id !== undefined;
  const [title, setTitle] = useState(params.title as string || '');
  const [time, setTime] = useState(params.time as string || '');
  const [description, setDescription] = useState(params.description as string || '');

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!time.trim()) {
      Alert.alert('Error', 'Please enter a time');
      return;
    }
    const timeValue = time.trim();
    const isValidTime = /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeValue);
    if (!isValidTime) {
      Alert.alert('Error', 'Time must be in HH:MM (24-hour) format.');
      return;
    }

    const reminderPayload = {
      title: title.trim(),
      time: timeValue,
      description: description.trim(),
    };

    if (isEditMode) {
      updateStoredReminder(params.id as string, reminderPayload);
    } else {
      addStoredReminder({
        id: Date.now().toString(),
        enabled: true,
        ...reminderPayload,
      });
    }

    const message = isEditMode ? 'Reminder updated successfully' : 'Reminder added successfully';
    Alert.alert('Success', message, [
      { text: 'OK', onPress: () => router.dismiss() }
    ]);
  };


  const handleCancel = () => {
    router.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isEditMode ? 'Edit Reminder' : 'Add Reminder'}</Text>
          <View style={styles.placeholder} />
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter reminder title"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Time</Text>
                <TextInput
                  style={styles.input}
                  value={time}
                  onChangeText={setTime}
                  placeholder="e.g., 08:00"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Enter description"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.submitButton,
                (!title.trim() || !time.trim()) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!title.trim() || !time.trim()}
            >
              <Text style={styles.submitButtonText}>{isEditMode ? 'Update Reminder' : 'Add Reminder'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7FF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: PURPLE,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1B1F',
  },
  placeholder: {
    width: 60,
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: PURPLE,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#D0D0D0',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
});
