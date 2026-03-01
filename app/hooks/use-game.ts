import { useReducer, useCallback, useEffect, useRef, useState } from "react";
import type { GameState, GameSettings, HistoryEntry } from "~/components/sudoku/types";

export interface UseGameOptions {
  puzzleId: string;
  initial: number[];
  solution: number[];
  difficultyScore: number;
  difficultyLabel: string;
  settings: GameSettings;
  onSave: (state: SavePayload) => void;
  resumeState?: { boardState: string; notes: string; timeSeconds: number } | null;
}

export interface SavePayload {
  puzzleId: string;
  boardState: string;
  notesSnapshot: string;
  timeSeconds: number;
  completed: boolean;
}

export type InputMode = "value" | "note" | "center-note";

// ---------------------------------------------------------------------------
// Peer calculation helpers
// ---------------------------------------------------------------------------

function getPeers(index: number): Set<number> {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  const peers = new Set<number>();

  for (let i = 0; i < 9; i++) {
    peers.add(row * 9 + i); // same row
    peers.add(i * 9 + col); // same col
  }
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      peers.add(r * 9 + c);
    }
  }
  peers.delete(index);
  return peers;
}

// ---------------------------------------------------------------------------
// Helpers for cloning maps of sets
// ---------------------------------------------------------------------------

function cloneNotesMap(m: Map<number, Set<number>>): Map<number, Set<number>> {
  const out = new Map<number, Set<number>>();
  for (const [k, v] of m) {
    out.set(k, new Set(v));
  }
  return out;
}

// ---------------------------------------------------------------------------
// State serialization helpers
// ---------------------------------------------------------------------------

function serializeBoard(current: number[]): string {
  return current.map((v) => String(v)).join("");
}

function parseBoard(s: string): number[] {
  return s.split("").map(Number);
}

function serializeNotes(
  notes: Map<number, Set<number>>,
  centerNotes: Map<number, Set<number>>,
): string {
  const obj: Record<string, { corner?: number[]; center?: number[] }> = {};
  for (const [k, v] of notes) {
    if (v.size > 0) {
      if (!obj[k]) obj[k] = {};
      obj[k].corner = [...v];
    }
  }
  for (const [k, v] of centerNotes) {
    if (v.size > 0) {
      if (!obj[k]) obj[k] = {};
      obj[k].center = [...v];
    }
  }
  return JSON.stringify(obj);
}

function parseNotes(json: string): {
  notes: Map<number, Set<number>>;
  centerNotes: Map<number, Set<number>>;
} {
  const notes = new Map<number, Set<number>>();
  const centerNotes = new Map<number, Set<number>>();
  try {
    const obj = JSON.parse(json) as Record<
      string,
      { corner?: number[]; center?: number[] }
    >;
    for (const [k, v] of Object.entries(obj)) {
      const idx = Number(k);
      if (v.corner) notes.set(idx, new Set(v.corner));
      if (v.center) centerNotes.set(idx, new Set(v.center));
    }
  } catch {
    // ignore bad JSON, start fresh
  }
  return { notes, centerNotes };
}

// ---------------------------------------------------------------------------
// Reducer actions
// ---------------------------------------------------------------------------

type Action =
  | { type: "SELECT_CELL"; index: number }
  | { type: "DESELECT" }
  | {
      type: "ENTER_VALUE";
      n: number;
      mode: InputMode;
      autoRemoveNotes: boolean;
    }
  | { type: "DELETE_VALUE" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "TICK" }
  | { type: "SET_TIMER"; seconds: number }
  | { type: "RESET"; initial: number[] };

// ---------------------------------------------------------------------------
// Build initial state
// ---------------------------------------------------------------------------

function buildInitialState(opts: UseGameOptions): GameState {
  if (opts.resumeState) {
    const { notes, centerNotes } = parseNotes(opts.resumeState.notes);
    return {
      puzzleId: opts.puzzleId,
      initial: opts.initial,
      current: parseBoard(opts.resumeState.boardState),
      solution: opts.solution,
      notes,
      centerNotes,
      selectedCell: null,
      history: [],
      historyIndex: -1,
      timer: opts.resumeState.timeSeconds,
      isComplete: false,
      difficultyScore: opts.difficultyScore,
      difficultyLabel: opts.difficultyLabel,
    };
  }

  return {
    puzzleId: opts.puzzleId,
    initial: opts.initial,
    current: [...opts.initial],
    solution: opts.solution,
    notes: new Map(),
    centerNotes: new Map(),
    selectedCell: null,
    history: [],
    historyIndex: -1,
    timer: 0,
    isComplete: false,
    difficultyScore: opts.difficultyScore,
    difficultyLabel: opts.difficultyLabel,
  };
}

// ---------------------------------------------------------------------------
// Check completion
// ---------------------------------------------------------------------------

function checkComplete(current: number[], solution: number[]): boolean {
  for (let i = 0; i < 81; i++) {
    if (current[i] !== solution[i]) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SELECT_CELL":
      return { ...state, selectedCell: action.index };

    case "DESELECT":
      return { ...state, selectedCell: null };

    case "TICK":
      return { ...state, timer: state.timer + 1 };

    case "SET_TIMER":
      return { ...state, timer: action.seconds };

    case "ENTER_VALUE": {
      const idx = state.selectedCell;
      if (idx === null || state.isComplete) return state;
      if (state.initial[idx] !== 0) return state;

      const { n, mode, autoRemoveNotes } = action;

      // Truncate forward history
      const baseHistory =
        state.historyIndex < state.history.length - 1
          ? state.history.slice(0, state.historyIndex + 1)
          : [...state.history];

      if (mode === "value") {
        const prevValue = state.current[idx];
        const prevNotes = state.notes.get(idx)
          ? new Set(state.notes.get(idx)!)
          : null;

        const newCurrent = [...state.current];
        newCurrent[idx] = n;

        const newNotes = cloneNotesMap(state.notes);
        newNotes.delete(idx);

        const newCenterNotes = cloneNotesMap(state.centerNotes);
        newCenterNotes.delete(idx);

        // Build a compound history entry tracking the primary cell
        const entry: HistoryEntry = {
          cellIndex: idx,
          prevValue,
          newValue: n,
          prevNotes,
          newNotes: null,
          type: "value",
        };

        // Auto-remove notes from peers
        const peerRemovals: { cellIndex: number; removed: number[] }[] = [];
        if (autoRemoveNotes) {
          const peers = getPeers(idx);
          for (const peer of peers) {
            const cornerSet = newNotes.get(peer);
            if (cornerSet && cornerSet.has(n)) {
              peerRemovals.push({ cellIndex: peer, removed: [n] });
              cornerSet.delete(n);
              if (cornerSet.size === 0) newNotes.delete(peer);
            }
            const centerSet = newCenterNotes.get(peer);
            if (centerSet && centerSet.has(n)) {
              peerRemovals.push({ cellIndex: peer, removed: [n] });
              centerSet.delete(n);
              if (centerSet.size === 0) newCenterNotes.delete(peer);
            }
          }
        }

        const newHistory = [...baseHistory, entry];
        const isComplete = checkComplete(newCurrent, state.solution);

        return {
          ...state,
          current: newCurrent,
          notes: newNotes,
          centerNotes: newCenterNotes,
          history: newHistory,
          historyIndex: newHistory.length - 1,
          isComplete,
        };
      }

      if (mode === "note") {
        const newNotes = cloneNotesMap(state.notes);
        const cellNotes = newNotes.get(idx)
          ? new Set(newNotes.get(idx)!)
          : new Set<number>();
        const prevNotes = state.notes.get(idx)
          ? new Set(state.notes.get(idx)!)
          : null;

        if (cellNotes.has(n)) {
          cellNotes.delete(n);
        } else {
          cellNotes.add(n);
        }

        if (cellNotes.size > 0) {
          newNotes.set(idx, cellNotes);
        } else {
          newNotes.delete(idx);
        }

        // Clear center notes for this cell when setting corner notes
        const newCenterNotes = cloneNotesMap(state.centerNotes);
        newCenterNotes.delete(idx);

        const entry: HistoryEntry = {
          cellIndex: idx,
          prevValue: state.current[idx],
          newValue: state.current[idx],
          prevNotes,
          newNotes: cellNotes.size > 0 ? new Set(cellNotes) : null,
          type: "note",
        };

        const newHistory = [...baseHistory, entry];
        return {
          ...state,
          notes: newNotes,
          centerNotes: newCenterNotes,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      }

      if (mode === "center-note") {
        const newCenterNotes = cloneNotesMap(state.centerNotes);
        const cellNotes = newCenterNotes.get(idx)
          ? new Set(newCenterNotes.get(idx)!)
          : new Set<number>();
        const prevNotes = state.centerNotes.get(idx)
          ? new Set(state.centerNotes.get(idx)!)
          : null;

        if (cellNotes.has(n)) {
          cellNotes.delete(n);
        } else {
          cellNotes.add(n);
        }

        if (cellNotes.size > 0) {
          newCenterNotes.set(idx, cellNotes);
        } else {
          newCenterNotes.delete(idx);
        }

        // Clear corner notes for this cell when setting center notes
        const newNotes = cloneNotesMap(state.notes);
        newNotes.delete(idx);

        const entry: HistoryEntry = {
          cellIndex: idx,
          prevValue: state.current[idx],
          newValue: state.current[idx],
          prevNotes,
          newNotes: cellNotes.size > 0 ? new Set(cellNotes) : null,
          type: "center-note",
        };

        const newHistory = [...baseHistory, entry];
        return {
          ...state,
          notes: newNotes,
          centerNotes: newCenterNotes,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      }

      return state;
    }

    case "DELETE_VALUE": {
      const idx = state.selectedCell;
      if (idx === null || state.isComplete) return state;
      if (state.initial[idx] !== 0) return state;

      const baseHistory =
        state.historyIndex < state.history.length - 1
          ? state.history.slice(0, state.historyIndex + 1)
          : [...state.history];

      const prevValue = state.current[idx];
      const prevCorner = state.notes.get(idx)
        ? new Set(state.notes.get(idx)!)
        : null;
      const prevCenter = state.centerNotes.get(idx)
        ? new Set(state.centerNotes.get(idx)!)
        : null;

      // Nothing to delete
      if (prevValue === 0 && !prevCorner && !prevCenter) return state;

      const newCurrent = [...state.current];
      newCurrent[idx] = 0;

      const newNotes = cloneNotesMap(state.notes);
      newNotes.delete(idx);

      const newCenterNotes = cloneNotesMap(state.centerNotes);
      newCenterNotes.delete(idx);

      const entry: HistoryEntry = {
        cellIndex: idx,
        prevValue,
        newValue: 0,
        prevNotes: prevCorner,
        newNotes: null,
        type: "value",
      };

      const newHistory = [...baseHistory, entry];

      return {
        ...state,
        current: newCurrent,
        notes: newNotes,
        centerNotes: newCenterNotes,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case "UNDO": {
      if (state.historyIndex < 0) return state;

      const entry = state.history[state.historyIndex];
      const idx = entry.cellIndex;

      const newCurrent = [...state.current];
      const newNotes = cloneNotesMap(state.notes);
      const newCenterNotes = cloneNotesMap(state.centerNotes);

      if (entry.type === "value") {
        newCurrent[idx] = entry.prevValue;
        if (entry.prevNotes) {
          newNotes.set(idx, new Set(entry.prevNotes));
        } else {
          newNotes.delete(idx);
        }
      } else if (entry.type === "note") {
        if (entry.prevNotes) {
          newNotes.set(idx, new Set(entry.prevNotes));
        } else {
          newNotes.delete(idx);
        }
      } else if (entry.type === "center-note") {
        if (entry.prevNotes) {
          newCenterNotes.set(idx, new Set(entry.prevNotes));
        } else {
          newCenterNotes.delete(idx);
        }
      }

      return {
        ...state,
        current: newCurrent,
        notes: newNotes,
        centerNotes: newCenterNotes,
        historyIndex: state.historyIndex - 1,
        isComplete: false,
        selectedCell: idx,
      };
    }

    case "REDO": {
      if (state.historyIndex >= state.history.length - 1) return state;

      const entry = state.history[state.historyIndex + 1];
      const idx = entry.cellIndex;

      const newCurrent = [...state.current];
      const newNotes = cloneNotesMap(state.notes);
      const newCenterNotes = cloneNotesMap(state.centerNotes);

      if (entry.type === "value") {
        newCurrent[idx] = entry.newValue;
        // Clear notes on value entry (same as forward action)
        newNotes.delete(idx);
        newCenterNotes.delete(idx);
      } else if (entry.type === "note") {
        if (entry.newNotes) {
          newNotes.set(idx, new Set(entry.newNotes));
        } else {
          newNotes.delete(idx);
        }
      } else if (entry.type === "center-note") {
        if (entry.newNotes) {
          newCenterNotes.set(idx, new Set(entry.newNotes));
        } else {
          newCenterNotes.delete(idx);
        }
      }

      const isComplete = checkComplete(newCurrent, state.solution);

      return {
        ...state,
        current: newCurrent,
        notes: newNotes,
        centerNotes: newCenterNotes,
        historyIndex: state.historyIndex + 1,
        isComplete,
        selectedCell: idx,
      };
    }

    case "RESET": {
      return {
        ...state,
        current: [...action.initial],
        notes: new Map(),
        centerNotes: new Map(),
        selectedCell: null,
        history: [],
        historyIndex: -1,
        timer: 0,
        isComplete: false,
      };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Arrow key navigation
// ---------------------------------------------------------------------------

function moveSelection(current: number | null, key: string): number {
  if (current === null) return 40; // center cell

  const row = Math.floor(current / 9);
  const col = current % 9;

  switch (key) {
    case "ArrowUp":
      return ((row - 1 + 9) % 9) * 9 + col;
    case "ArrowDown":
      return ((row + 1) % 9) * 9 + col;
    case "ArrowLeft":
      return row * 9 + ((col - 1 + 9) % 9);
    case "ArrowRight":
      return row * 9 + ((col + 1) % 9);
    default:
      return current;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGame(options: UseGameOptions) {
  const {
    puzzleId,
    settings,
    onSave,
  } = options;

  const [game, dispatch] = useReducer(gameReducer, options, buildInitialState);
  const [mode, setMode] = useState<InputMode>("value");

  // Refs for debounced save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Stable action callbacks
  const selectCell = useCallback((index: number) => {
    dispatch({ type: "SELECT_CELL", index });
  }, []);

  const deselect = useCallback(() => {
    dispatch({ type: "DESELECT" });
  }, []);

  const enterNumber = useCallback(
    (n: number) => {
      dispatch({
        type: "ENTER_VALUE",
        n,
        mode,
        autoRemoveNotes: settingsRef.current.autoRemoveNotes,
      });
    },
    [mode],
  );

  const deleteValue = useCallback(() => {
    dispatch({ type: "DELETE_VALUE" });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET", initial: options.initial });
  }, [options.initial]);

  // -----------------------------------------------------------------------
  // Timer
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (game.isComplete) return;

    let paused = document.hidden;

    const interval = setInterval(() => {
      if (!paused) {
        dispatch({ type: "TICK" });
      }
    }, 1000);

    const handleVisibility = () => {
      paused = document.hidden;
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [game.isComplete]);

  // -----------------------------------------------------------------------
  // Keyboard input
  // -----------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key;
      const mod = e.metaKey || e.ctrlKey;

      // Number keys 1-9
      if (key >= "1" && key <= "9" && !mod) {
        e.preventDefault();
        enterNumber(Number(key));
        return;
      }

      // Delete / Backspace
      if (key === "Backspace" || key === "Delete") {
        e.preventDefault();
        deleteValue();
        return;
      }

      // Arrow keys
      if (
        key === "ArrowUp" ||
        key === "ArrowDown" ||
        key === "ArrowLeft" ||
        key === "ArrowRight"
      ) {
        e.preventDefault();
        dispatch({
          type: "SELECT_CELL",
          index: moveSelection(game.selectedCell, key),
        });
        return;
      }

      // Undo: Ctrl+Z / Cmd+Z
      if (mod && key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y / Cmd+Y / Ctrl+Shift+Z / Cmd+Shift+Z
      if (
        (mod && key === "y") ||
        (mod && key === "z" && e.shiftKey) ||
        (mod && key === "Z")
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Toggle note mode
      if (key === "n" && !mod) {
        e.preventDefault();
        setMode((prev) => (prev === "note" ? "value" : "note"));
        return;
      }

      // Escape: deselect
      if (key === "Escape") {
        e.preventDefault();
        deselect();
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enterNumber, deleteValue, undo, redo, deselect, game.selectedCell]);

  // -----------------------------------------------------------------------
  // Debounced save — fire after any state change
  // -----------------------------------------------------------------------
  const prevStateRef = useRef<{
    current: number[];
    notes: Map<number, Set<number>>;
    centerNotes: Map<number, Set<number>>;
    historyIndex: number;
  } | null>(null);

  useEffect(() => {
    // Skip the initial render
    const prev = prevStateRef.current;
    prevStateRef.current = {
      current: game.current,
      notes: game.notes,
      centerNotes: game.centerNotes,
      historyIndex: game.historyIndex,
    };

    if (!prev) return;

    // Only save when board/notes/history actually changed
    if (
      prev.current === game.current &&
      prev.notes === game.notes &&
      prev.centerNotes === game.centerNotes &&
      prev.historyIndex === game.historyIndex
    ) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      onSaveRef.current({
        puzzleId,
        boardState: serializeBoard(game.current),
        notesSnapshot: serializeNotes(game.notes, game.centerNotes),
        timeSeconds: game.timer,
        completed: game.isComplete,
      });
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [game.current, game.notes, game.centerNotes, game.historyIndex, game.timer, game.isComplete, puzzleId]);

  return {
    game,
    selectCell,
    enterNumber,
    deleteValue,
    undo,
    redo,
    reset,
    mode,
    setMode,
  };
}
