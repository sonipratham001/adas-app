import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { styles } from './forgotpasswordscreen.styles';
import { getAuth, sendPasswordResetEmail } from '@react-native-firebase/auth';
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

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

type ModalState = {
  isVisible: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
};

const ForgotPasswordScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    isVisible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const auth = getAuth();

  const handleResetPassword = async () => {
    if (!email.includes('@') || email.length < 5) {
      setModalState({
        isVisible: true,
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
      });
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setModalState({
        isVisible: true,
        type: 'success',
        title: 'Email Sent',
        message: 'A password reset link has been sent to your email address.',
      });
      setEmail('');
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      if (error.code === 'auth/user-not-found') {
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'User Not Found',
          message: 'No user found with this email address.',
        });
      } else if (error.code === 'auth/invalid-email') {
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'Invalid Email',
          message: 'Please enter a valid email address.',
        });
      } else {
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'Error',
          message: 'Failed to send password reset email. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isVisible: false }));
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <LinearGradient
      colors={['#F9FAFB', '#E5E7EB']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.innerContainer}
      >
        <Text style={styles.title}>Reset Password</Text>

        <View style={styles.singleInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#6B7280"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && { opacity: 0.6 }]}
          onPress={handleResetPassword}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleBackToLogin}
          style={styles.backToLoginContainer}
          disabled={loading}
        >
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.backToLoginText}>
              Back to{' '}
            </Text>
            <Text style={styles.backToLoginLinkText}>
              Login
            </Text>
          </View>
        </TouchableOpacity>

        <CustomModal
          isVisible={modalState.isVisible}
          type={modalState.type}
          title={modalState.title}
          message={modalState.message}
          onClose={handleCloseModal}
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default ForgotPasswordScreen;