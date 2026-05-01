import { describe, expect, it } from "vitest";
import { HERBS, findHerb } from "./lib/herbs";
import { ASSESSMENTS, findAssessment } from "./lib/assessments";

describe("herbs library", () => {
  it("contains at least 200 entries", () => {
    expect(HERBS.length).toBeGreaterThanOrEqual(200);
  });
  it("every entry has a slug, latin name, ASIN, image, and 3 sentences", () => {
    for (const h of HERBS) {
      expect(h.slug, `slug missing on ${h.name}`).toMatch(/^[a-z0-9-]+$/);
      expect(h.latin, `latin missing on ${h.name}`).toBeTruthy();
      expect(h.asin, `asin missing on ${h.name}`).toMatch(/^B0[A-Z0-9]{8}$/);
      expect(h.imageKey, `image missing on ${h.name}`).toMatch(/^library\/lib-\d{2}\.webp$/);
      expect(h.sentences.length, `${h.name} should have 3 sentences`).toBe(3);
      const total = h.sentences.join(" ").length;
      expect(total, `${h.name} body too short`).toBeGreaterThan(80);
    }
  });
  it("findHerb returns by slug", () => {
    const a = findHerb("ashwagandha");
    expect(a?.name.toLowerCase()).toContain("ashwagandha");
  });
  it("contains the canonical core perimenopause herbs", () => {
    const core = ["ashwagandha", "maca-root", "vitex-chasteberry", "black-cohosh", "shatavari", "rhodiola-rosea", "magnesium-glycinate"];
    for (const slug of core) {
      expect(findHerb(slug), `missing ${slug}`).toBeTruthy();
    }
  });
});

describe("assessments", () => {
  it("contains exactly 11 assessments", () => {
    expect(ASSESSMENTS.length).toBe(11);
  });
  it("every assessment has a title, blurb, image, and questions", () => {
    for (const a of ASSESSMENTS) {
      expect(a.slug).toMatch(/^[a-z0-9-]+$/);
      expect(a.title.length).toBeGreaterThan(5);
      expect(a.blurb.length).toBeGreaterThan(20);
      expect(a.questions.length).toBeGreaterThanOrEqual(5);
      expect(a.bands.length).toBeGreaterThanOrEqual(2);
      expect(a.imageKey).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });
  it("findAssessment returns by slug", () => {
    const a = findAssessment("perimenopause-symptom-check-in");
    expect(a?.title.toLowerCase()).toContain("symptom");
  });
});
