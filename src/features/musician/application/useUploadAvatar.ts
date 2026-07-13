import { useMutation } from '@tanstack/react-query';
import { uploadMusicianAvatar, type MusicianAvatarFile } from '../infrastructure/musician.api';
import { extractApiMessage } from '@/shared/services/http/types';

export function useUploadAvatar(musicianId: string | null) {
  return useMutation({
    mutationFn: (file: MusicianAvatarFile) => {
      if (!musicianId) throw new Error('musicianId ausente na sessão');
      return uploadMusicianAvatar(musicianId, file);
    },
  });
}

export function getUploadAvatarErrorMessage(error: unknown): string {
  return extractApiMessage(error);
}
