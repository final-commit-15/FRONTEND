// src/components/dashboard/AuthDashboardWidget.tsx
// Admin authentication dashboard widget

import { useQuery } from '@tanstack/react-query';
import { Users, AlertCircle, Building2, UserPlus, AlertTriangle, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/api/client';

export interface AuthDashboardStats {
  total_registered_users: number;
  pending_verifications: number;
  active_organizations: number;
  todays_signups: number;
  failed_otp_attempts: number;
  locked_accounts: number;
  timestamp: string;
}

async function fetchAuthDashboard(): Promise<AuthDashboardStats> {
  const { data } = await apiClient.get<AuthDashboardStats>('/auth/admin/dashboard');
  return data;
}

const statCards = [
  {
    key: 'total_registered_users',
    label: 'Total Registered Users',
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    key: 'active_organizations',
    label: 'Active Organizations',
    icon: Building2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    key: 'todays_signups',
    label: "Today's Signups",
    icon: UserPlus,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    key: 'pending_verifications',
    label: 'Pending Verifications',
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  {
    key: 'failed_otp_attempts',
    label: 'Failed OTP Attempts (Today)',
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    key: 'locked_accounts',
    label: 'Locked Accounts',
    icon: Lock,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
] as const;

export function AuthDashboardWidget() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['auth', 'dashboard'],
    queryFn: fetchAuthDashboard,
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map(() => (
            <div key={Math.random()} className="animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-8 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-error-600">
          Failed to load authentication dashboard
          <button
            onClick={() => refetch()}
            className="ml-2 text-sm underline hover:text-error-700"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-semibold text-text-heading">
          Authentication Monitor
        </h2>
        <span className="text-xs text-text-muted">
          Updated: {data ? new Date(data.timestamp).toLocaleTimeString() : '—'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(({ key, label, icon: Icon, color, bgColor }) => (
          <div
            key={key}
            className="p-4 bg-canvas-surface rounded-xl border border-canvas-border"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${bgColor}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-text-muted font-medium">{label}</p>
                  <p className="font-heading text-2xl font-bold text-text-heading">
                    {data?.[key as keyof AuthDashboardStats] ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}