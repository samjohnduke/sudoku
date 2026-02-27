import { describe, it, expect } from "vitest";
import { techniques, getTechniqueBySlug, CATEGORIES } from "../bible";
import { tutorials } from "../tutorials";

describe("bible data integrity", () => {
  it("should have 16 techniques", () => {
    expect(techniques.length).toBe(16);
  });

  it("should have a tutorial for every technique", () => {
    for (const tech of techniques) {
      expect(tutorials[tech.slug]).toBeDefined();
      expect(tutorials[tech.slug].steps.length).toBeGreaterThan(0);
    }
  });

  it("should have unique slugs", () => {
    const slugs = techniques.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("should cover all categories", () => {
    for (const cat of CATEGORIES) {
      const techs = techniques.filter((t) => t.category === cat);
      expect(techs.length).toBeGreaterThan(0);
    }
  });

  it("each tutorial should have explanation sections", () => {
    for (const tech of techniques) {
      const tutorial = tutorials[tech.slug];
      expect(tutorial.explanation.what).toBeTruthy();
      expect(tutorial.explanation.when).toBeTruthy();
      expect(tutorial.explanation.why).toBeTruthy();
    }
  });

  it("getTechniqueBySlug should work for all techniques", () => {
    for (const tech of techniques) {
      expect(getTechniqueBySlug(tech.slug)).toBe(tech);
    }
  });

  it("getTechniqueBySlug should return undefined for unknown slug", () => {
    expect(getTechniqueBySlug("nonexistent")).toBeUndefined();
  });
});
