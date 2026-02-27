export interface GameState {
  puzzleId: string;
  initial: number[]; // 81 values, 0 = blank (immutable)
  current: number[]; // 81 values, current board state
  solution: number[]; // 81 values
  notes: Map<number, Set<number>>; // cell index -> corner pencil marks
  centerNotes: Map<number, Set<number>>; // cell index -> center marks
  selectedCell: number | null;
  history: HistoryEntry[];
  historyIndex: number;
  timer: number; // seconds elapsed
  isComplete: boolean;
  difficultyScore: number;
  difficultyLabel: string;
}

export interface HistoryEntry {
  cellIndex: number;
  prevValue: number;
  newValue: number;
  prevNotes: Set<number> | null;
  newNotes: Set<number> | null;
  type: "value" | "note" | "center-note";
}

export interface GameSettings {
  autoRemoveNotes: boolean;
  highlightMatching: boolean;
  showErrors: boolean;
  showCandidates: boolean;
  hintsEnabled: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  autoRemoveNotes: true,
  highlightMatching: true,
  showErrors: false,
  showCandidates: false,
  hintsEnabled: true,
};
