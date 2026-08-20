import React from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface SystemSettingsProps {
  system: {
    max_concurrent_executions: number;
    log_level: string;
    retention_days: number;
  };
}

export function SystemSettings({ system }: SystemSettingsProps) {
  const { addToast } = useToast();
  const [form, setForm] = React.useState(system);

  const handleSave = () => {
    // Call API
    addToast({ type: 'success', title: 'System settings saved' });
  };

  return (
    <Card className="p-6 max-w-2xl">
      <h2 className="text-lg font-semibold text-white mb-4">System Configuration</h2>
      <div className="space-y-4">
        <Input
          label="Max Concurrent Executions"
          type="number"
          value={form.max_concurrent_executions}
          onChange={(e) => setForm({ ...form, max_concurrent_executions: parseInt(e.target.value) })}
        />
        <Select label="Log Level" value={form.log_level} onChange={(e) => setForm({ ...form, log_level: e.target.value })}>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </Select>
        <Input
          label="Retention Days"
          type="number"
          value={form.retention_days}
          onChange={(e) => setForm({ ...form, retention_days: parseInt(e.target.value) })}
        />
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save System Settings</Button>
        </div>
      </div>
    </Card>
  );
}