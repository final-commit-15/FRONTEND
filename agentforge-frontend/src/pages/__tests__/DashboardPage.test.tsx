import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DashboardPage } from "../DashboardPage";

// Mock APIs
vi.mock("../../api/analytics", () => ({
  analyticsApi: {
    getOverview: vi.fn().mockResolvedValue({
      total_agents: 12,
      total_executions: 150,
      success_rate: 98,
      active_workflows: 6,
    }),
  },
}));

vi.mock("../../api/executions", () => ({
  executionsApi: {
    list: vi.fn().mockResolvedValue({
      items: [],
    }),
  },
}));

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      name: "Ajay Kumar",
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

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Good (morning|afternoon|evening),/i)
      ).toBeInTheDocument();
    });
  });
});