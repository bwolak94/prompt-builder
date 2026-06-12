import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileTab } from './components/ProfileTab';
import { PreferencesTab } from './components/PreferencesTab';
import { AccountTab } from './components/AccountTab';
import { RestApiKeysPanel } from './RestApiKeysPanel';
import { WebhooksPanel } from './WebhooksPanel';
import type { ProfileData } from '@/lib/services/profile.service';

interface SettingsIslandProps {
  profile: ProfileData;
  email: string;
  lang?: 'pl' | 'en';
}

export const SettingsIsland: React.FC<SettingsIslandProps> = ({ profile, email, lang = 'pl' }) => (
  <div className="mx-auto max-w-2xl px-4 py-8">
    <div className="mb-8">
      <h1 className="text-text-primary text-2xl font-semibold">
        {lang === 'pl' ? 'Ustawienia' : 'Settings'}
      </h1>
      <p className="text-text-muted mt-1 text-sm">
        {lang === 'pl'
          ? 'Zarządzaj swoim profilem i preferencjami'
          : 'Manage your profile and preferences'}
      </p>
    </div>

    <Tabs defaultValue="profile">
      <TabsList className="mb-6 grid w-full grid-cols-5">
        <TabsTrigger value="profile">{lang === 'pl' ? 'Profil' : 'Profile'}</TabsTrigger>
        <TabsTrigger value="preferences">
          {lang === 'pl' ? 'Preferencje' : 'Preferences'}
        </TabsTrigger>
        <TabsTrigger value="account">{lang === 'pl' ? 'Konto' : 'Account'}</TabsTrigger>
        <TabsTrigger value="api-keys">API</TabsTrigger>
        <TabsTrigger value="integrations">
          {lang === 'pl' ? 'Integracje' : 'Integrations'}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileTab profile={profile} />
      </TabsContent>

      <TabsContent value="preferences">
        <PreferencesTab preferences={profile.preferences} />
      </TabsContent>

      <TabsContent value="account">
        <AccountTab email={email} />
      </TabsContent>

      <TabsContent value="api-keys">
        <RestApiKeysPanel lang={lang} />
      </TabsContent>

      <TabsContent value="integrations">
        <WebhooksPanel lang={lang} />
      </TabsContent>
    </Tabs>
  </div>
);

export default SettingsIsland;
