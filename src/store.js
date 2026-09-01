import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
  persist(
    (set) => ({
      names: [],
      activeMode: 'single',
      manyCount: 3,
      teamCount: 2,
      pairs: { groupA: [], groupB: [] },
      tournament: null, // { rounds: [...], currentRound: 0, champion: null }

      setNames: (names) => set({ names }),
      setActiveMode: (activeMode) => set({ activeMode }),
      setManyCount: (manyCount) => set({ manyCount }),
      setTeamCount: (teamCount) => set({ teamCount }),
      setPairs: (pairs) => set({ pairs }),
      setTournament: (tournament) => set({ tournament }),
    }),
    {
      name: 'randomix-session',
      // Only persist names list — keep UI state fresh each visit
      partialize: (state) => ({ names: state.names }),
    }
  )
)
