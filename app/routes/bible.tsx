import { Link } from "react-router";
import { getTechniquesByCategory } from "~/data/bible";

export function meta() {
  return [
    { title: "Learn — Super Sudoku" },
    { name: "description", content: "Learn every sudoku solving technique from beginner to expert." },
  ];
}

const SECTIONS = [
  {
    category: "Beginner",
    title: "Start here",
    description: "The two techniques you'll use on every single puzzle. If you're new to sudoku, this is all you need.",
  },
  {
    category: "Easy",
    title: "Pairs and triples",
    description: "When singles aren't enough, start looking for cells that share candidates.",
  },
  {
    category: "Medium",
    title: "Intermediate patterns",
    description: "These techniques let you eliminate candidates by studying how they're distributed across rows, columns, and boxes.",
  },
  {
    category: "Hard",
    title: "Advanced strategies",
    description: "For tougher puzzles. These require spotting patterns that span multiple rows and columns at once.",
  },
  {
    category: "Expert",
    title: "The deep end",
    description: "Rarely needed, but satisfying when you spot them. These are for the most challenging puzzles.",
  },
] as const;

export default function Bible() {
  return (
    <div className="max-w-xl mx-auto px-5 py-8 pb-20 sm:pb-8">
      <h1 className="font-serif italic text-3xl text-foreground">Learn</h1>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        Sudoku is built on a small set of logical techniques.
        Master them in order and you can solve any puzzle without guessing.
      </p>

      <div className="mt-10 space-y-10">
        {SECTIONS.map((section) => {
          const techs = getTechniquesByCategory(section.category);
          return (
            <section key={section.category}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h2>
              <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">
                {section.description}
              </p>
              <ul className="mt-3 space-y-0.5">
                {techs.map((tech) => (
                  <li key={tech.slug}>
                    <Link
                      to={`/bible/${tech.slug}`}
                      className="group flex items-baseline gap-2 py-2 transition-colors hover:text-primary"
                    >
                      <span className="text-sm font-medium">{tech.name}</span>
                      <span className="text-xs text-muted-foreground group-hover:text-primary/60 transition-colors">
                        {tech.shortDescription}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
