import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { Camera, useCameraDevices, useCameraFormat, VideoFile } from 'react-native-vision-camera';
import { Icon } from 'react-native-elements';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import RNFS from 'react-native-fs';
import { getAuth } from '@react-native-firebase/auth';
import { storage } from '../../config/firebaseConfig';
import { ref, getDownloadURL } from '@react-native-firebase/storage';
import axios from 'axios';
import { styles } from '../Homescreen/homescreen.styles';
import Tts from 'react-native-tts';

// Define the type for the navigation stack
type RootStackParamList = {
  Signup: undefined;
  OTP: undefined;
  Home: undefined;
  Login: undefined;
  Dashboard: { videoPaths?: string[] };
};

// Define the navigation prop type
type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Utility to convert base64 to Uint8Array
const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const HomeScreen = ({ navigation }: Props) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [permissionAsked, setPermissionAsked] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const [torch, setTorch] = useState<'on' | 'off'>('off');
  const [videoPaths, setVideoPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [responseData, setResponseData] = useState<{ commands: string[]; audioUrl: string | null } | null>(null);
  const [isSendingFrame, setIsSendingFrame] = useState<boolean>(false);

  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === cameraPosition);
  const format = useCameraFormat(device, [{ videoResolution: { width: 640, height: 360 } }]);

  const BACKEND_URL = 'http://192.168.29.145:5001/process_frame';
  const FRAME_SEND_INTERVAL = 2000;

  // Initialize TTS settings
  useEffect(() => {
    Tts.setDefaultLanguage('en');
    if (Platform.OS === 'ios') {
      Tts.setIgnoreSilentSwitch('ignore'); // Ensure audio plays even on silent mode
    }
  }, []);

  // Handle real-time audio playback for commands
  useEffect(() => {
    if (responseData && responseData.commands.length > 0) {
      Tts.stop(); // Stop any ongoing speech
      const textToSpeak = responseData.commands.join('. ');
      Tts.speak(textToSpeak, {
        iosVoiceId: '', // Placeholder value (ignored on Android)
        rate: 1.0,     // Default speech rate
        androidParams: {
          KEY_PARAM_STREAM: 'STREAM_ALARM', // Use alarm stream for audibility
          KEY_PARAM_VOLUME: 1.0,            // Full volume
          KEY_PARAM_PAN: 0.0,               // Centered audio
        },
      });
    } else {
      Tts.stop(); // Stop speech if no commands
    }
  }, [responseData]);

  useEffect(() => {
    let isMounted = true;
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Sign-out function
  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await auth.signOut();
      Alert.alert('Success', 'You have been signed out.');
    } catch (error: any) {
      console.error('Sign-out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  // Function to capture and send a frame
  const captureAndSendFrame = async () => {
    if (!camera.current || !recording || isSendingFrame) return;

    let photoPath: string | null = null;
    setIsSendingFrame(true);

    try {
      const photo = await camera.current.takePhoto({});
      photoPath = photo.path;

      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No authentication token');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      const formData = new FormData();
      formData.append('frame', {
        uri: `file://${photo.path}`,
        type: 'image/jpeg',
        name: 'frame.jpg',
      } as any);

      const response = await axios.post(BACKEND_URL, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const newResponseData = response.data.data;
      console.log(`[${new Date().toISOString()}] Server response:`, newResponseData);

      // Only set responseData if commands are non-empty
      if (newResponseData?.commands?.length > 0) {
        setResponseData(newResponseData);
        if (newResponseData.audioUrl) {
          console.log('Audio URL received but playback disabled:', newResponseData.audioUrl);
        }
      } else {
        setResponseData(null); // Clear responseData for empty commands
      }
    } catch (error: any) {
      console.error('Error sending frame:', error);
      if (error.message === 'No authentication token') {
        Alert.alert('Error', 'Authentication failed. Please sign in again.');
      } else if (error.response) {
        Alert.alert('Error', `Server error: ${error.response.data.error?.message || 'Unknown error'}`);
      } else if (error.request) {
        Alert.alert('Error', 'Network error: Failed to connect to the server.');
      } else {
        Alert.alert('Error', `Failed to send frame: ${error.message}`);
      }
    } finally {
      if (photoPath) {
        try {
          await RNFS.unlink(photoPath);
          console.log('Cleaned up temporary photo file:', photoPath);
        } catch (cleanupError) {
          console.error('Failed to clean up temporary photo file:', cleanupError);
        }
      }
      setIsSendingFrame(false);
    }
  };

  // Effect to periodically capture frames while recording
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (recording) {
      interval = setInterval(() => {
        captureAndSendFrame();
      }, FRAME_SEND_INTERVAL);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [recording]);

  // Check permissions
  const checkPermissions = async () => {
    try {
      let cameraStatus, micStatus;
      if (Platform.OS === 'android') {
        cameraStatus = await check(PERMISSIONS.ANDROID.CAMERA);
        micStatus = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
      } else {
        cameraStatus = await check(PERMISSIONS.IOS.CAMERA);
        micStatus = await check(PERMISSIONS.IOS.MICROPHONE);
      }
      if (cameraStatus === RESULTS.GRANTED && micStatus === RESULTS.GRANTED) {
        const cameraPermission = await Camera.getCameraPermissionStatus();
        const microphonePermission = await Camera.getMicrophonePermissionStatus();
        setHasPermission(cameraPermission === 'granted' && microphonePermission === 'granted');
      } else {
        setHasPermission(false);
        setShowPermissionModal(true);
      }
      setPermissionAsked(true);
    } catch (error) {
      console.error('Permission check error:', error);
      Alert.alert('Error', 'Failed to check permissions.');
    }
  };

  // Request permissions
  const requestSystemPermissions = async () => {
    try {
      let cameraStatus, micStatus;
      if (Platform.OS === 'android') {
        cameraStatus = await request(PERMISSIONS.ANDROID.CAMERA);
        micStatus = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
      } else {
        cameraStatus = await request(PERMISSIONS.IOS.CAMERA);
        micStatus = await request(PERMISSIONS.IOS.MICROPHONE);
      }
      if (cameraStatus === RESULTS.GRANTED && micStatus === RESULTS.GRANTED) {
        const cameraPermission = await Camera.requestCameraPermission();
        const microphonePermission = await Camera.requestMicrophonePermission();
        setHasPermission(cameraPermission === 'granted' && microphonePermission === 'granted');
      } else if (cameraStatus === RESULTS.BLOCKED || micStatus === RESULTS.BLOCKED) {
        Alert.alert(
          'Permissions Blocked',
          'Camera and Microphone access are blocked. Please enable them in Settings.',
          [{ text: 'Cancel', style: 'cancel' }, { text: 'Open Settings', onPress: () => openSettings() }],
        );
      } else {
        setHasPermission(false);
      }
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request permissions.');
    }
  };

  const handlePermissionRequest = async (option: 'allow' | 'onlyThisTime' | 'deny') => {
    setShowPermissionModal(false);
    if (option === 'deny') {
      setPermissionAsked(true);
      return;
    }
    await requestSystemPermissions();
    await checkPermissions();
  };

  // Function to upload video to Firebase Storage
  const uploadVideoToFirebase = async (videoPath: string, timestamp: string) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      setUploading(true);
      const videoRef = ref(storage, `videos/${user.uid}/${timestamp}.mp4`);
      const fileUri = Platform.OS === 'android' ? `file://${videoPath}` : videoPath;
      await videoRef.putFile(fileUri);
      const downloadURL = await getDownloadURL(videoRef);
      console.log('Video uploaded to Firebase:', downloadURL);
      setVideoPaths((prev) => [...prev, downloadURL]);
      Alert.alert('Recording Saved', 'Video uploaded to Firebase Storage.');
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading video to Firebase:', error);
      Alert.alert('Error', 'Failed to upload video to Firebase.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle recording start/stop
  const handleStartRecording = async () => {
    if (!device || !cameraReady) {
      Alert.alert('Camera not ready', 'Please wait until camera is ready...');
      return;
    }
    if (!hasPermission) {
      await checkPermissions();
      return;
    }
    try {
      if (!recording) {
        await camera.current?.startRecording({


          fileType: 'mp4',
          videoCodec: 'h264',
          onRecordingFinished: async (video: VideoFile) => {
            try {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              await uploadVideoToFirebase(video.path, timestamp);
            } catch (error) {
              console.error('Error handling video:', error);
              Alert.alert('Error', 'Failed to process video.');
            } finally {
              try {
                await RNFS.unlink(video.path);
                console.log('Cleaned up temporary video file:', video.path);
              } catch (cleanupError) {
                console.error('Failed to clean up temporary video file:', cleanupError);
              }
            }
          },
          onRecordingError: (error) => {
            console.error('Recording error:', error);
            Alert.alert('Recording Error', error.message);
            setRecording(false);
          },
        });
        setRecording(true);
        Alert.alert('Recording Started', 'Real-time frame processing and video recording have started.');
      } else {
        await camera.current?.stopRecording();
        setRecording(false);
        Alert.alert('Recording Stopped', 'Video is being uploaded to Firebase. Real-time processing stopped.');
      }
    } catch (error) {
      console.error('Error managing recording:', error);
      Alert.alert('Error', 'Failed to manage recording.');
      setRecording(false);
    }
  };

  const toggleCameraPosition = () => {
    setCameraPosition((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const toggleTorch = () => {
    setTorch((prev) => (prev === 'on' ? 'off' : 'on'));
  };

  useEffect(() => {
    if (!permissionAsked) {
      checkPermissions();
    }
  }, [permissionAsked]);

  useEffect(() => {
    console.log('Camera devices:', devices);
    if (!devices || devices.length === 0) {
      console.log('No camera devices found. Attempting to reinitialize...');
      const timer = setTimeout(() => {
        if (!devices || devices.length === 0) {
          Alert.alert(
            'Camera Error',
            'No camera devices found. Please ensure your device has a camera and permissions are granted.',
            [
              { text: 'Retry', onPress: () => checkPermissions() },
              { text: 'Open Settings', onPress: () => openSettings() },
            ]
          );
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [devices]);

  if (!permissionAsked || !hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver Safety System</Text>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Icon name="sign-out" type="font-awesome" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        {!hasPermission && (
          <Modal
            transparent={true}
            visible={showPermissionModal}
            animationType="fade"
            onRequestClose={() => setShowPermissionModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Icon name="mic" type="font-awesome" size={40} color="#00AEEF" style={styles.modalIcon} />
                <Text style={styles.modalTitle}>Allow adas_system to record audio?</Text>
                <Text style={styles.modalSubtitle}>While using the app</Text>
                <TouchableOpacity style={styles.modalButton} onPress={() => handlePermissionRequest('allow')}>
                  <Text style={styles.modalButtonText}>WHILE USING THE APP</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={() => handlePermissionRequest('onlyThisTime')}>
                  <Text style={styles.modalButtonText}>ONLY THIS TIME</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalButton} onPress={() => handlePermissionRequest('deny')}>
                  <Text style={styles.modalButtonText}>DON'T ALLOW</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        <TouchableOpacity style={styles.card} onPress={handleStartRecording} activeOpacity={0.8} disabled={!hasPermission}>
          <Icon name="video" size={40} color="#1F2937" style={{ marginBottom: 10 }} />
          <Text style={styles.cardTitle}>{hasPermission ? 'Start Recording' : 'Permissions Required'}</Text>
          <Text style={styles.cardSubtitle}>
            {hasPermission ? "Start driver's journey and monitor in real-time" : 'Please grant permissions'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.card, { marginTop: 20 }]}
          onPress={() => navigation.navigate('Dashboard', { videoPaths })}
          activeOpacity={0.8}
        >
          <Icon name="dashboard" size={40} color="#1F2937" style={{ marginBottom: 10 }} />
          <Text style={styles.cardTitle}>Dashboard</Text>
          <Text style={styles.cardSubtitle}>Go to your dashboard and settings</Text>
        </TouchableOpacity>
        {uploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={styles.uploadingText}>Uploading and processing video...</Text>
          </View>
        )}
        {responseData && responseData.commands.length > 0 && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>Live Commands:</Text>
            {responseData.commands.map((command, index) => (
              <Text key={index} style={[styles.responseText, { marginLeft: 10, marginTop: 5 }]}>
                • {command}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver Safety System</Text>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Icon name="sign-out" type="font-awesome" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <ActivityIndicator size="large" color="#1F2937" />
        <Text style={styles.text}>Loading Camera...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={true}
        video={true}
        audio={true}
        torch={torch}
        photo={true}
        videoBitRate="low"
        onInitialized={() => setCameraReady(true)}
        onError={(error) => {
          console.error('Camera Error:', error);
          Alert.alert('Camera Error', error.message);
        }}
      />
      <View style={styles.controlOverlay}>
        <View style={styles.header}>
          <Text style={styles.title}>Driver Safety System</Text>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Icon name="sign-out" type="font-awesome" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        {uploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={styles.uploadingText}>Uploading and processing video...</Text>
          </View>
        )}
        {responseData && responseData.commands.length > 0 && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>Live Commands:</Text>
            {responseData.commands.map((command, index) => (
              <Text key={index} style={[styles.responseText, { marginLeft: 10, marginTop: 5 }]}>
                • {command}
              </Text>
            ))}
          </View>
        )}
        <View style={styles.controlPanel}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraPosition} activeOpacity={0.8}>
            <Icon name="camera-switch" size={30} color="#FFF" />
            <Text style={styles.controlButtonText}>Switch Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={toggleTorch} activeOpacity={0.8}>
            <Icon name="flash" size={30} color="#FFF" />
            <Text style={styles.controlButtonText}>{torch === 'on' ? 'Turn Off Torch' : 'Turn On Torch'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, uploading && { opacity: 0.5 }]}
            onPress={handleStartRecording}
            activeOpacity={0.8}
            disabled={uploading}
          >
            <Icon name={recording ? 'stop' : 'video'} size={40} color="#FFF" style={{ marginBottom: 10 }} />
            <Text style={styles.actionButtonText}>{recording ? 'Stop Recording' : 'Start Recording'}</Text>
            <Text style={styles.actionButtonSubtitle}>
              {recording ? 'Recording and processing in real-time' : uploading ? 'Uploading video...' : "Start driver's journey and monitor"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Dashboard', { videoPaths })}
            activeOpacity={0.8}
          >
            <Icon name="dashboard" size={40} color="#FFF" style={{ marginBottom: 10 }} />
            <Text style={styles.actionButtonText}>Dashboard</Text>
            <Text style={styles.actionButtonSubtitle}>Go to your dashboard and settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default HomeScreen;