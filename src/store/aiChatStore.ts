import { create } from 'zustand';

interface AIChatState {
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  resetOnLogout: () => void;
}

export const useAIChatStore = create<AIChatState>((set) => ({
  currentConversationId: null,
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  resetOnLogout: () => set({ currentConversationId: null }),
}));
