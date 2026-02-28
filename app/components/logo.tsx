import { cn } from "~/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Abstract 3x3 grid mark. A few cells are filled at varying opacities
 * to suggest a partially-solved sudoku board without being literal.
 */
export function Logo({ className, size = 40 }: LogoProps) {
  // Grid is 3x3, each cell is 10x10 with 1.5 gap, padded by 1
  // Total viewbox: 33 x 33
  const cellSize = 9;
  const gap = 1.5;
  const pad = 1.5;

  function cellX(col: number) {
    return pad + col * (cellSize + gap);
  }
  function cellY(row: number) {
    return pad + row * (cellSize + gap);
  }

  const viewBox = `0 0 ${pad * 2 + 3 * cellSize + 2 * gap} ${pad * 2 + 3 * cellSize + 2 * gap}`;

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("flex-shrink-0", className)}
      aria-hidden="true"
    >
      {/* Grid cells — all drawn, some filled */}
      {[
        // [row, col, filled, opacity]
        [0, 0, true, 0.9],
        [0, 1, false, 0],
        [0, 2, true, 0.4],
        [1, 0, false, 0],
        [1, 1, true, 0.65],
        [1, 2, false, 0],
        [2, 0, true, 0.5],
        [2, 1, false, 0],
        [2, 2, true, 0.2],
      ].map(([row, col, filled, opacity]) => (
        <rect
          key={`${row}-${col}`}
          x={cellX(col as number)}
          y={cellY(row as number)}
          width={cellSize}
          height={cellSize}
          rx={2}
          fill={filled ? "currentColor" : "none"}
          fillOpacity={opacity as number}
          stroke="currentColor"
          strokeOpacity={filled ? 0 : 0.2}
          strokeWidth={0.8}
        />
      ))}
    </svg>
  );
}
