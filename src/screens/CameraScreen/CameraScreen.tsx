import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Camera } from 'react-native-vision-camera';
import { Icon } from 'react-native-elements';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { styles } from './camerascreen.styles';
import { useCameraRecording } from '../../useCameraRecording';
import CustomModal from '../../Modal/CustomModal';
import { openSettings } from 'react-native-permissions';

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
    modalState,
    handleCloseModal,
    updateModalState,
  } = useCameraRecording();

  const handleOpenSettings = () => {
    openSettings();
    handleCloseModal();
  };

  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [recording]);

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
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#1F2937', marginTop: 20, textAlign: 'center' }}>
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
          updateModalState({
            type: 'error',
            title: 'Camera Error',
            message: error.message,
          });
        }}
      />
      <View style={styles.controlOverlay}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={async () => {
              console.log('Back button pressed'); // Debug log
              if (recording) {
                await handleStartRecording(); // Await to ensure recording stops before navigating
              }
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <Icon name="arrow-left" type="font-awesome" size={28} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Driver Safety System</Text>
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
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={toggleCameraPosition}
            style={styles.controlButton}
            activeOpacity={0.7}
          >
            <Icon name="refresh" type="font-awesome" size={28} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleStartRecording}
            activeOpacity={0.7}
            disabled={uploading || !cameraReady}
          >
            <Animated.View style={[styles.actionButtonInner, { transform: [{ scale: scaleAnim }] }]}>
              <Icon
                name={recording ? 'stop' : 'video-camera'}
                type="font-awesome"
                size={40}
                color="#FFF"
              />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={toggleTorch}
            style={styles.controlButton}
            activeOpacity={0.7}
          >
            <Icon name="flash" type="font-awesome" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
      <CustomModal
        isVisible={modalState.isVisible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={handleCloseModal}
        onConfirm={modalState.title === 'Permissions Blocked' ? handleOpenSettings : undefined}
      />
    </LinearGradient>
  );
};

export default CameraScreen;