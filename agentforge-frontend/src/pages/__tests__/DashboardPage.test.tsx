import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { waitFor } from "@testing-library/dom";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardPage } from "../DashboardPage";

vi.mock("../../api/analytics", () => ({
  analyticsApi: {
    getOverview: vi.fn().mockResolvedValue({
      total_agents: 12,
      total_executions: 150,
      success_rate: 98,
      active_workflows: 6,
    }),
    getDashboardKPIs: vi.fn().mockResolvedValue({
      active_projects: 2,
      active_sprint: { id: "s1", name: "Sprint 1", completion: 65 },
      sprint_completion: 65,
      story_points_total: 40,
      story_points_completed: 26,
      features_completed: 3,
      tasks_completed: 14,
      tasks_pending_review: 2,
      open_blockers: 1,
      pending_qa: 1,
      kb_documents: 5,
    }),
    getSprintProgress: vi.fn().mockResolvedValue({
      sprint_id: "s1",
      sprint_name: "Sprint 1",
      completion: 65,
      story_points_total: 40,
      story_points_completed: 26,
      days_remaining: 4,
      status: "healthy",
      velocity: 30,
      burndown: [],
    }),
    getTeamWorkload: vi.fn().mockResolvedValue([]),
    getTaskStatusSummary: vi.fn().mockResolvedValue({
      pending: 2,
      in_progress: 4,
      in_review: 2,
      completed: 14,
      blocked: 1,
      total: 23,
    }),
    getFeatureStatusSummary: vi.fn().mockResolvedValue({
      planned: 1,
      in_progress: 2,
      in_review: 1,
      completed: 3,
      archived: 0,
      total: 7,
    }),
    getPendingPRs: vi.fn().mockResolvedValue({
      total: 0,
      by_status: {},
      by_repository: {},
      prs: [],
    }),
    getAIActivitySummary: vi.fn().mockResolvedValue({
      total_runs: 150,
      successful: 147,
      failed: 3,
      agents_active: 6,
      last_run: new Date().toISOString(),
      summary: "All systems operational.",
      top_agents: [],
    }),
    getRecentActivity: vi.fn().mockResolvedValue([]),
    getUpcomingDeadlines: vi.fn().mockResolvedValue([]),
    getRecentDecisions: vi.fn().mockResolvedValue([]),
    getBlockerSummary: vi.fn().mockResolvedValue({
      total: 1,
      by_status: { open: 1, in_progress: 0, resolved: 0 },
      by_priority: { high: 1 },
      oldest_open: null,
    }),
  },
}));

vi.mock("../../api/team_members", () => ({
  teamMembersApi: {
    list: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      full_name: "Ajay Kumar",
    },
  }),
}));

describe("DashboardPage", () => {
  it("renders greeting and KPI cards", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        getByText(/Good (morning|afternoon|evening),/i)
      ).toBeInTheDocument();
    });
  });
});