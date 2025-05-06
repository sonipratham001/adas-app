import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth'; // Use modular API
import SignupScreen from './src/screens/Signupscreen/signupscreen';
import OTPVerificationScreen from './src/screens/OTPscreen/otpscreen';
import HomeScreen from './src/screens/Homescreen/homescreen';
import LoginScreen from './src/screens/Loginscreen/loginscreen';
import DashboardScreen from './src/screens/Dashboard/dashboard';

// Define the type for the navigation stack
type RootStackParamList = {
  Signup: undefined;
  OTP: undefined;
  Home: undefined;
  Login: undefined;
  Dashboard: { videoPaths?: string[] };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Check auth state on app start
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      setUser(user);
      if (initializing) setInitializing(false);
    });

    return unsubscribe; // Cleanup subscription on unmount
  }, [initializing]);

  if (initializing) {
    return null; // You can replace with a loading spinner if desired
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <>
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen name="OTP" component={OTPVerificationScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;