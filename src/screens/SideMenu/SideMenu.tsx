import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, TouchableWithoutFeedback } from 'react-native';
import { Icon } from 'react-native-elements';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { styles } from './sidemenu.styles';

type RootStackParamList = {
  Signup: undefined;
  OTP: undefined;
  Home: undefined;
  Login: undefined;
  Dashboard: { videoPaths?: string[] };
  Camera: undefined;
  SideMenu: undefined;
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  visible: boolean;
  onClose: () => void;
};

const SideMenu = ({ visible, onClose, navigation }: Props) => {
  const [userDetails, setUserDetails] = useState<{ name: string | null; email: string | null }>({
    name: null,
    email: null,
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserDetails({
          name: user.displayName || 'Driver',
          email: user.email || 'No email provided',
        });
      } else {
        setUserDetails({ name: 'Driver', email: 'No email provided' });
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await auth.signOut();
      Alert.alert('Success', 'You have been signed out.');
      onClose();
    } catch (error: any) {
      console.error('Sign-out error:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Side Menu Content */}
      <View style={styles.sideMenu}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Menu</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" type="font-awesome" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.profileSection}>
          <View style={styles.userIconContainer}>
            <Icon name="user" type="font-awesome" size={40} color="#fff" style={styles.profileIcon} />
          </View>
          <Text style={styles.profileName}>{userDetails.name}</Text>
          <Text style={styles.profileEmail}>{userDetails.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            navigation.navigate('Dashboard', { videoPaths: undefined });
            onClose();
          }}
        >
          <Icon name="history" type="font-awesome" size={20} color="#fff" style={styles.menuIcon} />
          <Text style={styles.menuText}>Trip History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
          <Icon name="sign-out" type="font-awesome" size={20} color="#fff" style={styles.menuIcon} />
          <Text style={styles.menuText}>Log Out</Text>
        </TouchableOpacity>
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Intute.ai. All rights reserved.</Text>
        </View>
      </View>

      {/* Backdrop that closes the menu when clicked */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
    </View>
  );
};

export default SideMenu;