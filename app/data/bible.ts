export interface TechniqueInfo {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
}

export const CATEGORIES = ["Beginner", "Easy", "Medium", "Hard", "Expert"] as const;

export const techniques: TechniqueInfo[] = [
  { slug: "naked-single", name: "Naked Single", category: "Beginner", shortDescription: "A cell with only one possible candidate." },
  { slug: "hidden-single", name: "Hidden Single", category: "Beginner", shortDescription: "A candidate that appears in only one cell within a unit." },
  { slug: "naked-pair", name: "Naked Pair", category: "Easy", shortDescription: "Two cells in a unit with the same two candidates." },
  { slug: "naked-triple", name: "Naked Triple", category: "Easy", shortDescription: "Three cells in a unit whose combined candidates contain exactly three values." },
  { slug: "hidden-pair", name: "Hidden Pair", category: "Medium", shortDescription: "Two values that appear as candidates in only two cells of a unit." },
  { slug: "hidden-triple", name: "Hidden Triple", category: "Medium", shortDescription: "Three values confined to exactly three cells in a unit." },
  { slug: "pointing-pairs", name: "Pointing Pairs", category: "Medium", shortDescription: "A candidate in a box restricted to a single row or column." },
  { slug: "box-line-reduction", name: "Box/Line Reduction", category: "Medium", shortDescription: "A candidate in a row or column restricted to a single box." },
  { slug: "naked-quad", name: "Naked Quad", category: "Medium", shortDescription: "Four cells in a unit whose combined candidates contain exactly four values." },
  { slug: "hidden-quad", name: "Hidden Quad", category: "Medium", shortDescription: "Four values confined to exactly four cells in a unit." },
  { slug: "x-wing", name: "X-Wing", category: "Hard", shortDescription: "A candidate confined to two columns in exactly two rows, forming a rectangle." },
  { slug: "swordfish", name: "Swordfish", category: "Hard", shortDescription: "A candidate confined to three columns across exactly three rows." },
  { slug: "xy-wing", name: "XY-Wing", category: "Hard", shortDescription: "A pivot cell with two wings that share eliminating candidates." },
  { slug: "simple-coloring", name: "Simple Coloring", category: "Hard", shortDescription: "Alternating chains of conjugate pairs reveal contradictions." },
  { slug: "jellyfish", name: "Jellyfish", category: "Expert", shortDescription: "A candidate confined to four columns across exactly four rows." },
  { slug: "unique-rectangle", name: "Unique Rectangle", category: "Expert", shortDescription: "Exploiting the uniqueness constraint to eliminate candidates from a rectangle pattern." },
];

export function getTechniqueBySlug(slug: string): TechniqueInfo | undefined {
  return techniques.find(t => t.slug === slug);
}

export function getTechniquesByCategory(category: string): TechniqueInfo[] {
  return techniques.filter(t => t.category === category);
}
