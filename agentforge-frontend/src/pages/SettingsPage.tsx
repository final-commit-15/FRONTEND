// src/pages/SettingsPage.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings';
import type { Settings } from '@/types/api';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { PreferencesSettings } from '@/components/settings/PreferencesSettings';
import { SystemSettings } from '@/components/settings/SystemSettings';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';

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

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Settings" description="Manage your platform preferences and configuration." />
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
          <Card>
            <CardContent className="pt-0">
              <Skeleton variant="card" className="h-96" />
            </CardContent>
          </Card>
        </Tabs>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load settings"
        description={(error as Error).message}
        onRetry={refetch}
      />
    );
  }

  if (!settings) {
    return (
      <ErrorState
        title="Settings not found"
        description="Unable to retrieve platform settings."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Settings" description="Manage your platform preferences and configuration." />

      <Card className="overflow-hidden">
        <Tabs defaultValue="profile">
          <TabsList className="m-4 mb-0">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="animate-fade-in">
            <CardContent className="pt-4">
              {settings.user ? (
                <ProfileSettings user={settings.user} />
              ) : (
                <div className="empty-state py-12">
                  <div className="empty-state-icon">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="empty-state-title">User profile not available</p>
                  <p className="empty-state-description">Unable to load profile settings at this time.</p>
                </div>
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="security" className="animate-fade-in">
            <CardContent className="pt-4">
              {settings.security ? (
                <SecuritySettings security={settings.security} />
              ) : (
                <div className="empty-state py-12">
                  <div className="empty-state-icon">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <p className="empty-state-title">Security settings not available</p>
                  <p className="empty-state-description">Unable to load security settings at this time.</p>
                </div>
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="preferences" className="animate-fade-in">
            <CardContent className="pt-4">
              {settings.preferences ? (
                <PreferencesSettings preferences={settings.preferences} />
              ) : (
                <div className="empty-state py-12">
                  <div className="empty-state-icon">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="empty-state-title">Preferences not available</p>
                  <p className="empty-state-description">Unable to load preferences at this time.</p>
                </div>
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="system" className="animate-fade-in">
            <CardContent className="pt-4">
              {settings.system ? (
                <SystemSettings system={settings.system} />
              ) : (
                <div className="empty-state py-12">
                  <div className="empty-state-icon">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="empty-state-title">System settings not available</p>
                  <p className="empty-state-description">Unable to load system settings at this time.</p>
                </div>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}