import type { SupabaseClient } from '@/db/supabase.client';
import type { UserPreferences } from '@/types';
import type { Json } from '@/db/types';
import { castPreferences } from '@/types';

export interface ProfileData {
  id: string;
  display_name: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  preferences: UserPreferences;
}

export interface UpdateProfileDto {
  display_name?: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  preferences?: Partial<UserPreferences>;
}

export const profileService = {
  async getProfile(supabase: SupabaseClient, userId: string): Promise<ProfileData | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (error || !data) return null;

    return {
      id: data.id,
      display_name: data.display_name,
      username: data.username,
      bio: data.bio,
      avatar_url: data.avatar_url,
      preferences: castPreferences(data.preferences),
    };
  },

  async isUsernameTaken(
    supabase: SupabaseClient,
    username: string,
    excludeUserId: string,
  ): Promise<boolean> {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', excludeUserId)
      .maybeSingle();
    return data !== null;
  },

  async updateProfile(
    supabase: SupabaseClient,
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileData> {
    // If updating preferences, merge with existing
    let preferencesUpdate: Json | undefined;
    if (dto.preferences) {
      const existing = await profileService.getProfile(supabase, userId);
      const merged = { ...(existing?.preferences ?? {}), ...dto.preferences };
      preferencesUpdate = merged as unknown as Json;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...(dto.display_name !== undefined && { display_name: dto.display_name }),
        ...(dto.username !== undefined && { username: dto.username }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatar_url !== undefined && { avatar_url: dto.avatar_url }),
        ...(preferencesUpdate !== undefined && { preferences: preferencesUpdate }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Failed to update profile');

    return {
      id: data.id,
      display_name: data.display_name,
      username: data.username,
      bio: data.bio,
      avatar_url: data.avatar_url,
      preferences: castPreferences(data.preferences),
    };
  },
};
