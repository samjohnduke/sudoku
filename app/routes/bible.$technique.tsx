import { useParams, Link } from "react-router";
import { useState } from "react";
import { getTechniqueBySlug, techniques } from "~/data/bible";
import { tutorials } from "~/data/tutorials";
import { TutorialBoard } from "~/components/bible/tutorial-board";
import { StepControls } from "~/components/bible/step-controls";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";

export function meta({ params }: { params: { technique: string } }) {
  const tech = getTechniqueBySlug(params.technique);
  return [
    { title: `${tech?.name ?? "Technique"} — SUPERSudoku Learn` },
    { name: "description", content: tech?.shortDescription ?? "" },
  ];
}

export default function TechniquePage() {
  const { technique: slug } = useParams();
  const tech = getTechniqueBySlug(slug!);
  const tutorial = tutorials[slug!];
  const [currentStep, setCurrentStep] = useState(0);

  if (!tech || !tutorial) {
    return <div className="max-w-3xl mx-auto px-4 py-8">Technique not found.</div>;
  }

  // Find previous and next techniques for navigation
  const techIndex = techniques.findIndex(t => t.slug === slug);
  const prevTech = techIndex > 0 ? techniques[techIndex - 1] : null;
  const nextTech = techIndex < techniques.length - 1 ? techniques[techIndex + 1] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-20 sm:pb-0">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-4">
        <Link to="/bible" className="hover:text-foreground">Techniques</Link>
        <span className="mx-2">/</span>
        <span>{tech.name}</span>
      </nav>

      {/* Header */}
      <h1 className="text-3xl font-bold mb-2 font-serif">{tech.name}</h1>
      <Badge variant="outline" className="mb-6">{tech.category}</Badge>

      {/* Explanation sections */}
      <section className="space-y-4 mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-1 font-serif">What is it?</h2>
          <p className="text-muted-foreground">{tutorial.explanation.what}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-1 font-serif">When to use it</h2>
          <p className="text-muted-foreground">{tutorial.explanation.when}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-1 font-serif">Why it works</h2>
          <p className="text-muted-foreground">{tutorial.explanation.why}</p>
        </div>
      </section>

      {/* Interactive Tutorial */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 font-serif">Interactive Demo</h2>

        <TutorialBoard
          boardState={tutorial.boardState}
          candidates={tutorial.candidates}
          currentStep={tutorial.steps[currentStep]}
        />

        {/* Step description */}
        <Card className="mt-4">
          <CardContent className="py-3">
            <p>{tutorial.steps[currentStep].description}</p>
          </CardContent>
        </Card>

        <StepControls
          currentStep={currentStep}
          totalSteps={tutorial.steps.length}
          onPrevious={() => setCurrentStep(s => Math.max(0, s - 1))}
          onNext={() => setCurrentStep(s => Math.min(tutorial.steps.length - 1, s + 1))}
          onReset={() => setCurrentStep(0)}
        />
      </section>

      {/* Navigation between techniques */}
      <nav className="flex justify-between pt-4 border-t gap-4">
        {prevTech ? (
          <Link to={`/bible/${prevTech.slug}`} className="text-sm text-primary hover:underline min-h-[44px] flex items-center">
            &larr; {prevTech.name}
          </Link>
        ) : <span />}
        {nextTech ? (
          <Link to={`/bible/${nextTech.slug}`} className="text-sm text-primary hover:underline min-h-[44px] flex items-center">
            {nextTech.name} &rarr;
          </Link>
        ) : <span />}
      </nav>
    </div>
  );
}
