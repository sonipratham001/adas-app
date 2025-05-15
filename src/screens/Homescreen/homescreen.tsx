import React from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Icon } from 'react-native-elements';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { styles } from './homescreen.styles';
import { useCameraRecording } from '../../useCameraRecording';

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

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const {
    hasPermission,
    permissionAsked,
    showPermissionModal,
    videoPaths,
    handlePermissionRequest,
    loading,
  } = useCameraRecording();

  const handleStartRecordingPress = () => {
    if (!hasPermission) {
      handlePermissionRequest('allow');
      return;
    }
    navigation.navigate('Camera');
  };

  const handleTripHistoryPress = () => {
    navigation.navigate('Dashboard', { videoPaths });
  };

  const handleProfilePress = () => {
    navigation.navigate('SideMenu');
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
              <Icon name="mic" type="font-awesome" size={40} color="#FFF" style={styles.modalIcon} />
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

      {/* Central Car Logo */}
      <View style={styles.centerImageContainer}>
        <Image
          source={require('../../assets/car-logo.png')} // Replace with your car logo path
          style={styles.centerImage}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleStartRecordingPress}
          activeOpacity={0.8}
          disabled={loading || !hasPermission}
        >
          <Icon name="video-camera" type="font-awesome" size={20} color="#FFF" />
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" style={{ marginLeft: 10 }} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {hasPermission ? 'Start Recording' : 'Permissions Required'}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleTripHistoryPress}
          activeOpacity={0.8}
        >
          <Icon name="history" type="font-awesome" size={20} color="#1F2937" />
          <Text style={styles.secondaryButtonText}>Trip History</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <LinearGradient
      colors={['#F9FAFB', '#E5E7EB']} // Exact colors from the reference app
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress}>
          <Icon name="user" type="font-awesome" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Driver Safety System</Text>
      </View>
      <View style={styles.centeredContent}>
        {renderContent()}
      </View>
    </LinearGradient>
  );
};

export default HomeScreen;