import { useEffect, useRef, useState } from 'react';
import { Camera, useCameraDevices, useCameraFormat, VideoFile } from 'react-native-vision-camera';
import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import RNFS from 'react-native-fs';
import { getAuth } from '@react-native-firebase/auth';
import { storage } from './config/firebaseConfig'; // Adjusted path based on folder structure
import { ref, getDownloadURL } from '@react-native-firebase/storage';
import Tts from 'react-native-tts';
import { processFrame } from './services/frameService'; // Import the local processFrame function

const FRAME_SEND_INTERVAL = 2000;

// Define the modal state type
type ModalState = {
  isVisible: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
};

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
  const [loading, setLoading] = useState<boolean>(true);
  const [modalState, setModalState] = useState<ModalState>({
    isVisible: false,
    type: 'success',
    title: '',
    message: '',
  });

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
      setLoading(true);
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
      setLoading(false);
    } catch (error) {
      console.error('Permission check error:', error);
      setModalState({
        isVisible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to check permissions.',
      });
      setLoading(false);
    }
  };

  // Request permissions
  const requestSystemPermissions = async () => {
    try {
      setLoading(true);
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
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'Permissions Blocked',
          message: 'Camera and Microphone access are blocked. Please enable them in Settings.',
        });
      } else {
        setHasPermission(false);
      }
      setLoading(false);
    } catch (error) {
      console.error('Permission request error:', error);
      setModalState({
        isVisible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to request permissions.',
      });
      setLoading(false);
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

      // Call the local processFrame function
      const newResponseData = await processFrame(photoPath);

      console.log(`[${new Date().toISOString()}] Local frame processing response:`, newResponseData);

      if (newResponseData?.commands?.length > 0) {
        setResponseData(newResponseData);
        // No audioUrl handling needed, as TTS is handled by useEffect
      } else {
        setResponseData(null);
      }
    } catch (error: any) {
      console.error('Error processing frame locally:', error);
      if (error.message === 'No authentication token') {
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'Error',
          message: 'Authentication failed. Please sign in again.',
        });
      } else if (error.message === 'No frame file provided') {
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'Error',
          message: 'No frame file provided.',
        });
      } else if (error.message === 'Failed to process frame on VPS') {
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'Error',
          message: 'Failed to process frame on VPS.',
        });
      } else {
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'Error',
          message: `Failed to process frame: ${error.message}`,
        });
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
      setModalState({
        isVisible: true,
        type: 'success',
        title: 'Recording Saved',
        message: 'Video uploaded to Firebase Storage.',
      });
      return downloadURL;
    } catch (error: any) {
      console.error('Error uploading video to Firebase:', error);
      setModalState({
        isVisible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to upload video to Firebase.',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle recording start/stop
  const handleStartRecording = async () => {
    if (!device || !cameraReady) {
      setModalState({
        isVisible: true,
        type: 'error',
        title: 'Camera Not Ready',
        message: 'Please wait until camera is ready...',
      });
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
              setModalState({
                isVisible: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to process video.',
              });
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
            setModalState({
              isVisible: true,
              type: 'error',
              title: 'Recording Error',
              message: error.message,
            });
            setRecording(false);
          },
        });
        setRecording(true);
        setModalState({
          isVisible: true,
          type: 'success',
          title: 'Recording Started',
          message: 'Real-time frame processing and video recording have started.',
        });
      } else {
        await camera.current?.stopRecording();
        setRecording(false);
        setModalState({
          isVisible: true,
          type: 'success',
          title: 'Recording Stopped',
          message: 'Video is being uploaded to Firebase. Real-time processing stopped.',
        });
      }
    } catch (error) {
      console.error('Error managing recording:', error);
      setModalState({
        isVisible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to manage recording.',
      });
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

  // Function to close the modal
  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isVisible: false }));
  };

  // Function to update modal state (exposed for external use)
  const updateModalState = (newState: Omit<ModalState, 'isVisible'> & { isVisible?: boolean }) => {
    setModalState((prev) => ({
      ...prev,
      ...newState,
      isVisible: newState.isVisible !== undefined ? newState.isVisible : true,
    }));
  };

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
    loading,
    modalState,
    handleCloseModal,
    updateModalState,
  };
};