import React from 'react';
import create from 'zustand';

export type Tab = {
  id: string;
  title: string;
  path: string;
  component: React.ReactNode;
};

interface TabState {
  tabs: Tab[];
  activeTabId?: string;
  openTab: (tab: Tab) => void;
  closeTab: (id: string) => void;
  setActive: (id: string) => void;
}

export const useTabs = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: undefined,
  openTab: (tab) => {
    const exists = get().tabs.find((t) => t.id === tab.id);
    if (exists) return set({ activeTabId: tab.id });
    set((state) => ({ tabs: [...state.tabs, tab], activeTabId: tab.id }));
  },
  closeTab: (id) =>
    set((state) => ({
      tabs: state.tabs.filter((t) => t.id !== id),
      activeTabId: state.activeTabId === id ? state.tabs.find((t) => t.id !== id)?.id : state.activeTabId
    })),
  setActive: (id) => set({ activeTabId: id })
}));
