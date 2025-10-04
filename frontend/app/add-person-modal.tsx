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
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

const PURPLE = "#7C4DFF";

export default function AddPersonModal() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [capturedImage, setCapturedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      Alert.alert('Error', 'Please select a role');
      return;
    }
    if (!capturedImage) {
      Alert.alert('Error', 'Please take a photo');
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Implement API call here
      // const response = await fetch('/api/people', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name: name.trim(),
      //     role,
      //     faceImage: capturedImage.base64
      //   })
      // });

      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Success', 
        `${name} has been added successfully!`,
        [
          {
            text: 'OK',
            onPress: () => router.dismiss()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add person. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add New Person</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Camera Section */}
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
        </View>

        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (!name.trim() || !role || !capturedImage || isLoading) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!name.trim() || !role || !capturedImage || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Add Person</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7FF',
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
  content: {
    flex: 1,
    padding: 20,
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
  submitButton: {
    backgroundColor: PURPLE,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
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
