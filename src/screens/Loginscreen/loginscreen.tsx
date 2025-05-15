import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { styles } from './loginscreen.styles';
import { getAuth, signInWithEmailAndPassword } from '@react-native-firebase/auth';
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

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type ModalState = {
  isVisible: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
};

const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    isVisible: false,
    type: 'error',
    title: '',
    message: '',
  });

  const auth = getAuth();

  const handleLogin = async () => {
    if (!email.includes('@') || email.length < 5) {
      setModalState({
        isVisible: true,
        type: 'error',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
      });
      return;
    }
    if (password.length < 6) {
      setModalState({
        isVisible: true,
        type: 'error',
        title: 'Invalid Password',
        message: 'Password must be at least 6 characters.',
      });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in with email:', userCredential.user.uid);
      setModalState({
        isVisible: true,
        type: 'success',
        title: 'Login Successful',
        message: 'You have successfully logged in!',
      });
    } catch (error: any) {
      console.error('Error during login:', error);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      if (error.code === 'auth/user-not-found') {
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'User Not Found',
          message: 'No account exists with this email.',
        });
      } else if (error.code === 'auth/wrong-password') {
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'Incorrect Password',
          message: 'The password you entered is incorrect.',
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
          message: error.message || 'Failed to log in. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupRedirect = () => {
    console.log('Navigate to Signup Screen');
    navigation.navigate('Signup');
  };

  const handleForgotPassword = () => {
    console.log('Navigate to Forgot Password Screen');
    navigation.navigate('ForgotPassword');
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isVisible: false }));
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
        <Text style={styles.title}>Login</Text>

        <View style={styles.singleInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#6B7280"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#6B7280"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={loading}>
            <Icon name={showPassword ? 'eye' : 'eye-off'} size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Forgot Password Link */}
        <TouchableOpacity
          onPress={handleForgotPassword}
          style={styles.forgotPasswordContainer}
          disabled={loading}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleSignupRedirect} style={styles.signupRedirectContainer} disabled={loading}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.signupText}>
              Not registered yet?{' '}
            </Text>
            <Text style={styles.signupLinkText}>
              Sign up
            </Text>
          </View>
        </TouchableOpacity>

        {/* Custom Modal */}
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

export default LoginScreen;