import { create } from 'zustand'

export const useStore = create((set) => ({
  names: [],
  activeMode: 'single',
  manyCount: 3,
  teamCount: 2,
  pairs: { groupA: [], groupB: [] },
  
  setNames: (names) => set({ names }),
  setActiveMode: (activeMode) => set({ activeMode }),
  setManyCount: (manyCount) => set({ manyCount }),
  setTeamCount: (teamCount) => set({ teamCount }),
  setPairs: (pairs) => set({ pairs }),
}))
