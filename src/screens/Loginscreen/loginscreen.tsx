import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { styles } from './loginscreen.styles';
import { getAuth, signInWithEmailAndPassword } from '@react-native-firebase/auth';

// Define navigation params to match RootStackParamList
interface LoginScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const auth = getAuth();

  const handleLogin = async () => {
    if (!email.includes('@') || email.length < 5) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in with email:', userCredential.user.uid);

      // Navigate to HomeScreen with necessary params
      navigation.navigate('Home', {
        email,
        userId: userCredential.user.uid,
      });
    } catch (error: any) {
      console.error('Error during login:', error);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      if (error.code === 'auth/user-not-found') {
        Alert.alert('User Not Found', 'No account exists with this email.');
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Incorrect Password', 'The password you entered is incorrect.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else {
        Alert.alert('Error', error.message || 'Failed to log in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupRedirect = () => {
    console.log('Navigate to Signup Screen');
    navigation.navigate('Signup');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
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

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleLogin}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSignupRedirect} style={{ marginTop: 20 }} disabled={loading}>
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ color: '#6B7280', fontSize: 16 }}>
            Not registered yet?{' '}
          </Text>
          <Text style={{ fontWeight: 'bold', color: '#2563EB', fontSize: 16 }}>
            Sign up
          </Text>
        </View>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;