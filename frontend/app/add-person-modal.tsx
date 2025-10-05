import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../services/api';

const PURPLE = "#7C4DFF";

export default function AddPersonModal() {
  const params = useLocalSearchParams();
  const isEditMode = params.editMode === 'true';
  const [name, setName] = useState(params.name as string || '');
  const [role, setRole] = useState(params.relationship as string || '');
  const [age, setAge] = useState(params.age as string || '');
  const [notes, setNotes] = useState(params.notes as string || '');
  const [capturedImage, setCapturedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // If image was passed from camera, use it
  React.useEffect(() => {
    if (params.imageBase64) {
      setCapturedImage({
        uri: `data:image/jpeg;base64,${params.imageBase64}`,
        base64: params.imageBase64 as string
      } as any);
    }
  }, [params.imageBase64]);

  const handleTakePhoto = async () => {
    try {
      setIsLoading(true);
      
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio for face photos
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate form
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!role) {
      Alert.alert('Error', 'Please enter a relationship');
      return;
    }
    if (!isEditMode && (!capturedImage || !capturedImage.base64)) {
      Alert.alert('Error', 'Please take a photo');
      return;
    }

    setIsLoading(true);
    
    try {
      let result;
      if (isEditMode) {
        result = await api.editPerson(
          params.personId as string,
          name.trim(),
          role.trim(),
          age ? parseInt(age) : null,
          notes.trim()
        );
      } else {
        result = await api.addPerson(
          capturedImage!.base64!,
          name.trim(),
          role.trim(),
          age ? parseInt(age) : null,
          notes.trim()
        );
      }
      
      if (result.success) {
        Alert.alert(
          'Success!', 
          isEditMode ? 
            `${name}'s information has been updated!` :
            `${name} has been added successfully!`,
          [
            {
              text: 'View People',
              onPress: () => {
                router.dismiss();
                router.push('/(tabs)/people');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.error || `Failed to ${isEditMode ? 'update' : 'add'} person`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'add'} person. Please try again.`);
    } finally {
      setIsLoading(false);
    }
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
          <Text style={styles.title}>{isEditMode ? 'Edit Person' : 'Add New Person'}</Text>
          <View style={styles.placeholder} />
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
        {/* Camera Section - Hide in edit mode */}
        {!isEditMode && (
        <View style={styles.cameraSection}>
          <Text style={styles.sectionTitle}>Take Photo</Text>
          {capturedImage ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: capturedImage.uri }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.retakeButton}
                onPress={() => setCapturedImage(null)}
              >
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={handleTakePhoto}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={styles.cameraButtonIcon}>📷</Text>
                  <Text style={styles.cameraButtonText}>Open Camera</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        )}

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Person Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter person's name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Relationship</Text>
            <TextInput
              style={styles.input}
              value={role}
              onChangeText={setRole}
              placeholder="e.g., Daughter, Son, Friend, Caregiver"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age (Optional)</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Enter age"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any important details or memories"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[
                styles.submitButton,
                (!name.trim() || !role || (!isEditMode && !capturedImage) || isLoading) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!name.trim() || !role || (!isEditMode && !capturedImage) || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>{isEditMode ? 'Update Person' : 'Add Person'}</Text>
              )}
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

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  button: {
    backgroundColor: PURPLE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C1B1F',
    marginBottom: 12,
  },
  cameraButton: {
    height: 120,
    backgroundColor: '#E9E0FF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PURPLE,
    borderStyle: 'dashed',
  },
  cameraButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cameraButtonText: {
    fontSize: 16,
    color: PURPLE,
    fontWeight: '600',
  },
  imagePreview: {
    height: 200,
    backgroundColor: '#E9E0FF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PURPLE,
    borderStyle: 'dashed',
  },
  previewImage: {
    width: 150,
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
  },
  retakeButton: {
    backgroundColor: PURPLE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retakeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
