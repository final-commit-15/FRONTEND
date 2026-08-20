import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface SecuritySettingsProps {
  security: {
    two_factor_enabled: boolean;
    last_password_change: string;
  };
}

export function SecuritySettings({ security }: SecuritySettingsProps) {
  return (
    <Card className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-white mb-4">Security</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
            <p className="text-sm text-base-500">Add an extra layer of security to your account.</p>
          </div>
          <Badge variant={security.two_factor_enabled ? 'success' : 'neutral'}>
            {security.two_factor_enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Password Last Changed</p>
            <p className="text-sm text-base-500">{security.last_password_change}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}