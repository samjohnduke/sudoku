import { cn } from "~/lib/utils";
import { Cell } from "./cell";
import type { GameState, GameSettings } from "./types";

interface BoardProps {
  game: GameState;
  settings: GameSettings;
  onSelectCell: (index: number) => void;
  hintCells?: number[];
}

const EMPTY_SET = new Set<number>();

function getRow(index: number) {
  return Math.floor(index / 9);
}

function getCol(index: number) {
  return index % 9;
}

function getBox(index: number) {
  return Math.floor(getRow(index) / 3) * 3 + Math.floor(getCol(index) / 3);
}

export function Board({ game, settings, onSelectCell, hintCells }: BoardProps) {
  const hintCellSet = hintCells ? new Set(hintCells) : null;
  const selectedRow =
    game.selectedCell !== null ? getRow(game.selectedCell) : -1;
  const selectedCol =
    game.selectedCell !== null ? getCol(game.selectedCell) : -1;
  const selectedBox =
    game.selectedCell !== null ? getBox(game.selectedCell) : -1;
  const selectedValue =
    game.selectedCell !== null ? game.current[game.selectedCell] : 0;

  return (
    <div
      role="grid"
      aria-label="Sudoku board"
      className={cn(
        "grid grid-cols-9",
        "border-2 border-foreground/40 rounded-lg overflow-hidden",
        "max-w-md mx-auto aspect-square",
      )}
      style={{ containerType: "inline-size" }}
    >
      {game.current.map((value, index) => {
        const row = getRow(index);
        const col = getCol(index);
        const box = getBox(index);
        const isInitial = game.initial[index] !== 0;
        const isSelected = game.selectedCell === index;
        const isHighlighted =
          settings.highlightMatching &&
          selectedValue > 0 &&
          value === selectedValue &&
          !isSelected;
        const isError =
          settings.showErrors &&
          value > 0 &&
          value !== game.solution[index];
        const isSameRow = !isSelected && row === selectedRow;
        const isSameCol = !isSelected && col === selectedCol;
        const isSameBox = !isSelected && box === selectedBox;

        return (
          <Cell
            key={index}
            index={index}
            value={value}
            isInitial={isInitial}
            isSelected={isSelected}
            isHighlighted={isHighlighted}
            isError={isError}
            isHint={hintCellSet !== null && hintCellSet.has(index)}
            isSameRow={isSameRow}
            isSameCol={isSameCol}
            isSameBox={isSameBox}
            notes={game.notes.get(index) ?? EMPTY_SET}
            centerNotes={game.centerNotes.get(index) ?? EMPTY_SET}
            onSelect={onSelectCell}
          />
        );
      })}
    </div>
  );
}
