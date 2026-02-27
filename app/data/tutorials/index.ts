import { nakedSingleTutorial } from "./naked-single";
import { hiddenSingleTutorial } from "./hidden-single";
import { nakedPairTutorial } from "./naked-pair";
import { nakedTripleTutorial } from "./naked-triple";
import { hiddenPairTutorial } from "./hidden-pair";
import { hiddenTripleTutorial } from "./hidden-triple";
import { pointingPairsTutorial } from "./pointing-pairs";
import { boxLineReductionTutorial } from "./box-line-reduction";
import { nakedQuadTutorial } from "./naked-quad";
import { hiddenQuadTutorial } from "./hidden-quad";
import { xWingTutorial } from "./x-wing";
import { swordfishTutorial } from "./swordfish";
import { xyWingTutorial } from "./xy-wing";
import { simpleColoringTutorial } from "./simple-coloring";
import { jellyfishTutorial } from "./jellyfish";
import { uniqueRectangleTutorial } from "./unique-rectangle";
import type { TutorialData } from "../bible-tutorials";

export const tutorials: Record<string, TutorialData> = {
  "naked-single": nakedSingleTutorial,
  "hidden-single": hiddenSingleTutorial,
  "naked-pair": nakedPairTutorial,
  "naked-triple": nakedTripleTutorial,
  "hidden-pair": hiddenPairTutorial,
  "hidden-triple": hiddenTripleTutorial,
  "pointing-pairs": pointingPairsTutorial,
  "box-line-reduction": boxLineReductionTutorial,
  "naked-quad": nakedQuadTutorial,
  "hidden-quad": hiddenQuadTutorial,
  "x-wing": xWingTutorial,
  "swordfish": swordfishTutorial,
  "xy-wing": xyWingTutorial,
  "simple-coloring": simpleColoringTutorial,
  "jellyfish": jellyfishTutorial,
  "unique-rectangle": uniqueRectangleTutorial,
};
