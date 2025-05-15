import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from 'react-native-elements';
import { getAuth } from '@react-native-firebase/auth';
import { storage } from '../../config/firebaseConfig';
import { ref, listAll, getDownloadURL, getMetadata, deleteObject } from '@react-native-firebase/storage';
import { styles } from './dashboard.styles';
import CustomModal from '../../Modal/CustomModal';
import { createThumbnail } from "react-native-create-thumbnail";
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { useFocusEffect } from '@react-navigation/native';

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

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

type VideoItem = {
  id: string;
  title: string;
  path: string;
  date: string;
  timestamp: number;
  duration?: string;
  thumbnail?: string | null;
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
  onConfirm?: () => void;
};

const { width } = Dimensions.get('window');
const numColumns = 3;
const itemWidth = (width - 40 - (numColumns - 1) * 10) / numColumns;

// Cache key for AsyncStorage
const THUMBNAIL_CACHE_KEY = 'thumbnail_cache';

const DashboardScreen = ({ navigation }: Props) => {
  const [sections, setSections] = useState<DateSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [modalState, setModalState] = useState<ModalState>({
    isVisible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    if (isToday) {
      return 'Today';
    }
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
    });
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Load cached thumbnails from AsyncStorage
  const loadThumbnailCache = async (): Promise<{ [key: string]: string }> => {
    try {
      const cache = await AsyncStorage.getItem(THUMBNAIL_CACHE_KEY);
      return cache ? JSON.parse(cache) : {};
    } catch (error) {
      console.error('Error loading thumbnail cache:', error);
      return {};
    }
  };

  // Save thumbnail path to AsyncStorage
  const saveThumbnailToCache = async (videoId: string, thumbnailPath: string) => {
    try {
      const cache = await loadThumbnailCache();
      cache[videoId] = thumbnailPath;
      await AsyncStorage.setItem(THUMBNAIL_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving thumbnail to cache:', error);
    }
  };

  // Remove thumbnail from cache and file system when a video is deleted
  const removeThumbnailFromCache = async (videoId: string) => {
    try {
      const cache = await loadThumbnailCache();
      if (cache[videoId]) {
        await RNFS.unlink(cache[videoId]).catch((err) =>
          console.error('Error deleting thumbnail file:', err)
        );
        delete cache[videoId];
        await AsyncStorage.setItem(THUMBNAIL_CACHE_KEY, JSON.stringify(cache));
      }
    } catch (error) {
      console.error('Error removing thumbnail from cache:', error);
    }
  };

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const thumbnailCache = await loadThumbnailCache();

      const videosRef = ref(storage, `videos/${user.uid}`);
      const videoList = await listAll(videosRef);
      const videoItems: VideoItem[] = await Promise.all(
        videoList.items.map(async (item, index) => {
          const url = await getDownloadURL(item);
          const metadata = await getMetadata(item);
          const timestamp = metadata.timeCreated
            ? new Date(metadata.timeCreated).getTime()
            : Date.now();
          const duration = metadata.customMetadata?.duration
            ? parseFloat(metadata.customMetadata.duration)
            : 0;

          let thumbnail = thumbnailCache[item.name] || null;

          if (!thumbnail) {
            try {
              const thumbResponse = await createThumbnail({
                url: url,
                timeStamp: 1000,
                maxWidth: 200,
                maxHeight: 200,
              });

              const thumbnailCachePath = `${RNFS.CachesDirectoryPath}/thumbnails/${item.name}.jpg`;
              await RNFS.mkdir(`${RNFS.CachesDirectoryPath}/thumbnails`);
              await RNFS.moveFile(thumbResponse.path, thumbnailCachePath);

              thumbnail = thumbnailCachePath;
              await saveThumbnailToCache(item.name, thumbnailCachePath);
            } catch (error) {
              console.error('Error generating thumbnail for', item.name, ':', error);
            }
          }

          return {
            id: item.name,
            title: `Recording ${index + 1}`,
            path: url,
            date: formatDate(timestamp),
            timestamp,
            duration: duration && !isNaN(duration) ? formatDuration(duration) : undefined,
            thumbnail,
          };
        })
      );

      videoItems.sort((a, b) => b.timestamp - a.timestamp);

      const groupedByDate: { [key: string]: VideoItem[] } = {};
      videoItems.forEach((video) => {
        if (!groupedByDate[video.date]) {
          groupedByDate[video.date] = [];
        }
        groupedByDate[video.date].push(video);
      });

      const sectionsData: DateSection[] = Object.keys(groupedByDate).map((date) => ({
        date,
        videos: groupedByDate[date],
      }));

      setSections(sectionsData);

      if (videoItems.length > 0 && videoItems.every((item) => !item.thumbnail)) {
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'Thumbnail Error',
          message: 'Failed to generate thumbnails for videos. Please try again.',
        });
      }
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
  }, []);

  // Fetch videos whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchVideos();
    }, [fetchVideos])
  );

  const deleteVideosFromFirebase = async (videoIds: string[]) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      await Promise.all(
        videoIds.map(async (videoId) => {
          const videoRef = ref(storage, `videos/${user.uid}/${videoId}`);
          await deleteObject(videoRef);
          await removeThumbnailFromCache(videoId);
        })
      );

      setSections((prevSections) =>
        prevSections
          .map((section) => ({
            ...section,
            videos: section.videos.filter((video) => !videoIds.includes(video.id)),
          }))
          .filter((section) => section.videos.length > 0)
      );

      setSelectedVideos([]);
      setIsSelectionMode(false);

      setModalState({
        isVisible: true,
        type: 'success',
        title: 'Success',
        message: `Successfully deleted ${videoIds.length} video${videoIds.length > 1 ? 's' : ''}.`,
      });
    } catch (error: any) {
      console.error('Error deleting videos:', error);
      setModalState({
        isVisible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to delete videos from Firebase.',
      });
    }
  };

  const handleDeleteVideos = (videoIds: string[]) => {
    setModalState({
      isVisible: true,
      type: 'confirmation',
      title: `Delete ${videoIds.length} Video${videoIds.length > 1 ? 's' : ''}`,
      message: `Are you sure you want to delete ${videoIds.length} video${videoIds.length > 1 ? 's' : ''}? This action cannot be undone.`,
      onConfirm: () => deleteVideosFromFirebase(videoIds),
    });
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isVisible: false, onConfirm: undefined }));
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => !prev);
    setSelectedVideos([]);
  };

  const handleVideoSelect = (videoId: string) => {
    setSelectedVideos((prev) =>
      prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId]
    );
  };

  const handleLongPress = (videoId: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedVideos([videoId]);
    }
  };

  const handleSelectAllForDate = (date: string) => {
    const videosInSection = sections.find((section) => section.date === date)?.videos || [];
    const videoIds = videosInSection.map((video) => video.id);
    const allSelected = videoIds.every((id) => selectedVideos.includes(id));

    if (allSelected) {
      setSelectedVideos((prev) => prev.filter((id) => !videoIds.includes(id)));
    } else {
      setSelectedVideos((prev) => [
        ...prev.filter((id) => !videoIds.includes(id)),
        ...videoIds,
      ]);
    }
  };

  const renderVideoItem = ({ item }: { item: VideoItem }) => {
    const isSelected = selectedVideos.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.videoItem, isSelected && styles.selectedVideoItem]}
        onPress={() => {
          if (isSelectionMode) {
            handleVideoSelect(item.id);
          } else {
            navigation.navigate('VideoPlayback', { videoUrl: item.path, videoId: item.id });
          }
        }}
        onLongPress={() => handleLongPress(item.id)}
      >
        <View style={styles.thumbnailContainer}>
          {item.thumbnail ? (
            <Image source={{ uri: `file://${item.thumbnail}` }} style={styles.videoThumbnail} />
          ) : (
            <View style={styles.videoThumbnail}>
              <ActivityIndicator size="small" color="#1F2937" />
            </View>
          )}
          <View style={styles.playIconContainer}>
            <Icon name="play-circle" type="font-awesome" size={30} color="#FFF" />
          </View>
        </View>
        {isSelectionMode && (
          <View style={styles.selectionOverlay}>
            {isSelected && (
              <Icon name="check" type="font-awesome" size={24} color="#3B82F6" />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSection = ({ item }: { item: DateSection }) => {
    const videosInSection = item.videos.map((video) => video.id);
    const allSelected = videosInSection.length > 0 && videosInSection.every((id) => selectedVideos.includes(id));
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{item.date}</Text>
          {isSelectionMode && (
            <TouchableOpacity onPress={() => handleSelectAllForDate(item.date)}>
              <Text style={styles.selectAllText}>
                {allSelected ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={item.videos}
          renderItem={renderVideoItem}
          keyExtractor={(video) => video.id}
          numColumns={numColumns}
          columnWrapperStyle={styles.columnWrapper}
          scrollEnabled={false}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isSelectionMode ? (
          <>
            <TouchableOpacity onPress={toggleSelectionMode}>
              <Icon name="times" type="font-awesome" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.title}>
              {selectedVideos.length > 0 ? `${selectedVideos.length} Selected` : 'Select Videos'}
            </Text>
            {selectedVideos.length > 0 && (
              <TouchableOpacity onPress={() => handleDeleteVideos(selectedVideos)}>
                <Icon name="trash" type="font-awesome" size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" type="font-awesome" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.title}>All Videos</Text>
            <View style={{ width: 24 }} />
          </>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1F2937" />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No videos found.</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.date}
          renderItem={renderSection}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={true}
        />
      )}

      <CustomModal
        isVisible={modalState.isVisible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.type === 'confirmation' ? handleCloseModal : undefined}
        onClose={handleCloseModal}
      />
    </View>
  );
};

export default DashboardScreen;