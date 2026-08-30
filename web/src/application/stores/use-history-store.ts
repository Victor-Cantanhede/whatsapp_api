import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { RequestHistoryItem } from '@/domain/shared/types';

interface HistoryState {
  history: RequestHistoryItem[];
  addHistoryItem: (item: Omit<RequestHistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      history: [],
      addHistoryItem: (item) =>
        set((state) => ({
          history: [
            {
              ...item,
              id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              timestamp: Date.now(),
            },
            ...state.history,
          ].slice(0, 30), // Guarda até as últimas 30 requisições
        })),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'whatsapp_api_history_store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
