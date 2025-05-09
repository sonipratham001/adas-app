import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Video, { VideoRef } from 'react-native-video';
import { Icon } from 'react-native-elements';
import { getAuth } from '@react-native-firebase/auth';
import { storage } from '../../config/firebaseConfig';
import { ref, listAll, getDownloadURL, deleteObject, getMetadata } from '@react-native-firebase/storage';
import { styles } from './dashboard.styles';
import { useSideMenu } from '../../hooks/SideMenuContext';
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
};

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

type VideoItem = {
  id: string;
  title: string;
  path: string;
  date: string; // Format: "May 8, 2025"
  timestamp: number; // For sorting
};

type DateSection = {
  date: string;
  videos: VideoItem[];
};

type ModalState = {
  isVisible: boolean;
  type: 'success' | 'error' | 'confirmation';
  title: string;
  message: string;
  videoIdToDelete?: string;
};

const { width, height } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: Props) => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [sections, setSections] = useState<DateSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [buffering, setBuffering] = useState<boolean>(false);
  const [modalState, setModalState] = useState<ModalState>({
    isVisible: false,
    type: 'success',
    title: '',
    message: '',
    videoIdToDelete: undefined,
  });
  const videoRef = useRef<VideoRef>(null);
  const { setSideMenuVisible } = useSideMenu();

  // Helper to format timestamp to "May 8, 2025"
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Fetch videos from Firebase Storage on mount
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not authenticated');
        }

        const videosRef = ref(storage, `videos/${user.uid}`);
        const videoList = await listAll(videosRef);
        const videoItems: VideoItem[] = await Promise.all(
          videoList.items.map(async (item, index) => {
            const url = await getDownloadURL(item);
            const metadata = await getMetadata(item);
            // Use metadata creation time or fallback to current time
            const timestamp = metadata.timeCreated
              ? new Date(metadata.timeCreated).getTime()
              : Date.now();
            return {
              id: item.name,
              title: `Recording ${index + 1}`,
              path: url,
              date: formatDate(timestamp),
              timestamp,
            };
          })
        );

        // Sort videos by timestamp (newest first)
        videoItems.sort((a, b) => b.timestamp - a.timestamp);

        // Group videos by date
        const groupedByDate: { [key: string]: VideoItem[] } = {};
        videoItems.forEach((video) => {
          if (!groupedByDate[video.date]) {
            groupedByDate[video.date] = [];
          }
          groupedByDate[video.date].push(video);
        });

        // Create sections for FlatList
        const sectionsData: DateSection[] = Object.keys(groupedByDate).map((date) => ({
          date,
          videos: groupedByDate[date],
        }));

        setSections(sectionsData);
      } catch (error: any) {
        console.error('Error fetching videos:', error);
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'Error',
          message: 'Failed to fetch videos from Firebase.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Delete video from Firebase Storage
  const deleteVideoFromFirebase = async (videoId: string) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const videoRef = ref(storage, `videos/${user.uid}/${videoId}`);
      await deleteObject(videoRef);

      // Update sections by removing the deleted video
      setSections((prevSections) =>
        prevSections
          .map((section) => ({
            ...section,
            videos: section.videos.filter((video) => video.id !== videoId),
          }))
          .filter((section) => section.videos.length > 0) // Remove empty sections
      );

      // Check if the currently selected video is the one being deleted
      const allVideos = sections.flatMap((section) => section.videos);
      if (selectedVideo === allVideos.find((video: VideoItem) => video.id === videoId)?.path) {
        setSelectedVideo(null);
        setError(null);
        setIsPaused(false);
      }

      setModalState({
        isVisible: true,
        type: 'success',
        title: 'Success',
        message: 'Video deleted successfully.',
      });
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

  // Handle delete video with confirmation
  const handleDeleteVideo = (videoId: string) => {
    setModalState({
      isVisible: true,
      type: 'confirmation',
      title: 'Delete Video',
      message: 'Are you sure you want to delete this video? This action cannot be undone.',
      videoIdToDelete: videoId,
    });
  };

  // Handle modal confirm action
  const handleConfirmDelete = () => {
    if (modalState.videoIdToDelete) {
      deleteVideoFromFirebase(modalState.videoIdToDelete);
    }
    setModalState((prev) => ({ ...prev, isVisible: false, videoIdToDelete: undefined }));
  };

  // Handle modal cancel/close action
  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isVisible: false, videoIdToDelete: undefined }));
  };

  // Render video item
  const renderVideoItem = (item: VideoItem) => (
    <View style={styles.videoItemContainer}>
      <TouchableOpacity
        style={styles.videoItem}
        onPress={() => {
          setSelectedVideo(item.path);
          setError(null);
          setIsPaused(false);
          setBuffering(false);
        }}
      >
        <Text style={styles.videoText}>{item.title}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteVideo(item.id)}>
        <Icon name="trash" type="font-awesome" size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  // Render each section (date + videos)
  const renderSection = ({ item }: { item: DateSection }) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{item.date}</Text>
      <View style={styles.sectionContent}>
        {item.videos.map((video) => (
          <View key={video.id}>{renderVideoItem(video)}</View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity onPress={() => setSideMenuVisible(true)} style={styles.menuButton}>
          <Icon name="bars" type="font-awesome" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1F2937" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : selectedVideo ? (
        <>
          <View style={{ width: '100%', height: height * 0.5, backgroundColor: '#000' }}>
            <Video
              ref={videoRef}
              source={{ uri: selectedVideo }}
              style={{ width: '100%', height: '100%' }}
              controls={true}
              paused={isPaused}
              resizeMode="contain"
              onBuffer={(data) => {
                setBuffering(data.isBuffering);
              }}
              onError={(error) => {
                console.error('Video playback error:', error);
                setError('Failed to play video. It might be corrupted or inaccessible.');
                setBuffering(false);
              }}
              onLoad={() => {
                setError(null);
                setBuffering(false);
              }}
              onEnd={() => {
                setIsPaused(true);
                setBuffering(false);
              }}
            />
            {buffering && (
              <View style={styles.bufferingContainer}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.bufferingText}>Loading...</Text>
              </View>
            )}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setIsPaused((prev) => !prev)}
            >
              <Icon
                name={isPaused ? 'play' : 'pause'}
                type="font-awesome"
                size={20}
                color="#FFF"
              />
              <Text style={styles.controlButtonText}>{isPaused ? 'Play' : 'Pause'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                setSelectedVideo(null);
                setError(null);
                setIsPaused(false);
                setBuffering(false);
              }}
            >
              <Icon name="arrow-left" type="font-awesome" size={20} color="#FFF" />
              <Text style={styles.controlButtonText}>Back to List</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No videos found.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
            <Text style={styles.backText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={sections}
            keyExtractor={(item) => item.date}
            renderItem={renderSection}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={true}
            initialNumToRender={10}
          />
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
            <Text style={styles.backText}>Back to Home</Text>
          </TouchableOpacity>
        </>
      )}

      <CustomModal
        isVisible={modalState.isVisible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.type === 'confirmation' ? handleConfirmDelete : undefined}
        onCancel={modalState.type === 'confirmation' ? handleCloseModal : undefined}
        onClose={handleCloseModal}
      />
    </View>
  );
};

export default DashboardScreen;