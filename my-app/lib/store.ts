import { create } from 'zustand';

export type Recommendation = {
  type: string;
  symbol: string;
  name: string;
  price: number;
  change1D: string;
  change1W: string;
  change1M: string;
  reasoning: string;
  rating?: number; // 1–5 user-specific score
};

interface WatchlistState {
  watchlist: Recommendation[];
  addToWatchlist: (rec: Recommendation) => void;
  removeFromWatchlist: (symbol: string) => void;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlist: [],
  addToWatchlist: (rec) => {
    if (!get().watchlist.find((item) => item.symbol === rec.symbol)) {
      set((state) => ({ watchlist: [...state.watchlist, rec] }));
    }
  },
  removeFromWatchlist: (symbol) => {
    set((state) => ({ watchlist: state.watchlist.filter((item) => item.symbol !== symbol) }));
  },
}));
