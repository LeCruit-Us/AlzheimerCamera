import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { api } from '../services/api';

export default function SimpleCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(0);
  const cameraRef = useRef(null);
  const router = useRouter();
  
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  
  const updateZoom = (newZoom) => {
    const clampedZoom = Math.max(0, Math.min(1, newZoom));
    setZoom(clampedZoom);
  };
  
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
      const newZoom = (scale.value - 1) * 0.5; // Convert scale to zoom (0-1)
      runOnJS(updateZoom)(newZoom);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Camera Permission</Text>
          <Text style={styles.subtitle}>We need camera access to scan faces</Text>
          <TouchableOpacity onPress={requestPermission} style={styles.button}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.backButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const scanFace = async () => {
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
            'Person Not Found',
            'This person is not in your database. Would you like to add them?',
            [
              { text: 'Cancel', style: 'cancel' },
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
        Alert.alert('Error', 'Failed to scan face. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GestureDetector gesture={pinchGesture}>
        <CameraView 
          style={styles.camera} 
          ref={cameraRef}
          zoom={zoom}
        >
          <View style={styles.overlay}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            
            <Text style={styles.instruction}>Point camera at a person's face and tap to scan</Text>
            
            {/* Zoom Level Indicator */}
            {zoom > 0.05 && (
              <View style={styles.zoomIndicator}>
                <Text style={styles.zoomText}>{(1 + zoom * 9).toFixed(1)}x</Text>
              </View>
            )}
            
            <View style={styles.bottomControls}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Scanning...</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.scanButton} onPress={scanFace}>
                  <View style={styles.scanInner}>
                    <Text style={styles.scanText}>SCAN</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </CameraView>
      </GestureDetector>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'transparent' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30, textAlign: 'center' },
  button: { 
    backgroundColor: '#7C4DFF', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center'
  },
  backButton: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  backText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  instruction: { 
    position: 'absolute', 
    top: 120, 
    left: 20, 
    right: 20, 
    textAlign: 'center', 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    borderRadius: 10
  },
  zoomIndicator: {
    position: 'absolute',
    top: 200,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8
  },
  zoomText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  bottomControls: { 
    position: 'absolute', 
    bottom: 80, 
    left: 0, 
    right: 0, 
    alignItems: 'center' 
  },
  scanButton: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: 'rgba(124,77,255,0.8)', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff'
  },
  scanInner: { 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  loadingContainer: {
    alignItems: 'center'
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '600'
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});