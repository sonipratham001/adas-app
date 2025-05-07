import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Video, { VideoRef } from 'react-native-video';
import { Icon } from 'react-native-elements';
import { getAuth } from '@react-native-firebase/auth';
import { storage } from '../../config/firebaseConfig';
import { ref, listAll, getDownloadURL, deleteObject } from '@react-native-firebase/storage';
import { styles } from './dashboard.styles';
import { useSideMenu } from '../../hooks/SideMenuContext'; // Import the context hook

// Define the type for the navigation stack
type RootStackParamList = {
  Signup: undefined;
  OTP: undefined;
  Home: undefined;
  Login: undefined;
  Dashboard: { videoPaths?: string[] };
  Camera: undefined;
  SideMenu: undefined;
};


type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;
// Define video item type
type VideoItem = {
  id: string;
  title: string;
  path: string;
};

const { width, height } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: Props) => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [buffering, setBuffering] = useState<boolean>(false);
  const videoRef = useRef<VideoRef>(null);
  const { setSideMenuVisible } = useSideMenu(); // Use the context hook
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
            return {
              id: item.name, // Use filename as ID
              title: `Recording ${index + 1}`, // Dynamic title
              path: url, // Download URL
            };
          })
        );

        setVideos(videoItems);
      } catch (error: any) {
        console.error('Error fetching videos:', error);
        Alert.alert('Error', 'Failed to fetch videos from Firebase.');
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
      setVideos((prevVideos) => prevVideos.filter((video) => video.id !== videoId));
      if (selectedVideo === videos.find((video) => video.id === videoId)?.path) {
        setSelectedVideo(null);
        setError(null);
        setIsPaused(false);
      }
      Alert.alert('Success', 'Video deleted successfully.');
    } catch (error: any) {
      console.error('Error deleting video:', error);
      Alert.alert('Error', 'Failed to delete video from Firebase.');
    }
  };

  // Handle delete video with confirmation
  const handleDeleteVideo = (videoId: string) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteVideoFromFirebase(videoId),
        },
      ]
    );
  };

  // Render video item in FlatList
  const renderVideoItem = ({ item }: { item: VideoItem }) => (
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Videos</Text>

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
      ) : videos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No videos found.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
            <Text style={styles.backText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id}
            renderItem={renderVideoItem}
            contentContainerStyle={styles.list}
          />
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
            <Text style={styles.backText}>Back to Home</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default DashboardScreen;