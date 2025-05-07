import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Camera } from 'react-native-vision-camera';
import { Icon } from 'react-native-elements';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { styles } from './camerascreen.styles';
import { useCameraRecording } from '../../useCameraRecording';
import { useSideMenu } from '../../hooks/SideMenuContext'; // Import the context hook

type RootStackParamList = {
  Signup: undefined;
  OTP: undefined;
  Home: undefined;
  Login: undefined;
  Dashboard: { videoPaths?: string[] };
  Camera: undefined;
  SideMenu: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Camera'>;
const CameraScreen = ({ navigation }: Props) => {
  const {
    recording,
    cameraReady,
    cameraPosition,
    torch,
    uploading,
    responseData,
    camera,
    device,
    format,
    handleStartRecording,
    toggleCameraPosition,
    toggleTorch,
    setCameraReady,
  } = useCameraRecording();
  const { setSideMenuVisible } = useSideMenu();
  if (!device) {
    return (
      <LinearGradient
        colors={['#F9FAFB', '#E5E7EB']}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Camera Loading...</Text>
        </View>
        <ActivityIndicator size="large" color="#1F2937" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginTop: 20, textAlign: 'center' }}>
          Loading Camera...
        </Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#F9FAFB', '#E5E7EB']} style={{ flex: 1 }}>
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
          <TouchableOpacity
            onPress={() => {
              if (recording) {
                handleStartRecording();
              }
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <Icon name="arrow-left" type="font-awesome" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Driver Safety System</Text>
        </View>
        {uploading && (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color= '#FFFFFF' />
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
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleCameraPosition}
            activeOpacity={0.8}
          >
            <Icon name="camera" type="font-awesome" size={24} color="#FFF" />
            <Text style={styles.controlButtonText}>Switch Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleTorch}
            activeOpacity={0.8}
          >
            <Icon name="flash" type="font-awesome" size={24} color="#FFF" />
            <Text style={styles.controlButtonText}>{torch === 'on' ? 'Turn Off Torch' : 'Turn On Torch'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, uploading && { opacity: 0.5 }]}
            onPress={handleStartRecording}
            activeOpacity={0.8}
            disabled={uploading || !cameraReady}
          >
            <Icon
              name={recording ? 'stop' : 'video-camera'}
              type="font-awesome"
              size={36}
              color="#FFF"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.actionButtonText}>{recording ? 'Stop Recording' : 'Start Recording'}</Text>
            <Text style={styles.actionButtonSubtitle}>
              {recording ? 'Recording and processing in real-time' : uploading ? 'Uploading video...' : 'Begin your journey'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

export default CameraScreen;