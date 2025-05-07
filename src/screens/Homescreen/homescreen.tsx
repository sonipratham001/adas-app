import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Icon } from 'react-native-elements';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { styles } from './homescreen.styles';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>; // Removed setSideMenuVisible from Props

const HomeScreen = ({ navigation }: Props) => {
  const {
    hasPermission,
    permissionAsked,
    showPermissionModal,
    videoPaths,
    handlePermissionRequest,
    loading,
  } = useCameraRecording();
  const { setSideMenuVisible } = useSideMenu(); // Use the context hook

  const handleStartRecordingPress = () => {
    if (!hasPermission) {
      handlePermissionRequest('allow');
      return;
    }
    navigation.navigate('Camera');
  };

  const renderContent = () => (
    <>
      {!hasPermission && (
        <Modal
          transparent={true}
          visible={showPermissionModal}
          animationType="fade"
          onRequestClose={() => handlePermissionRequest('deny')}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Icon name="mic" type="font-awesome" size={40} color="#000" style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Allow Driver Safety System to record audio?</Text>
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
      <Text style={styles.welcomeText}>Welcome to Driver Safety System</Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleStartRecordingPress}
        activeOpacity={0.8}
        disabled={loading || !hasPermission}
      >
        <Icon name="video-camera" type="font-awesome" size={24} color="#000" />
        {loading ? (
          <ActivityIndicator size="small" color="#000" style={{ marginVertical: 8 }} />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>
              {hasPermission ? 'Start Recording' : 'Permissions Required'}
            </Text>
            <Text style={styles.primaryButtonSubtitle}>
              {hasPermission ? 'Begin your journey with real-time monitoring' : 'Please grant camera and microphone permissions'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <LinearGradient
      colors={['#F9FAFB', '#E5E7EB']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Driver Safety System</Text>
        <TouchableOpacity onPress={() => setSideMenuVisible(true)} style={styles.signOutButton}>
          <Icon name="bars" type="font-awesome" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>
      <View style={styles.centeredContent}>
        {renderContent()}
      </View>
    </LinearGradient>
  );
};

export default HomeScreen;