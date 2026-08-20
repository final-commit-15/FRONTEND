import React from 'react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface PreferencesSettingsProps {
  preferences: {
    theme: 'dark' | 'light';
    notifications_enabled: boolean;
    email_notifications: boolean;
    default_agent_timeout: number;
  };
}

export function PreferencesSettings({ preferences }: PreferencesSettingsProps) {
  const { addToast } = useToast();
  const [form, setForm] = React.useState(preferences);

  const handleSave = () => {
    // Call API
    addToast({ type: 'success', title: 'Preferences saved' });
  };

  return (
    <Card className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-white mb-4">Preferences</h2>
      <div className="space-y-4">
        <div>
          <Select label="Theme" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value as 'dark' | 'light' })}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </Select>
        </div>
        <div>
          <Input
            label="Default Agent Timeout (seconds)"
            type="number"
            value={form.default_agent_timeout}
            onChange={(e) => setForm({ ...form, default_agent_timeout: parseInt(e.target.value) })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">Enable Notifications</span>
          <input
            type="checkbox"
            checked={form.notifications_enabled}
            onChange={(e) => setForm({ ...form, notifications_enabled: e.target.checked })}
            className="rounded border-base-700 bg-base-800"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">Email Notifications</span>
          <input
            type="checkbox"
            checked={form.email_notifications}
            onChange={(e) => setForm({ ...form, email_notifications: e.target.checked })}
            className="rounded border-base-700 bg-base-800"
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Preferences</Button>
        </div>
      </div>
    </Card>
  );
}