import { createPermissionHook } from 'expo';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';

// Mesma fábrica que expo-camera usa internamente pra useCameraPermissions/
// useMicrophonePermissions (createPermissionHook de expo-modules-core) — não
// reaproveitamos o useMicrophonePermissions do expo-camera porque ele é
// escopado ao módulo de câmera (CameraManager) e dispara com a mensagem do
// plugin expo-camera, não a do expo-audio (declarada em app.json pro
// afinador). Retorna a mesma tupla [permission, requestPermission] de
// useCameraPermissions.
export const useMicrophonePermission = createPermissionHook({
  getMethod: getRecordingPermissionsAsync,
  requestMethod: requestRecordingPermissionsAsync,
});
