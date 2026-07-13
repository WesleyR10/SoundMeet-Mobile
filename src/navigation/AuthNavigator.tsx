import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen }              from '@/features/auth/ui/screens/OnboardingScreen';
import { RoleSelectionScreen }           from '@/features/auth/ui/screens/RoleSelectionScreen';
import { RegisterScreen }                from '@/features/auth/ui/screens/RegisterScreen';
import { LoginScreen }                   from '@/features/auth/ui/screens/LoginScreen';
import { CompleteMusicianSignupScreen }  from '@/features/auth/ui/screens/CompleteMusicianSignupScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown:    false,
        animation:      'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="Onboarding"             component={OnboardingScreen} />
      <Stack.Screen name="RoleSelection"          component={RoleSelectionScreen} />
      <Stack.Screen name="Register"               component={RegisterScreen} />
      <Stack.Screen name="Login"                  component={LoginScreen} />
      <Stack.Screen name="CompleteMusicianSignup" component={CompleteMusicianSignupScreen} />
    </Stack.Navigator>
  );
}
