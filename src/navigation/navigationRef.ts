import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

// Ref imperativo do NavigationContainer — necessário pra navegar a partir de
// fora da árvore de componentes de navegação (ex.: listener de notificação
// push, Bloco 5.6), já que hooks como useNavigation só funcionam dentro dela.
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
