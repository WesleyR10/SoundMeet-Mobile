import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { Home, Radio, Music, Wallet, User } from 'lucide-react-native';
import { colors } from '@/shared/design-system/tokens';
import type { MusicianTabParamList } from './types';

const Tab = createBottomTabNavigator<MusicianTabParamList>();

const ICON_SIZE = 24;

// Factory de placeholder — cada screen substituída no seu bloco
function makePlaceholder(label: string) {
  return function PlaceholderScreen() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.primary }}>
        <Text style={{ color: colors.brand.primary, fontSize: 20, fontFamily: 'SpaceGrotesk-Bold' }}>
          {label}
        </Text>
        <Text style={{ color: colors.text.muted, fontSize: 12, marginTop: 6, fontFamily: 'Inter-Regular' }}>
          Em desenvolvimento
        </Text>
      </View>
    );
  };
}

export function MusicianTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor:    colors.bg.surface,
          borderTopColor:     colors.border.default,
          height:             60,
          paddingBottom:      8,
          paddingTop:         4,
        },
        tabBarActiveTintColor:   colors.brand.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontSize:   11,
          fontFamily: 'Inter-Medium',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={makePlaceholder('Início')}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon:  ({ color }) => <Home size={ICON_SIZE} color={color} />,
        }}
      />
      <Tab.Screen
        name="LiveDashboard"
        component={makePlaceholder('Ao Vivo')}
        options={{
          tabBarLabel: 'Ao Vivo',
          tabBarIcon:  ({ color }) => <Radio size={ICON_SIZE} color={color} />,
        }}
      />
      <Tab.Screen
        name="Repertoire"
        component={makePlaceholder('Repertório')}
        options={{
          tabBarLabel: 'Repertório',
          tabBarIcon:  ({ color }) => <Music size={ICON_SIZE} color={color} />,
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={makePlaceholder('Gorjetas')}
        options={{
          tabBarLabel: 'Gorjetas',
          tabBarIcon:  ({ color }) => <Wallet size={ICON_SIZE} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={makePlaceholder('Perfil')}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon:  ({ color }) => <User size={ICON_SIZE} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
