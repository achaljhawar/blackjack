import type { Card, GameHistoryEntry } from "./game";
import type { Session } from "next-auth";

export interface PlayingCardProps {
  card?: Card;
  faceDown?: boolean;
  isNew?: boolean;
}

export interface BuyChipsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPurchase: (amount: number) => void;
  currentBalance: number;
}

export interface NavbarClientWrapperProps {
  session: Session;
}

export interface AuthenticatedNavbarProps {
  session: Session;
  chips?: number;
  onBuyChips?: () => void;
}

export interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface HistoryClientProps {
  initialHistory: GameHistoryEntry[];
}
