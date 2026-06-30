import type { NavigatorScreenParams } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// ── Auth ──────────────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Onboarding: undefined;
  Login:      undefined;
};

// ── Músico — Tabs ─────────────────────────────────────────────────────────────

export type MusicianTabParamList = {
  Home:          undefined;
  LiveDashboard: undefined;
  Repertoire:    undefined;
  Wallet:        undefined;
  Profile:       undefined;
};

// ── Root ──────────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  AuthStack:    NavigatorScreenParams<AuthStackParamList>;
  MusicianTabs: NavigatorScreenParams<MusicianTabParamList>;
};

// ── Helpers de tipagem para screens ───────────────────────────────────────────
// Uso: type Props = AuthScreenProps<'Login'>

export type RootScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

export type MusicianTabScreenProps<T extends keyof MusicianTabParamList> =
  BottomTabScreenProps<MusicianTabParamList, T>;
