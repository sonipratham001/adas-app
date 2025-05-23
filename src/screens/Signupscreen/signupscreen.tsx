import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { styles } from './signupscreen.styles';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from '@react-native-firebase/auth';
import CustomModal from '../../Modal/CustomModal';

// Define navigation params to match RootStackParamList
interface SignupScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

type ModalState = {
  isVisible: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
};

const SignupScreen = ({ navigation }: SignupScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    isVisible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const auth = getAuth();

  const handleSignup = async () => {
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created with email and password:', userCredential.user.uid);
      
      // Update the user's profile with the full name
      await updateProfile(userCredential.user, {
        displayName: fullName,
      });
      console.log('User profile updated with full name:', fullName);
      
      // Retrieve the Firebase ID token
      const token = await userCredential.user.getIdToken();
      console.log('Firebase ID Token:', token);
      setModalState({
        isVisible: true,
        type: 'success',
        title: 'Signup Successful',
        message: 'User created! Check the console for the Firebase ID token.',
      });

      // Navigate to HomeScreen with necessary params (excluding password)
      navigation.navigate('Home', {
        email,
        fullName,
        userId: userCredential.user.uid,
      });
    } catch (error: any) {
      console.error('Error during signup:', error);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      if (error.code === 'auth/email-already-in-use') {
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'Email in Use',
          message: 'This email is already registered.',
        });
      } else if (error.code === 'auth/invalid-email') {
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'Invalid Email',
          message: 'Please enter a valid email address.',
        });
      } else if (error.code === 'auth/weak-password') {
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'Weak Password',
          message: 'Password must be at least 6 characters.',
        });
      } else {
        setModalState({
          isVisible: true,
          type: 'error',
          title: 'Error',
          message: error.message || 'Failed to sign up. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    console.log('Navigate to Login Screen');
    navigation.navigate('Login');
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
        <Text style={styles.title}>Create an Account</Text>

        <View style={styles.singleInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#6B7280"
            autoCapitalize="words"
            value={fullName}
            onChangeText={setFullName}
            editable={!loading}
          />
        </View>

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

        <View style={styles.singleInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#6B7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && { opacity: 0.6 }]}
          onPress={handleSignup}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLoginRedirect} style={styles.loginRedirectContainer} disabled={loading}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.loginText}>
              Already have an account?{' '}
            </Text>
            <Text style={styles.loginLinkText}>
              Login
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

export default SignupScreen;