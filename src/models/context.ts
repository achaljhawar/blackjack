export interface BalanceContextType {
  balance: number | null;
  setBalance: (balance: number) => void;
  refreshBalance: () => Promise<void>;
}
