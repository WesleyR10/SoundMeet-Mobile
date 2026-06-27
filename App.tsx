import { StatusBar } from 'expo-status-bar';
import { StatusBar as RNStatusBar, Text, TouchableOpacity, View } from 'react-native';
import { ThemeProvider } from './src/shared/services/ThemeContext';
import { useTheme } from './src/shared/hooks/useTheme';

function Root() {
  const { colors, isDark, toggle } = useTheme();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.primary }}>
      {/* RNStatusBar → backgroundColor Android | expo StatusBar → estilo dos ícones */}
      <RNStatusBar backgroundColor={colors.bg.primary} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Text style={{ color: colors.brand.primary, fontSize: 28, fontWeight: 'bold' }}>
        SoundMeet
      </Text>
      <Text style={{ color: colors.text.secondary, fontSize: 15, marginTop: 8 }}>
        Onde o som encontra pessoas
      </Text>

      {/* Toggle temporário para teste — será removido quando a Settings screen existir */}
      <TouchableOpacity
        onPress={toggle}
        style={{ marginTop: 32, padding: 12, borderRadius: 8, backgroundColor: colors.brand.muted }}
      >
        <Text style={{ color: colors.brand.primary, fontWeight: '600' }}>
          {isDark ? '☀️  Modo Claro' : '🌙  Modo Escuro'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}
