import React, { useState, useRef, useCallback } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ProfileData } from '@/lib/services/profile.service';

interface ProfileTabProps {
  profile: ProfileData;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ profile }) => {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [username, setUsername] = useState(profile.username ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    if (!file.type.startsWith('image/')) {
      setAvatarError('Plik musi być obrazem.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Plik nie może przekraczać 2 MB.');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMsg(null);

    try {
      let avatarUrl: string | undefined;

      // Upload avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadRes = await fetch('/api/user/avatar', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const json = (await uploadRes.json()) as { data?: { publicUrl: string } };
          avatarUrl = json.data?.publicUrl;
        }
      }

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          username: username || undefined,
          bio: bio || undefined,
          ...(avatarUrl && { avatar_url: avatarUrl }),
        }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? 'Błąd zapisu');
      }

      setSaveStatus('ok');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Błąd zapisu profilu');
    } finally {
      setIsSaving(false);
    }
  }, [displayName, username, bio, avatarFile]);

  return (
    <div className="flex flex-col gap-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar"
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/20 text-xl font-bold text-brand-400">
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-primary"
          >
            <Upload size={12} aria-hidden="true" /> Zmień avatar
          </button>
          {avatarError && <p className="mt-1 text-xs text-red-400">{avatarError}</p>}
          <p className="mt-1 text-[10px] text-text-muted">Max 2 MB, JPG/PNG/WebP</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Wybierz avatar"
          />
        </div>
      </div>

      {/* Display name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="display-name" className="text-xs">Wyświetlana nazwa</Label>
        <Input
          id="display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={100}
          placeholder="Twoja nazwa"
        />
      </div>

      {/* Username */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username" className="text-xs">Nazwa użytkownika</Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">@</span>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            maxLength={30}
            placeholder="nazwa_uzytkownika"
            className="pl-7"
          />
        </div>
        <p className="text-[10px] text-text-muted">Tylko małe litery, cyfry, _ i -</p>
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio" className="text-xs">Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Kilka słów o sobie…"
        />
        <p className="text-right text-[10px] text-text-muted">{bio.length}/500</p>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          {isSaving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          Zapisz profil
        </button>
        {saveStatus === 'ok' && (
          <span className="text-xs text-emerald-400">Zapisano!</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-xs text-red-400">{errorMsg}</span>
        )}
      </div>
    </div>
  );
};
