import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileTab } from './components/ProfileTab';
import { PreferencesTab } from './components/PreferencesTab';
import { AccountTab } from './components/AccountTab';
import type { ProfileData } from '@/lib/services/profile.service';

interface SettingsIslandProps {
  profile: ProfileData;
  email: string;
}

export const SettingsIsland: React.FC<SettingsIslandProps> = ({ profile, email }) => (
  <div className="mx-auto max-w-2xl px-4 py-8">
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-text-primary">Ustawienia</h1>
      <p className="mt-1 text-sm text-text-muted">Zarządzaj swoim profilem i preferencjami</p>
    </div>

    <Tabs defaultValue="profile">
      <TabsList className="mb-6 grid w-full grid-cols-3">
        <TabsTrigger value="profile">Profil</TabsTrigger>
        <TabsTrigger value="preferences">Preferencje</TabsTrigger>
        <TabsTrigger value="account">Konto</TabsTrigger>
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
    </Tabs>
  </div>
);

export default SettingsIsland;
