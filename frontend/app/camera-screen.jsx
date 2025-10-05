import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../services/api';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef(null);
  const router = useRouter();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !loading) {
      setLoading(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.8,
        });

        // Recognize person using backend
        const result = await api.recognizePerson(photo.base64);
        
        if (result.matched) {
          // Person recognized - show AI note
          Alert.alert(
            'Person Recognized!',
            result.note,
            [
              { text: 'OK', onPress: () => router.back() }
            ]
          );
        } else {
          // Person not recognized - offer to add them
          Alert.alert(
            'Person Not Recognized',
            'Would you like to add this person?',
            [
              { text: 'Cancel', onPress: () => router.back() },
              { 
                text: 'Add Person', 
                onPress: () => router.push({
                  pathname: '/add-person-modal',
                  params: { imageBase64: photo.base64 }
                })
              }
            ]
          );
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to process image');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          
          <Text style={styles.instruction}>Point camera at a person's face</Text>
          
          <View style={styles.bottomControls}>
            {loading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'transparent' },
  backButton: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  backText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  instruction: { 
    position: 'absolute', 
    top: 100, 
    left: 0, 
    right: 0, 
    textAlign: 'center', 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600' 
  },
  bottomControls: { 
    position: 'absolute', 
    bottom: 50, 
    left: 0, 
    right: 0, 
    alignItems: 'center' 
  },
  captureButton: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  captureInner: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#fff' 
  },
  message: { textAlign: 'center', paddingBottom: 10 },
  button: { 
    backgroundColor: '#7C4DFF', 
    padding: 15, 
    borderRadius: 10, 
    margin: 20 
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' }
});