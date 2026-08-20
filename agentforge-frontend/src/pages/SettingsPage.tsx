// src/pages/SettingsPage.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings';
import type { Settings } from '@/types/api';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { PreferencesSettings } from '@/components/settings/PreferencesSettings';
import { SystemSettings } from '@/components/settings/SystemSettings';
import { DetailSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/layout/PageHeader';

export function SettingsPage() {
  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });

  if (isLoading) return <DetailSkeleton />;
  if (error) return <ErrorState title="Failed to load settings" description={(error as Error).message} onRetry={refetch} />;
  if (!settings) return <ErrorState title="Settings not found" description="Unable to retrieve platform settings." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your platform preferences and configuration." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {settings.user ? (
            <ProfileSettings user={settings.user} />
          ) : (
            <div className="text-center text-base-500 py-8">User profile not available.</div>
          )}
        </TabsContent>

        <TabsContent value="security">
          {settings.security ? (
            <SecuritySettings security={settings.security} />
          ) : (
            <div className="text-center text-base-500 py-8">Security settings not available.</div>
          )}
        </TabsContent>

        <TabsContent value="preferences">
          {settings.preferences ? (
            <PreferencesSettings preferences={settings.preferences} />
          ) : (
            <div className="text-center text-base-500 py-8">Preferences not available.</div>
          )}
        </TabsContent>

        <TabsContent value="system">
          {settings.system ? (
            <SystemSettings system={settings.system} />
          ) : (
            <div className="text-center text-base-500 py-8">System settings not available.</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}