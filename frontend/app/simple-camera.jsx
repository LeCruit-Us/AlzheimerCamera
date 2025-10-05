import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { api } from '../services/api';

export default function SimpleCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [lastResult, setLastResult] = useState('');
  const cameraRef = useRef(null);
  const router = useRouter();
  const scanInterval = useRef(null);
  
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanInterval.current) {
        clearInterval(scanInterval.current);
      }
    };
  }, []);
  
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

  const startScanning = () => {
    setScanning(true);
    scanInterval.current = setInterval(async () => {
      if (cameraRef.current) {
        try {
          console.log('Taking photo...');
          const photo = await cameraRef.current.takePictureAsync({
            base64: true,
            quality: 0.5,
          });
          console.log('Photo taken, calling API...');

          // Recognize person using backend
          const result = await api.recognizePerson(photo.base64);
          console.log('API result:', result);
          
          if (result.matched) {
            console.log('Match found!', result);
            const message = `Found: ${result.person?.name || 'Unknown'}`;
            const note = result.note || 'No additional information';
            setLastResult(`✅ ${message}\n${note}`);
            
            // Stop scanning when match is found
            stopScanning();
            
            // Browser notification
            if ('Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('Person Recognized!', {
                  body: `${message}\n${note}`,
                  icon: '/favicon.ico'
                });
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                    new Notification('Person Recognized!', {
                      body: `${message}\n${note}`,
                      icon: '/favicon.ico'
                    });
                  }
                });
              }
            }
            
            // Fallback: Browser alert
            setTimeout(() => {
              window.alert(`Person Recognized!\n\n${message}\n\n${note}`);
            }, 100);
            
            console.log('RECOGNITION SUCCESS:', message, note);
          } else {
            console.log('No match found', result);
            setLastResult('❌ No person recognized');
          }
        } catch (error) {
          console.error('Scanning error:', error);
          setLastResult(`Error: ${error.message}`);
        }
      }
    }, 2000); // Scan every 2 seconds
  };

  const stopScanning = () => {
    setScanning(false);
    if (scanInterval.current) {
      clearInterval(scanInterval.current);
      scanInterval.current = null;
    }
    setLastResult('');
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
            
            <Text style={styles.instruction}>Point camera at a person's face and tap START SCAN</Text>
            
            {/* Zoom Level Indicator */}
            {zoom > 0.05 && (
              <View style={styles.zoomIndicator}>
                <Text style={styles.zoomText}>{(1 + zoom * 9).toFixed(1)}x</Text>
              </View>
            )}
            
            {/* Scan Results */}
            {lastResult && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultText}>{lastResult}</Text>
              </View>
            )}
            
            {/* Web-compatible result display */}
            {lastResult && (
              <View style={styles.webResultContainer}>
                <Text style={styles.webResultText}>{lastResult}</Text>
              </View>
            )}
            
            <View style={styles.bottomControls}>
              {scanning ? (
                <TouchableOpacity style={[styles.scanButton, styles.stopButton]} onPress={stopScanning}>
                  <View style={styles.scanInner}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.scanText}>STOP</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.scanButton} onPress={startScanning}>
                  <View style={styles.scanInner}>
                    <Text style={styles.scanText}>START SCAN</Text>
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
  resultContainer: {
    position: 'absolute',
    top: 250,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#7C4DFF'
  },
  resultText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 24
  },
  stopButton: {
    backgroundColor: 'rgba(255,77,77,0.8)'
  },
  webResultContainer: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 3,
    borderColor: '#00FF00',
    zIndex: 1000,
    maxWidth: '80%'
  },
  webResultText: {
    color: '#00FF00',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 28
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});