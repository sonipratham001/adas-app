import React, { useState, useRef, useEffect } from 'react';
import { View, ActivityIndicator, Dimensions, Text, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Video, { VideoRef } from 'react-native-video';
import { Icon } from 'react-native-elements';
import { TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { getAuth } from '@react-native-firebase/auth';
import { storage } from '../../config/firebaseConfig';
import { ref, deleteObject } from '@react-native-firebase/storage';
import { styles } from './playback.styles';
import CustomModal from '../../Modal/CustomModal';

type RootStackParamList = {
  Signup: undefined;
  OTP: undefined;
  Home: undefined;
  Login: undefined;
  Dashboard: { videoPaths?: string[] };
  Camera: undefined;
  SideMenu: undefined;
  ForgotPassword: undefined;
  VideoPlayback: { videoUrl: string; videoId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'VideoPlayback'>;

type ModalState = {
  isVisible: boolean;
  type: 'success' | 'error' | 'confirmation';
  title: string;
  message: string;
  onConfirm?: () => void;
};

const { height } = Dimensions.get('window');

const VideoPlaybackScreen = ({ route, navigation }: Props) => {
  const { videoUrl, videoId } = route.params;
  const [error, setError] = useState<string | null>(null);
  const [buffering, setBuffering] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [modalState, setModalState] = useState<ModalState>({
    isVisible: false,
    type: 'success',
    title: '',
    message: '',
  });
  const videoRef = useRef<VideoRef>(null);
  const heightAnim = useRef(new Animated.Value(height * 0.4)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: isMaximized ? height * 0.7 : height * 0.4,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isMaximized]);

  const deleteVideoFromFirebase = async (videoId: string) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const videoRef = ref(storage, `videos/${user.uid}/${videoId}`);
      await deleteObject(videoRef);

      setModalState({
        isVisible: true,
        type: 'success',
        title: 'Success',
        message: 'Video deleted successfully.',
      });

      setTimeout(() => {
        navigation.reset({
          index: 1,
          routes: [
            { name: 'Home' },
            { name: 'Dashboard', params: {} },
          ],
        });
      }, 1500);
    } catch (error: any) {
      console.error('Error deleting video:', error);
      setModalState({
        isVisible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to delete video from Firebase.',
      });
    }
  };

  const handleDelete = () => {
    setModalState({
      isVisible: true,
      type: 'confirmation',
      title: 'Delete Video',
      message: 'Are you sure you want to delete this video? This action cannot be undone.',
      onConfirm: () => deleteVideoFromFirebase(videoId),
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isVisible: false, onConfirm: undefined }));
    if (modalState.type === 'success') {
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Home' },
          { name: 'Dashboard', params: {} },
        ],
      });
    }
  };

  useEffect(() => {
    return () => {
      setModalState({
        isVisible: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: undefined,
      });
    };
  }, []);

  return (
    <LinearGradient colors={['#F9FAFB', '#E5E7EB']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" type="font-awesome" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Video Playback</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Icon name="trash" type="font-awesome" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>
      <View style={styles.videoContainer}>
        <Animated.View style={[styles.videoWrapper, { height: heightAnim }]}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={styles.videoPlayer}
            controls={true}
            resizeMode="contain"
            onBuffer={(data) => setBuffering(data.isBuffering)}
            onError={(error) => {
              console.error('Video playback error:', error);
              setError('Failed to play video. It might be corrupted or inaccessible.');
              setBuffering(false);
            }}
            onLoad={() => {
              setError(null);
              setBuffering(false);
            }}
          />
          {buffering && (
            <View style={styles.bufferingContainer}>
              <ActivityIndicator size="large" color="#FFF" />
            </View>
          )}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </Animated.View>
      </View>

      <CustomModal
        isVisible={modalState.isVisible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.type === 'confirmation' ? handleCloseModal : undefined}
        onClose={handleCloseModal}
        overlayStyle={styles.modalOverlay}
        containerStyle={styles.modalContent}
        titleStyle={styles.modalTitle}
        messageStyle={styles.modalMessage}
        confirmButtonStyle={styles.modalConfirmButton}
        cancelButtonStyle={styles.modalCancelButton}
        confirmTextStyle={styles.modalButtonText}
        cancelTextStyle={styles.modalButtonText}
      />
    </LinearGradient>
  );
};

export default VideoPlaybackScreen;