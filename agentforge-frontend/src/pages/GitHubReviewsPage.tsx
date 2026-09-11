import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, XCircle, Loader2, RefreshCw, ExternalLink, FolderKanban, GitBranch, Users, Clock, AlertTriangle, MessageSquare, Code, Search, Filter, ChevronDown } from 'lucide-react';
import { Suspense } from 'react';

import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface Repository {
  id: string;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  updated_at: string;
}

interface Branch {
  name: string;
  commit_sha: string;
  protected: boolean;
}

interface PullRequest {
  id: string;
  number: number;
  title: string;
  state: string;
  html_url: string;
  author: string;
  created_at: string;
  updated_at: string;
  draft: boolean;
  review_decision?: string;
}

interface Contributor {
  login: string;
  avatar_url: string;
  contributions: number;
}

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface WebhookStatus {
  active: boolean;
  url?: string;
  events: string[];
  last_delivery?: string;
}

interface GitHubDashboard {
  repositories: Repository[];
  branches: Branch[];
  pull_requests: PullRequest[];
  contributors: Contributor[];
  recent_commits: Commit[];
  webhook_status: WebhookStatus;
}

const githubApi = {
  getDashboard: async (): Promise<GitHubDashboard> => {
    const { data } = await apiClient.get<GitHubDashboard>('/github-reviews/dashboard');
    return data;
  },
  listRepositories: async (): Promise<Repository[]> => {
    const { data } = await apiClient.get<Repository[]>('/github-reviews/repositories');
    return data;
  },
  listBranches: async (owner: string, repo: string): Promise<Branch[]> => {
    const { data } = await apiClient.get<Branch[]>(`/github-reviews/repositories/${owner}/${repo}/branches`);
    return data;
  },
  listPullRequests: async (owner: string, repo: string, state: string = 'open'): Promise<PullRequest[]> => {
    const { data } = await apiClient.get<PullRequest[]>(`/github-reviews/repositories/${owner}/${repo}/pull-requests`, { params: { state } });
    return data;
  },
  listContributors: async (owner: string, repo: string): Promise<Contributor[]> => {
    const { data } = await apiClient.get<Contributor[]>(`/github-reviews/repositories/${owner}/${repo}/contributors`);
    return data;
  },
  listCommits: async (owner: string, repo: string, branch: string = 'main', limit: number = 20): Promise<Commit[]> => {
    const { data } = await apiClient.get<Commit[]>(`/github-reviews/repositories/${owner}/${repo}/commits`, { params: { branch, limit } });
    return data;
  },
  getWebhookStatus: async (owner: string, repo: string): Promise<WebhookStatus> => {
    const { data } = await apiClient.get<WebhookStatus>(`/github-reviews/repositories/${owner}/${repo}/webhook-status`);
    return data;
  },
  createWebhook: async (owner: string, repo: string): Promise<WebhookStatus> => {
    const { data } = await apiClient.post<WebhookStatus>(`/github-reviews/repositories/${owner}/${repo}/webhook`);
    return data;
  },
  deleteWebhook: async (owner: string, repo: string): Promise<void> => {
    await apiClient.delete(`/github-reviews/repositories/${owner}/${repo}/webhook`);
  },
};

const PR_STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-500/20 text-green-400',
  closed: 'bg-gray-500/20 text-gray-400',
  merged: 'bg-purple-500/20 text-purple-400',
};

const REVIEW_DECISION_COLORS: Record<string, string> = {
  APPROVED: 'bg-green-500/20 text-green-400',
  CHANGES_REQUESTED: 'bg-red-500/20 text-red-400',
  REVIEW_REQUIRED: 'bg-yellow-500/20 text-yellow-400',
};

function GitHubOnboarding() {
  const { addToast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async (type: 'org' | 'repo') => {
    setIsConnecting(true);
    try {
      // Redirect to GitHub OAuth
      const redirectUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/auth/github?type=${type}`;
      window.location.href = redirectUrl;
    } catch (error) {
      addToast({ type: 'error', title: 'Connection failed', description: 'Failed to initiate GitHub connection' });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center py-12">
        <div className="w-20 h-20 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-6">
          <GitBranch className="h-10 w-10 text-brand-primary" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-text-heading mb-4">Connect your GitHub Organization</h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto mb-8">
          Connect GitHub to review pull requests, track repository activity, and automate your development workflow with AI agents.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" icon={<GitBranch className="h-5 w-5" />} onClick={() => handleConnect('org')} disabled={isConnecting}>
            {isConnecting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Connect Organization'}
          </Button>
          <Button size="lg" variant="outline" icon={<FolderKanban className="h-5 w-5" />} onClick={() => handleConnect('repo')} disabled={isConnecting}>
            Connect Repository
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
            <GitBranch className="h-6 w-6 text-green-500" />
          </div>
          <h3 className="font-semibold text-text-heading mb-2">Pull Request Reviews</h3>
          <p className="text-text-muted text-sm">AI-powered PR reviews with automated suggestions and quality checks</p>
        </Card>
        <Card className="p-6">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
            <Code className="h-6 w-6 text-blue-500" />
          </div>
          <h3 className="font-semibold text-text-heading mb-2">Repository Insights</h3>
          <p className="text-text-muted text-sm">Track branches, commits, contributors, and repository health metrics</p>
        </Card>
        <Card className="p-6">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-purple-500" />
          </div>
          <h3 className="font-semibold text-text-heading mb-2">Team Collaboration</h3>
          <p className="text-text-muted text-sm">Monitor team activity, review assignments, and contribution patterns</p>
        </Card>
      </div>
    </div>
  );
}

function GitHubDashboard() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [prState, setPrState] = useState<'open' | 'closed' | 'all'>('open');
  const [searchPR, setSearchPR] = useState('');

  const { data: dashboard, isLoading, error, refetch } = useQuery<GitHubDashboard>({
    queryKey: ['github-dashboard'],
    queryFn: githubApi.getDashboard,
    retry: false,
  });

  const createWebhookMutation = useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) => githubApi.createWebhook(owner, repo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-dashboard'] });
      addToast({ type: 'success', title: 'Webhook created', description: 'GitHub webhook has been configured.' });
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Failed to create webhook', description: error.message });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: ({ owner, repo }: { owner: string; repo: string }) => githubApi.deleteWebhook(owner, repo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['github-dashboard'] });
      addToast({ type: 'success', title: 'Webhook removed', description: 'GitHub webhook has been removed.' });
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Failed to remove webhook', description: error.message });
    },
  });

  if (error) {
    // If 404, show onboarding
    return <GitHubOnboarding />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton variant="title" className="w-56" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton variant="card" className="h-64" />
          <Skeleton variant="card" className="h-64" />
        </div>
      </div>
    );
  }

  if (!dashboard?.repositories || dashboard.repositories.length === 0) {
    return <GitHubOnboarding />;
  }

  const repos = dashboard.repositories;
  const activeRepo = selectedRepo || repos[0];
  const prs = dashboard.pull_requests || [];
  const filteredPRs = prs.filter(pr => {
    if (prState !== 'all' && pr.state !== prState) return false;
    if (searchPR && !pr.title.toLowerCase().includes(searchPR.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-heading">GitHub Reviews</h1>
          <p className="text-text-body mt-1">Review pull requests and monitor repository activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Select value={activeRepo.full_name} onChange={(v) => {
              const repo = repos.find(r => r.full_name === v);
              if (repo) setSelectedRepo(repo);
            }}>
              {repos.map(repo => (
                <option key={repo.full_name} value={repo.full_name}>
                  {repo.name} {repo.private && <Lock className="h-3 w-3 inline" />}
                </option>
              ))}
            </Select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} icon={<RefreshCw className="h-4 w-4" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Repository Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Pull Requests</p>
              <p className="font-heading text-2xl font-bold text-text-heading">{prs.filter(p => p.state === 'open').length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <GitBranch className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Branches</p>
              <p className="font-heading text-2xl font-bold text-text-heading">{dashboard.branches?.length || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Code className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Contributors</p>
              <p className="font-heading text-2xl font-bold text-text-heading">{dashboard.contributors?.length || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Webhook Status</p>
              <Badge className={dashboard.webhook_status?.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                {dashboard.webhook_status?.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="prs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prs">Pull Requests</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="commits">Recent Commits</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
        </TabsList>

        <TabsContent value="prs">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Input placeholder="Search PRs..." value={searchPR} onChange={(e) => setSearchPR(e.target.value)} className="pl-10" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            </div>
            <div className="flex gap-2">
              {(['open', 'closed', 'all'] as const).map(state => (
                <Button
                  key={state}
                  variant={prState === state ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setPrState(state)}
                >
                  {state.charAt(0).toUpperCase() + state.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          {filteredPRs.length === 0 ? (
            <EmptyState title="No pull requests" description="No pull requests match your filters" />
          ) : (
            <div className="space-y-3">
              {filteredPRs.map(pr => (
                <Card key={pr.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-text-muted">#{pr.number}</span>
                        <h4 className="font-semibold text-text-heading truncate">{pr.title}</h4>
                        <Badge className={PR_STATUS_COLORS[pr.state] || 'bg-gray-500/20 text-gray-400'}>{pr.state}</Badge>
                        {pr.review_decision && (
                          <Badge className={REVIEW_DECISION_COLORS[pr.review_decision] || 'bg-gray-500/20 text-gray-400'}>
                            {pr.review_decision.replace('_', ' ')}
                          </Badge>
                        )}
                        {pr.draft && <Badge className="bg-gray-500/20 text-gray-400">Draft</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {pr.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDistanceToNow(new Date(pr.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => window.open(pr.html_url, '_blank')} icon={<ExternalLink className="h-3.5 w-3.5" />}>
                        View
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="branches">
          {dashboard.branches?.length === 0 ? (
            <EmptyState title="No branches" description="No branches found for this repository" />
          ) : (
            <div className="space-y-3">
              {dashboard.branches.map((branch, i) => (
                <Card key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GitBranch className="h-5 w-5 text-text-muted" />
                    <div>
                      <p className="font-medium text-text-heading">{branch.name}</p>
                      <p className="text-sm text-text-muted font-mono">{branch.commit_sha.slice(0, 7)}</p>
                    </div>
                  </div>
                  {branch.protected && (
                    <Badge className="bg-blue-500/20 text-blue-400">Protected</Badge>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="commits">
          {dashboard.recent_commits?.length === 0 ? (
            <EmptyState title="No commits" description="No recent commits found" />
          ) : (
            <div className="space-y-3">
              {dashboard.recent_commits.map((commit, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-text-heading mb-1">{commit.message}</p>
                      <div className="flex items-center gap-4 text-sm text-text-muted">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {commit.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDistanceToNow(new Date(commit.date), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.open(commit.url, '_blank')} icon={<ExternalLink className="h-3.5 w-3.5" />}>
                      View
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="contributors">
          {dashboard.contributors?.length === 0 ? (
            <EmptyState title="No contributors" description="No contributors found for this repository" />
          ) : (
            <div className="space-y-3">
              {dashboard.contributors.map((contributor, i) => (
                <Card key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={contributor.avatar_url} alt={contributor.login} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-medium text-text-heading">{contributor.login}</p>
                      <p className="text-sm text-text-muted">{contributor.contributions} contributions</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

<TabsContent value="webhook">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-heading mb-1">GitHub Webhook</h3>
                <p className="text-text-muted text-sm">Configure webhook to receive real-time events from GitHub</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={dashboard.webhook_status?.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                  {dashboard.webhook_status?.active ? 'Active' : 'Inactive'}
                </Badge>
                {dashboard.webhook_status?.active ? (
                  <Button variant="outline" size="sm" onClick={() => deleteWebhookMutation.mutate({ owner: activeRepo.full_name.split('/')[0], repo: activeRepo.full_name.split('/')[1] })} disabled={deleteWebhookMutation.isPending}>
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Remove Webhook
                  </Button>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => createWebhookMutation.mutate({ owner: activeRepo.full_name.split('/')[0], repo: activeRepo.full_name.split('/')[1] })} disabled={createWebhookMutation.isPending}>
                    {createWebhookMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Create Webhook
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            {dashboard.webhook_status?.active && (
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-text-muted">Webhook URL: <code className="text-text-heading">{dashboard.webhook_status.url}</code></p>
                <p className="text-text-muted">Events: {dashboard.webhook_status.events.join(', ')}</p>
                {dashboard.webhook_status.last_delivery && (
                  <p className="text-text-muted">Last delivery: {formatDistanceToNow(new Date(dashboard.webhook_status.last_delivery!), { addSuffix: true })}</p>
                )}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Lock } from 'lucide-react';

export function GitHubReviewsPage() {
  return <GitHubDashboard />;
}