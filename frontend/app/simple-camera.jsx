import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { api } from '../services/api';

export default function SimpleCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [lastResult, setLastResult] = useState('');
  const cameraRef = useRef(null);
  const router = useRouter();
  const scanInterval = useRef(null);
  const pendingAudio = useRef(null);
  const audioTimeout = useRef(null);
  
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  
  // Initialize audio and cleanup on unmount
  useEffect(() => {
    // Initialize audio session
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    }).catch(console.error);
    
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
            
            // IMMEDIATELY stop scanning on first match
            if (scanInterval.current) {
              clearInterval(scanInterval.current);
              scanInterval.current = null;
              setScanning(false);
            }
            
            const message = `Found: ${result.person?.name || 'Unknown'}`;
            const note = result.note || 'No additional information';
            setLastResult(`✅ ${message}\n${note}`);
            
            console.log('RECOGNITION SUCCESS:', message, note);
            console.log('Audio in response:', !!result.audio, result.audio ? result.audio.length : 0);
            
            // Play audio if available
            if (result.audio) {
              console.log('🔊 ATTEMPTING TO PLAY AUDIO');
              Vibration.vibrate([0, 200, 100, 200]); // Vibrate to indicate audio
              playAudioSequence(result.audio, result.notes, result.person?.name);
            } else {
              console.log('❌ NO AUDIO IN RESPONSE');
              console.log('Full result:', JSON.stringify(result, null, 2));
            }
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

  const playAudioSequence = async (initialAudio, notes, personName) => {
    try {
      // Play initial announcement
      await playAudio(initialAudio);
      
      // Wait 2 seconds, then play "Do you remember this person?"
      setTimeout(async () => {
        try {
          const response1 = await fetch('http://localhost:8000/generate-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: 'Do you remember this person?' })
          });
          const result1 = await response1.json();
          if (result1.audio) {
            await playAudio(result1.audio);
            
            // Wait 3 seconds, then play notes if available
            setTimeout(async () => {
              try {
                if (notes && notes.trim()) {
                  const response2 = await fetch('http://localhost:8000/generate-audio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: notes })
                  });
                  const result2 = await response2.json();
                  if (result2.audio) {
                    await playAudio(result2.audio);
                  }
                  
                  // Wait 1 second after notes, then play final message
                  setTimeout(async () => {
                    try {
                      const finalMessage = personName ? 
                        `Open the Remember Me app, click on memories, then click on ${personName} to see more of your memories with them.` :
                        'Open the Remember Me app, click on memories, then click on the person to see more of your memories with them.';
                      const response3 = await fetch('http://localhost:8000/generate-audio', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: finalMessage })
                      });
                      const result3 = await response3.json();
                      if (result3.audio) {
                        await playAudio(result3.audio);
                      }
                    } catch (error) {
                      console.error('Failed to play final message:', error);
                    }
                  }, 1000);
                } else {
                  // No notes, play final message directly
                  const finalMessage = personName ? 
                    `Open the Remember Me app, click on memories, then click on ${personName} to see more of your memories with them.` :
                    'Open the Remember Me app, click on memories, then click on the person to see more of your memories with them.';
                  const response3 = await fetch('http://localhost:8000/generate-audio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: finalMessage })
                  });
                  const result3 = await response3.json();
                  if (result3.audio) {
                    await playAudio(result3.audio);
                  }
                }
              } catch (error) {
                console.error('Failed to play notes or final message:', error);
              }
            }, 3000);
          }
        } catch (error) {
          console.error('Failed to play question:', error);
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to start audio sequence:', error);
    }
  };

  const playAudio = async (audioBase64) => {
    try {
      console.log('🔊 Starting audio playback...');
      console.log('Audio data length:', audioBase64.length);
      
      if (!audioBase64 || audioBase64.length === 0) {
        throw new Error('No audio data provided');
      }
      
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // Create data URI for direct playback
      const audioUri = `data:audio/mp3;base64,${audioBase64}`;
      
      console.log('Creating sound from data URI...');
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { 
          shouldPlay: true,
          volume: 1.0,
          rate: 1.0,
          shouldCorrectPitch: true
        }
      );
      
      console.log('Sound created and playing...');
      
      // Set up status listener
      sound.setOnPlaybackStatusUpdate((status) => {
        console.log('Playback status:', {
          isLoaded: status.isLoaded,
          isPlaying: status.isPlaying,
          didJustFinish: status.didJustFinish,
          error: status.error
        });
        if (status.didJustFinish) {
          console.log('Audio finished, cleaning up...');
          sound.unloadAsync();
        }
        if (status.error) {
          console.error('Audio playback error:', status.error);
        }
      });
      
      console.log('✅ Audio playback initiated!');
      
    } catch (error) {
      console.error('❌ Audio playback failed:', error);
      console.error('Error details:', error.message);
      
      // Fallback: Try file-based approach
      try {
        console.log('Trying file-based fallback...');
        const timestamp = Date.now();
        const audioUri = `${FileSystem.documentDirectory}audio_${timestamp}.mp3`;
        
        await FileSystem.writeAsStringAsync(audioUri, audioBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true, volume: 1.0 }
        );
        
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            sound.unloadAsync();
            FileSystem.deleteAsync(audioUri, { idempotent: true });
          }
        });
        
        console.log('✅ Fallback audio playback started!');
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
    }
  };

  const stopScanning = () => {
    setScanning(false);
    if (scanInterval.current) {
      clearInterval(scanInterval.current);
      scanInterval.current = null;
    }
    if (audioTimeout.current) {
      clearTimeout(audioTimeout.current);
      audioTimeout.current = null;
    }
    setLastResult('');
    pendingAudio.current = null;
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
              
              {/* Test Audio Button */}
              <TouchableOpacity 
                style={styles.testButton} 
                onPress={async () => {
                  console.log('Testing audio sequence...');
                  try {
                    const response = await fetch('http://localhost:8000/test-tts');
                    const result = await response.json();
                    if (result.audio) {
                      console.log('Got test audio, playing sequence...');
                      playAudioSequence(result.audio, 'Test notes', 'John Smith');
                    } else {
                      console.log('No audio in test response');
                    }
                  } catch (error) {
                    console.error('Test audio failed:', error);
                  }
                }}
              >
                <Text style={styles.testText}>TEST AUDIO</Text>
              </TouchableOpacity>
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
  
  testButton: {
    marginTop: 20,
    backgroundColor: 'rgba(0,255,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff'
  },
  
  testText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },

  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});