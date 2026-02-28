import { useParams, Link } from "react-router";
import { useState } from "react";
import { getTechniqueBySlug, techniques } from "~/data/bible";
import { tutorials } from "~/data/tutorials";
import { TutorialBoard } from "~/components/bible/tutorial-board";
import { StepControls } from "~/components/bible/step-controls";
import { cn } from "~/lib/utils";

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
    return <div className="max-w-xl mx-auto px-5 py-8">Technique not found.</div>;
  }

  const techIndex = techniques.findIndex(t => t.slug === slug);
  const prevTech = techIndex > 0 ? techniques[techIndex - 1] : null;
  const nextTech = techIndex < techniques.length - 1 ? techniques[techIndex + 1] : null;

  return (
    <div className="max-w-xl mx-auto px-5 py-8 pb-20 sm:pb-8">
      {/* Back link */}
      <Link
        to="/bible"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; All techniques
      </Link>

      {/* Header */}
      <h1 className="font-serif italic text-3xl text-foreground mt-4">
        {tech.name}
      </h1>
      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
        {tech.category}
      </p>

      {/* Explanation — conversational flow, no sub-headings */}
      <div className="mt-6 space-y-3 text-sm text-foreground/80 leading-relaxed">
        <p>{tutorial.explanation.what}</p>
        <p>{tutorial.explanation.when}</p>
        <p>{tutorial.explanation.why}</p>
      </div>

      {/* Interactive Tutorial */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Try it
        </h2>

        <TutorialBoard
          boardState={tutorial.boardState}
          candidates={tutorial.candidates}
          currentStep={tutorial.steps[currentStep]}
        />

        {/* Step description */}
        <p className="text-sm text-foreground/80 leading-relaxed mt-4">
          {tutorial.steps[currentStep].description}
        </p>

        <StepControls
          currentStep={currentStep}
          totalSteps={tutorial.steps.length}
          onPrevious={() => setCurrentStep(s => Math.max(0, s - 1))}
          onNext={() => setCurrentStep(s => Math.min(tutorial.steps.length - 1, s + 1))}
          onReset={() => setCurrentStep(0)}
        />
      </section>

      {/* Prev / Next navigation */}
      <nav className="flex justify-between mt-10 pt-6 border-t border-border/50 gap-4">
        {prevTech ? (
          <Link
            to={`/bible/${prevTech.slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
          >
            &larr; {prevTech.name}
          </Link>
        ) : <span />}
        {nextTech ? (
          <Link
            to={`/bible/${nextTech.slug}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] flex items-center"
          >
            {nextTech.name} &rarr;
          </Link>
        ) : <span />}
      </nav>
    </div>
  );
}
