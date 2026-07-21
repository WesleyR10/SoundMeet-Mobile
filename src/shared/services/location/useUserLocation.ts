import { useCallback, useState } from 'react';
import * as ExpoLocation from 'expo-location';

export type UserCoords = {
  latitude:  number;
  longitude: number;
};

export type UserLocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

// Localização pontual do usuário (foreground, uma leitura) — SEM tracking
// contínuo de propósito: o caso de uso é "estabelecimentos/eventos num raio
// de X km", que não precisa de watchPosition (privacidade + bateria).
// ⚠️ expo-location é módulo nativo: exige novo build EAS dev client
// (mesma lição do expo-media-library, Bloco 3).
export function useUserLocation() {
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [status, setStatus] = useState<UserLocationStatus>('idle');

  const request = useCallback(async (): Promise<UserCoords | null> => {
    setStatus('requesting');
    try {
      const permission = await ExpoLocation.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setStatus('denied');
        return null;
      }

      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      const next = {
        latitude:  position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setCoords(next);
      setStatus('granted');
      return next;
    } catch {
      setStatus('error');
      return null;
    }
  }, []);

  return { coords, status, request };
}
