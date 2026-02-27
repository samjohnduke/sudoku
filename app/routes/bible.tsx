import { CATEGORIES, getTechniquesByCategory } from "~/data/bible";
import { Link } from "react-router";
import { Card, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

export function meta() {
  return [
    { title: "Solving Bible — SUPERSudoku" },
    { name: "description", content: "Learn every sudoku solving technique from beginner to expert." },
  ];
}

export default function Bible() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">The Solving Bible</h1>
      <p className="text-muted-foreground mb-8">
        Master every technique from naked singles to unique rectangles.
      </p>

      {CATEGORIES.map(category => {
        const techs = getTechniquesByCategory(category);
        return (
          <section key={category} className="mb-8">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Badge variant="outline">{category}</Badge>
            </h2>
            <div className="grid gap-3">
              {techs.map(tech => (
                <Link key={tech.slug} to={`/bible/${tech.slug}`} className="block">
                  <Card className="hover:bg-accent/50 transition-colors">
                    <CardHeader className="py-4">
                      <CardTitle className="text-base">{tech.name}</CardTitle>
                      <CardDescription>{tech.shortDescription}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
