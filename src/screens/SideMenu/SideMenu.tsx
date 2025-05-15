import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { styles } from './sidemenu.styles';
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

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home' | 'SideMenu'>;
  visible?: boolean; // Made optional
  onClose?: () => void; // Made optional
};

type ModalState = {
  isVisible: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
};

const SideMenu = ({ visible = true, onClose, navigation }: Props) => {
  const [userDetails, setUserDetails] = useState<{ name: string | null }>({
    name: null,
  });
  const [modalState, setModalState] = useState<ModalState>({
    isVisible: false,
    type: 'success',
    title: '',
    message: '',
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User displayName:', user.displayName); // Debug log
        setUserDetails({
          name: user.displayName || 'Driver',
        });
      } else {
        setUserDetails({ name: 'Driver' });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await auth.signOut();
      setModalState({
        isVisible: true,
        type: 'success',
        title: 'Success',
        message: 'You have been logged out.',
      });
      if (onClose) onClose(); // Call onClose if provided
      // navigation.navigate('Login'); // Navigate to Login after sign-out
    } catch (error: any) {
      console.error('Sign-out error:', error);
      setModalState({
        isVisible: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to sign out. Please try again.',
      });
    }
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isVisible: false }));
  };

  const handleClose = () => {
    if (onClose) {
      onClose(); // Use onClose if provided (overlay mode)
    } else {
      navigation.goBack(); // Navigate back if used as a screen
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sideMenu}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Icon name="close" type="font-awesome" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.profileSection}>
          <Icon name="user" type="font-awesome" size={60} color="#333" />
          <Text style={styles.profileName}>{userDetails.name}</Text>
        </View>
        <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="sign-out" type="font-awesome" size={20} color="#333" />
            <Text style={styles.menuText}>Log Out</Text>
          </View>
          <Icon name="chevron-right" type="font-awesome" size={20} color="#333" />
        </TouchableOpacity>
      </View>

      <CustomModal
        isVisible={modalState.isVisible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={handleCloseModal}
      />
    </View>
  );
};

export default SideMenu;