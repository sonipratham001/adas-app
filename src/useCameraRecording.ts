import { useEffect, useRef, useState } from 'react';
import { Camera, useCameraDevices, useCameraFormat, VideoFile } from 'react-native-vision-camera';
import { Alert, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import RNFS from 'react-native-fs';
import { getAuth } from '@react-native-firebase/auth';
import { storage } from './config/firebaseConfig';
import { ref, getDownloadURL } from '@react-native-firebase/storage';
import axios from 'axios';
import Tts from 'react-native-tts';

const BACKEND_URL = 'http://148.66.155.196:5500/process_frame';
const FRAME_SEND_INTERVAL = 2000;

export const useCameraRecording = () => {
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
  const [loading, setLoading] = useState<boolean>(true); // New loading state

  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === cameraPosition);
  const format = useCameraFormat(device, [{ videoResolution: { width: 640, height: 360 } }]);

  // Initialize TTS settings
  useEffect(() => {
    Tts.setDefaultLanguage('en');
    if (Platform.OS === 'ios') {
      Tts.setIgnoreSilentSwitch('ignore');
    }
  }, []);

  // Handle real-time audio playback for commands
  useEffect(() => {
    if (responseData && responseData.commands.length > 0) {
      Tts.stop();
      const textToSpeak = responseData.commands.join('. ');
      Tts.speak(textToSpeak, {
        iosVoiceId: '',
        rate: 1.0,
        androidParams: {
          KEY_PARAM_STREAM: 'STREAM_ALARM',
          KEY_PARAM_VOLUME: 1.0,
          KEY_PARAM_PAN: 0.0,
        },
      });
    } else {
      Tts.stop();
    }
  }, [responseData]);

  // Check permissions
  const checkPermissions = async () => {
    try {
      setLoading(true); // Start loading
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
      setLoading(false); // End loading
    } catch (error) {
      console.error('Permission check error:', error);
      Alert.alert('Error', 'Failed to check permissions.');
      setLoading(false); // End loading even on error
    }
  };

  // Request permissions
  const requestSystemPermissions = async () => {
    try {
      setLoading(true); // Start loading
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
      setLoading(false); // End loading
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Error', 'Failed to request permissions.');
      setLoading(false); // End loading even on error
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

      if (newResponseData?.commands?.length > 0) {
        setResponseData(newResponseData);
        if (newResponseData.audioUrl) {
          console.log('Audio URL received but playback disabled:', newResponseData.audioUrl);
        }
      } else {
        setResponseData(null);
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
        Alert.alert('Recording Started without any error', 'Real-time frame processing and video recording have started.');
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

  return {
    hasPermission,
    permissionAsked,
    recording,
    cameraReady,
    showPermissionModal,
    cameraPosition,
    torch,
    videoPaths,
    uploading,
    responseData,
    camera,
    devices,
    device,
    format,
    handlePermissionRequest,
    handleStartRecording,
    toggleCameraPosition,
    toggleTorch,
    setCameraReady,
    loading, // Expose the loading state
  };
};