import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import SignupScreen from './src/screens/Signupscreen/signupscreen';
import OTPVerificationScreen from './src/screens/OTPscreen/otpscreen';
import HomeScreen from './src/screens/Homescreen/homescreen';
import LoginScreen from './src/screens/Loginscreen/loginscreen';
import DashboardScreen from './src/screens/Dashboard/dashboard';
import CameraScreen from './src/screens/CameraScreen/CameraScreen';
import SideMenu from './src/screens/SideMenu/SideMenu';
import ForgotPasswordScreen from './src/screens/ForgotPassword/ForgotPasswordScreen';
import VideoPlaybackScreen from './src/screens/VideoPlayBack/VideoPlayBackScreen';

// Define the type for the navigation stack
type RootStackParamList = {
  Signup: undefined;
  OTP: undefined;
  Home: undefined;
  Login: undefined;
Dashboard: { videoPaths?: string[]; deletedVideoId?: string };
  Camera: undefined;
  SideMenu: undefined;
  ForgotPassword: undefined;
  VideoPlayback: { videoUrl: string; videoId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return null; // Replace with a loading spinner if desired
  }

  // Define screens based on authentication state
  const renderScreens = () => {
    if (!user) {
      return (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="OTP" component={OTPVerificationScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      );
    }
    return (
      <>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="SideMenu" component={SideMenu} />
        <Stack.Screen name="VideoPlayback" component={VideoPlaybackScreen} options={{ headerShown: false }} />
      </>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={user ? 'Home' : 'Login'} // Dynamic initial route
        >
          {renderScreens()}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;