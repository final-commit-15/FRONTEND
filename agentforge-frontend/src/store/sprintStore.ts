// src/store/sprintStore.ts
// Global sprint selection shared between the TopBar selector and the
// dashboard / sprint journal pages.

import { create } from 'zustand';

interface SprintOption {
  id: string;
  name: string;
  status: string;
}

interface SprintState {
  activeSprintId: string | undefined;
  sprints: SprintOption[];
  setActiveSprintId: (id: string | undefined) => void;
  setSprints: (sprints: SprintOption[]) => void;
}

export const useSprintStore = create<SprintState>((set) => ({
  activeSprintId: undefined,
  sprints: [],
  setActiveSprintId: (id) => set({ activeSprintId: id }),
  setSprints: (sprints) => set({ sprints }),
}));