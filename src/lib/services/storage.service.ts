import type { SupabaseClient } from '@/db/supabase.client';

const BUCKET = 'avatars';
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export interface UploadAvatarResult {
  publicUrl: string;
}

export const storageService = {
  validateFile(file: File): string | null {
    if (!file.type.startsWith('image/')) return 'Plik musi być obrazem.';
    if (file.size > MAX_SIZE_BYTES) return 'Plik nie może przekraczać 2 MB.';
    return null;
  },

  async uploadAvatar(
    supabase: SupabaseClient,
    userId: string,
    file: File,
  ): Promise<UploadAvatarResult> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { publicUrl: data.publicUrl };
  },
};
