import { CATEGORIES, getTechniquesByCategory } from "~/data/bible";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";

export function meta() {
  return [
    { title: "Solving Techniques — SUPERSudoku" },
    { name: "description", content: "Learn every sudoku solving technique from beginner to expert." },
  ];
}

export default function Bible() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-20 sm:pb-0">
      <h1 className="text-3xl font-bold mb-2 font-serif">Solving Techniques</h1>
      <p className="text-muted-foreground mb-8">
        Master every technique from naked singles to unique rectangles.
      </p>

      {CATEGORIES.map(category => {
        const techs = getTechniquesByCategory(category);
        return (
          <section key={category} className="mb-8">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Badge variant="secondary">{category}</Badge>
            </h2>
            <div className="grid gap-2">
              {techs.map(tech => (
                <Link
                  key={tech.slug}
                  to={`/bible/${tech.slug}`}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl border border-border/50 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{tech.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{tech.shortDescription}</p>
                  </div>
                  <span className="text-muted-foreground/40 text-sm mt-0.5">&rsaquo;</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
