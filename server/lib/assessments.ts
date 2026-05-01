/**
 * 11 nurturing perimenopause self-assessments.
 * Each is intentionally short (5–8 questions) and scored on a 0–3 Likert
 * scale. The goal is *self-recognition*, not diagnosis. Every question is
 * phrased softly so a tender reader can answer truthfully without flinching.
 */

export type Question = {
  id: string;
  q: string;
  /** Optional softer reframing shown beneath the question. */
  hint?: string;
};

export type ScoreBand = {
  /** Lower bound (inclusive). */
  min: number;
  /** Upper bound (inclusive). */
  max: number;
  title: string;
  body: string;
  /** 1–3 article slugs from the site to gently suggest reading next. */
  suggestArticles: string[];
  /** 1–3 herb slugs from the herbs page to gently suggest exploring. */
  suggestHerbs: string[];
};

export type Assessment = {
  slug: string;
  title: string;
  oneLiner: string;
  blurb: string;
  imageKey: string;          // matches /assessments/assess-{key}.webp on Bunny
  estimatedMinutes: number;
  questions: Question[];
  bands: ScoreBand[];
};

const LIKERT_HINT = "0 = never, 1 = sometimes, 2 = often, 3 = nearly always";

export const ASSESSMENTS: Assessment[] = [
  // 1
  {
    slug: "perimenopause-symptom-check-in",
    title: "The Soft Symptom Check-In",
    oneLiner: "A whole-body listen, head to hips.",
    blurb:
      "Eight gentle questions covering the most common perimenopause whispers — heat, sleep, mood, cycle, joints. Designed to help you name what you've been carrying.",
    imageKey: "symptoms",
    estimatedMinutes: 4,
    questions: [
      { id: "heat", q: "Do you feel sudden warmth rising through your chest, neck, or face?", hint: LIKERT_HINT },
      { id: "sleep", q: "Do you wake between 2 and 4 a.m. and struggle to fall back asleep?" },
      { id: "mood", q: "Does your mood drop or sharpen in the week before your period?" },
      { id: "cycle", q: "Has your cycle become shorter, heavier, or unpredictable in the last year?" },
      { id: "joints", q: "Do small aches turn up in places you didn't notice before — fingers, hips, jaw?" },
      { id: "fog", q: "Do words or names slip away mid-sentence?" },
      { id: "skin", q: "Has your skin felt drier, thinner, or more sensitive than usual?" },
      { id: "energy", q: "Does mid-afternoon feel like wading through soft sand?" },
    ],
    bands: [
      {
        min: 0,
        max: 7,
        title: "A quiet murmur",
        body:
          "Your body is whispering, not yet speaking up. This is a beautiful moment for prevention — a few small daily rituals now buys real ease later.",
        suggestArticles: ["the-late-30s-perimenopause-onset-nobody-warned-you-about", "perimenopause-and-anxiety-the-link-most-doctors-miss"],
        suggestHerbs: ["maca-root", "rhodiola-rosea", "magnesium-glycinate"],
      },
      {
        min: 8,
        max: 16,
        title: "A clear conversation",
        body:
          "Your nervous and endocrine systems are in real dialogue with you. Naming it is the first kindness. The next is steady, loving structure — sleep, protein, herbs, and a knowledgeable practitioner.",
        suggestArticles: ["perimenopause-brain-fog-when-your-words-go-missing", "perimenopause-sleep-the-2am-wake-up-explained", "the-truth-about-hrt-in-perimenopause"],
        suggestHerbs: ["black-cohosh", "ashwagandha", "vitex-chasteberry", "magnesium-glycinate"],
      },
      {
        min: 17,
        max: 24,
        title: "A loud, loving call",
        body:
          "Your body is asking for more support than rituals alone can offer. Please consider booking a perimenopause-literate clinician this month. You deserve concrete relief, not stoicism.",
        suggestArticles: ["the-truth-about-hrt-in-perimenopause", "perimenopause-rage-the-symptom-nobody-talks-about", "perimenopause-and-anxiety-the-link-most-doctors-miss"],
        suggestHerbs: ["black-cohosh", "ashwagandha", "vitex-chasteberry", "evening-primrose-oil"],
      },
    ],
  },

  // 2
  {
    slug: "cycle-pattern-listener",
    title: "The Cycle Pattern Listener",
    oneLiner: "Track what your bleeds are trying to say.",
    blurb:
      "A gentle look at the rhythm of your cycle, because perimenopause often shows up first in the calendar before it shows up in the body.",
    imageKey: "cycle",
    estimatedMinutes: 3,
    questions: [
      { id: "length", q: "Has your cycle length changed by more than 5 days in the last year?" },
      { id: "flow", q: "Has your bleed become noticeably heavier or clottier?" },
      { id: "spotting", q: "Do you spot in the days before your period arrives?" },
      { id: "skip", q: "Have you skipped a period in the last 6 months that wasn't pregnancy?" },
      { id: "mid", q: "Do you feel mid-cycle pelvic twinges or unfamiliar tenderness?" },
      { id: "pms", q: "Has PMS sharpened — earlier, longer, more emotional?" },
    ],
    bands: [
      { min: 0, max: 5, title: "Steady tide", body: "Your cycle is still mostly metronomic. A monthly tracking habit will catch the first shift before it surprises you.", suggestArticles: ["the-late-30s-perimenopause-onset-nobody-warned-you-about"], suggestHerbs: ["vitex-chasteberry", "raspberry-leaf"] },
      { min: 6, max: 11, title: "Shifting tide", body: "Your hormones are starting to renegotiate. Track for two more cycles, then bring the data to a perimenopause-literate clinician.", suggestArticles: ["the-truth-about-hrt-in-perimenopause", "perimenopause-and-anxiety-the-link-most-doctors-miss"], suggestHerbs: ["vitex-chasteberry", "evening-primrose-oil", "magnesium-glycinate"] },
      { min: 12, max: 18, title: "Real turbulence", body: "Heavy or skipped bleeds in this band warrant a thyroid panel and a transvaginal ultrasound to rule out fibroids and polyps. Insist on it.", suggestArticles: ["the-truth-about-hrt-in-perimenopause"], suggestHerbs: ["vitex-chasteberry", "shepherds-purse", "raspberry-leaf"] },
    ],
  },

  // 3
  {
    slug: "mood-and-rage-listener",
    title: "The Mood & Rage Listener",
    oneLiner: "What if it isn't you — it's your hormones?",
    blurb:
      "An honest look at the irritation, sadness, and unfamiliar rage that often arrive in the perimenopause years. You are not difficult. Your serotonin is.",
    imageKey: "mood",
    estimatedMinutes: 4,
    questions: [
      { id: "rage", q: "Do you feel sudden, disproportionate anger at small things?" },
      { id: "tear", q: "Do you cry more easily — at songs, ads, kindness?" },
      { id: "drop", q: "Does your mood drop noticeably in the week before bleeding?" },
      { id: "patient", q: "Has your patience for noise, mess, or interruption shrunk?" },
      { id: "joy", q: "Do activities that used to bring joy feel flat?" },
      { id: "hope", q: "Do you feel a quiet hopelessness that wasn't there a year ago?" },
    ],
    bands: [
      { min: 0, max: 5, title: "Mostly settled", body: "Your nervous system is holding. Keep the practices that are working — sleep, sunlight, movement, magnesium.", suggestArticles: ["perimenopause-and-anxiety-the-link-most-doctors-miss"], suggestHerbs: ["ashwagandha", "magnesium-glycinate", "lemon-balm"] },
      { min: 6, max: 11, title: "Frayed edges", body: "Your hormones are pulling on your serotonin. Add adaptogens, protein at breakfast, and gentle morning sunlight. Notice the difference within two weeks.", suggestArticles: ["perimenopause-rage-the-symptom-nobody-talks-about", "perimenopause-and-anxiety-the-link-most-doctors-miss"], suggestHerbs: ["ashwagandha", "rhodiola-rosea", "saffron", "saint-johns-wort"] },
      { min: 12, max: 18, title: "Please get support", body: "These scores warrant real help. Therapy is not weakness, and SSRIs or HRT can be the missing pillar. Please book a clinician this week.", suggestArticles: ["perimenopause-rage-the-symptom-nobody-talks-about", "the-truth-about-hrt-in-perimenopause"], suggestHerbs: ["saffron", "saint-johns-wort", "ashwagandha"] },
    ],
  },

  // 4
  {
    slug: "sleep-quality-listener",
    title: "The Sleep Quality Listener",
    oneLiner: "Why 2 a.m. became your enemy.",
    blurb:
      "A loving inventory of how perimenopause is reshaping your sleep, and what the patterns suggest about cortisol, progesterone, and core temperature.",
    imageKey: "sleep",
    estimatedMinutes: 3,
    questions: [
      { id: "wake", q: "Do you wake between 2 and 4 a.m. most nights?" },
      { id: "fall", q: "Does it take more than 30 minutes to fall back asleep?" },
      { id: "heat", q: "Do night sweats wake you?" },
      { id: "mind", q: "Does your mind race the moment you wake?" },
      { id: "tired", q: "Do you wake more tired than you went to bed?" },
      { id: "afternoon", q: "Do you crash at 3 p.m. and need caffeine to function?" },
    ],
    bands: [
      { min: 0, max: 5, title: "Sleeping mostly well", body: "Lovely. Protect your sleep windows fiercely — they will be the foundation of every other system.", suggestArticles: ["perimenopause-sleep-the-2am-wake-up-explained"], suggestHerbs: ["magnesium-glycinate", "lavender", "lemon-balm"] },
      { min: 6, max: 11, title: "A wobbly nest", body: "Your sleep architecture is shifting. Try magnesium glycinate, a cool room, and 30 minutes of morning sunlight. Most readers see results within a fortnight.", suggestArticles: ["perimenopause-sleep-the-2am-wake-up-explained"], suggestHerbs: ["magnesium-glycinate", "valerian", "lavender", "ashwagandha"] },
      { min: 12, max: 18, title: "Real exhaustion", body: "Chronic sleep loss accelerates everything else. Please rule out sleep apnea and consider progesterone with a knowledgeable doctor — it is the single most underused tool here.", suggestArticles: ["the-truth-about-hrt-in-perimenopause", "perimenopause-sleep-the-2am-wake-up-explained"], suggestHerbs: ["magnesium-glycinate", "valerian", "passionflower"] },
    ],
  },

  // 5
  {
    slug: "energy-and-fatigue-listener",
    title: "The Energy & Fatigue Listener",
    oneLiner: "Where did your battery go?",
    blurb:
      "A short check-in for the bone-deep tired so many women in their 40s describe but rarely name. The pattern points to whether to start with adrenals, thyroid, iron, or sleep.",
    imageKey: "energy",
    estimatedMinutes: 3,
    questions: [
      { id: "wake", q: "Do you wake feeling unrested, regardless of hours slept?" },
      { id: "afternoon", q: "Do you crash hard between 2 and 4 p.m.?" },
      { id: "stairs", q: "Do small efforts (stairs, errands) feel disproportionate?" },
      { id: "exercise", q: "Has your tolerance for exercise dropped in the past year?" },
      { id: "cold", q: "Do you feel cold even when others are comfortable?" },
      { id: "hair", q: "Has your hair thinned, or your eyebrow tail receded?" },
    ],
    bands: [
      { min: 0, max: 5, title: "Reasonably charged", body: "Keep your routines. Strength training twice a week and 30g of protein at breakfast will protect this.", suggestArticles: ["perimenopause-fatigue-its-not-just-tiredness"], suggestHerbs: ["rhodiola-rosea", "maca-root", "iron-bisglycinate"] },
      { min: 6, max: 11, title: "Running on fumes", body: "Your adrenals and thyroid deserve a closer look. Ask for a full thyroid panel (TSH, free T3, free T4, antibodies) plus ferritin and vitamin D.", suggestArticles: ["perimenopause-fatigue-its-not-just-tiredness"], suggestHerbs: ["rhodiola-rosea", "ashwagandha", "iron-bisglycinate", "b12-methylcobalamin"] },
      { min: 12, max: 18, title: "Please rest and test", body: "This level of fatigue is not normal. Please get bloodwork this month. Anaemia, hypothyroidism, and adrenal exhaustion are common, treatable, and frequently missed.", suggestArticles: ["perimenopause-fatigue-its-not-just-tiredness"], suggestHerbs: ["iron-bisglycinate", "ashwagandha", "rhodiola-rosea"] },
    ],
  },

  // 6
  {
    slug: "cognition-and-brain-fog-listener",
    title: "The Cognition & Brain Fog Listener",
    oneLiner: "When your mind feels like it has been fogged from the inside.",
    blurb:
      "A loving look at memory, focus, and word-finding. Brain fog in perimenopause is real, common, and almost always reversible with the right support.",
    imageKey: "cognition",
    estimatedMinutes: 3,
    questions: [
      { id: "words", q: "Do words slip away mid-sentence?" },
      { id: "tasks", q: "Do you walk into rooms and forget why?" },
      { id: "focus", q: "Has your ability to read a long article dropped?" },
      { id: "names", q: "Do familiar names take longer to retrieve?" },
      { id: "decisions", q: "Do small decisions exhaust you more than they used to?" },
      { id: "safety", q: "Have you worried, even briefly, that something more serious is happening?" },
    ],
    bands: [
      { min: 0, max: 5, title: "A few wobbles", body: "Normal variability. Sleep, hydration, and omega-3 will keep you sharp.", suggestArticles: ["perimenopause-brain-fog-when-your-words-go-missing"], suggestHerbs: ["lions-mane", "bacopa-monnieri", "omega-3"] },
      { min: 6, max: 11, title: "A genuine fog", body: "This is classic perimenopausal cognitive change. It is hormonal, not neurological. Lions mane, omega-3, and oestrogen support all help.", suggestArticles: ["perimenopause-brain-fog-when-your-words-go-missing", "the-truth-about-hrt-in-perimenopause"], suggestHerbs: ["lions-mane", "bacopa-monnieri", "omega-3", "phosphatidylserine"] },
      { min: 12, max: 18, title: "Please get tested", body: "These scores warrant a thyroid panel, B12, ferritin, and a serious conversation about HRT. Most women see profound improvement within 8 weeks of treatment.", suggestArticles: ["perimenopause-brain-fog-when-your-words-go-missing", "the-truth-about-hrt-in-perimenopause"], suggestHerbs: ["lions-mane", "phosphatidylserine", "omega-3"] },
    ],
  },

  // 7
  {
    slug: "stress-and-nervous-system-listener",
    title: "The Stress & Nervous System Listener",
    oneLiner: "Are you running on cortisol fumes?",
    blurb:
      "Perimenopause and chronic stress are a brutal combination. This is a soft check on your sympathetic load and how much your nervous system is asking for repair.",
    imageKey: "stress",
    estimatedMinutes: 3,
    questions: [
      { id: "startle", q: "Do you startle easily — a door slam, a phone buzz?" },
      { id: "breath", q: "Do you notice yourself holding your breath through the day?" },
      { id: "jaw", q: "Do you wake with a clenched jaw or tight shoulders?" },
      { id: "rest", q: "Does true rest feel impossible — even on holiday?" },
      { id: "tears", q: "Do small kindnesses make you cry?" },
      { id: "pulse", q: "Do you feel your heart pounding for no reason?" },
    ],
    bands: [
      { min: 0, max: 5, title: "Mostly regulated", body: "Your vagal tone is good. Keep the breath practices and the boundaries.", suggestArticles: ["perimenopause-and-anxiety-the-link-most-doctors-miss"], suggestHerbs: ["ashwagandha", "lemon-balm", "magnesium-glycinate"] },
      { min: 6, max: 11, title: "Adrenal weariness", body: "Your stress system is asking for repair. Daily protein, daily walks, and an adaptogen blend in the morning will move the needle.", suggestArticles: ["perimenopause-and-anxiety-the-link-most-doctors-miss"], suggestHerbs: ["ashwagandha", "rhodiola-rosea", "holy-basil", "lemon-balm"] },
      { min: 12, max: 18, title: "Burnout territory", body: "Please consider a sabbatical, real therapy, and removing one big draining commitment this month. You cannot herb your way out of structural overload.", suggestArticles: ["perimenopause-and-anxiety-the-link-most-doctors-miss", "perimenopause-fatigue-its-not-just-tiredness"], suggestHerbs: ["ashwagandha", "holy-basil", "magnolia-bark"] },
    ],
  },

  // 8
  {
    slug: "relationship-and-intimacy-listener",
    title: "The Relationship & Intimacy Listener",
    oneLiner: "Perimenopause changes how we love and are loved.",
    blurb:
      "A tender check-in on connection, communication, and the shifts that perimenopause brings to partnership. There is nothing to fix here that honesty cannot reach.",
    imageKey: "relationship",
    estimatedMinutes: 3,
    questions: [
      { id: "patience", q: "Has your patience with your partner or close people shrunk?" },
      { id: "touch", q: "Has your appetite for touch changed?" },
      { id: "alone", q: "Do you crave more time alone than before?" },
      { id: "voice", q: "Do you feel less tolerant of being unheard?" },
      { id: "honest", q: "Are there things you wish you could say but haven't?" },
      { id: "warmth", q: "Do you still feel warmth toward the people you love?" },
    ],
    bands: [
      { min: 0, max: 5, title: "Gently connected", body: "You are doing the slow work of staying open. Honour the small rituals — they are the actual relationship.", suggestArticles: ["perimenopause-and-relationships-the-quiet-renegotiation"], suggestHerbs: ["rose-petal", "schisandra"] },
      { min: 6, max: 11, title: "A real renegotiation", body: "Perimenopause naturally brings a re-sorting of what you can carry for others. A weekly honest conversation matters more right now than any herb.", suggestArticles: ["perimenopause-and-relationships-the-quiet-renegotiation"], suggestHerbs: ["rose-petal", "schisandra", "shatavari"] },
      { min: 12, max: 18, title: "Please find a witness", body: "When connection feels foreclosed, a couples therapist or a wise friend can help you find words for what your body already knows. Please reach for support.", suggestArticles: ["perimenopause-and-relationships-the-quiet-renegotiation"], suggestHerbs: ["rose-petal", "shatavari"] },
    ],
  },

  // 9
  {
    slug: "libido-and-sensuality-listener",
    title: "The Libido & Sensuality Listener",
    oneLiner: "Desire isn't gone — it has changed shape.",
    blurb:
      "An unhurried check-in on libido, lubrication, and pleasure. Perimenopause re-tunes the body's erotic intelligence rather than ending it.",
    imageKey: "libido",
    estimatedMinutes: 3,
    questions: [
      { id: "spark", q: "Has spontaneous desire dropped?" },
      { id: "respond", q: "Do you still respond to touch when invited?" },
      { id: "lubrication", q: "Has lubrication or comfort during sex changed?" },
      { id: "skin", q: "Has the way your skin enjoys touch shifted?" },
      { id: "fantasy", q: "Has the rhythm of your fantasies changed?" },
      { id: "shame", q: "Do you feel shame about any of this?" },
    ],
    bands: [
      { min: 0, max: 5, title: "Steady and curious", body: "Your erotic body is intact and asking only for attention. Schedule pleasure the way you schedule meetings.", suggestArticles: ["perimenopause-and-libido-the-honest-truth"], suggestHerbs: ["maca-root", "shatavari", "schisandra"] },
      { min: 6, max: 11, title: "A clear shift", body: "This is hormonal, not personal. Local oestrogen, pelvic floor work, and unhurried evenings together change the picture more than supplements ever do.", suggestArticles: ["perimenopause-and-libido-the-honest-truth", "the-truth-about-hrt-in-perimenopause"], suggestHerbs: ["maca-root", "shatavari", "tribulus-terrestris"] },
      { min: 12, max: 18, title: "Please ask for testosterone", body: "Low desire plus discomfort during sex is a clear signal that local oestrogen and a small testosterone trial may be life-changing. A perimenopause-literate clinician will know.", suggestArticles: ["perimenopause-and-libido-the-honest-truth", "the-truth-about-hrt-in-perimenopause"], suggestHerbs: ["maca-root", "tribulus-terrestris", "shatavari"] },
    ],
  },

  // 10
  {
    slug: "nutrition-and-blood-sugar-listener",
    title: "The Nutrition & Blood Sugar Listener",
    oneLiner: "Why the same food is suddenly betraying you.",
    blurb:
      "A loving look at how perimenopause shifts insulin sensitivity, cravings, and the foods that used to work. Small changes here ripple into everything.",
    imageKey: "nutrition",
    estimatedMinutes: 3,
    questions: [
      { id: "crave", q: "Do you crave sugar or carbs late afternoon or evening?" },
      { id: "shake", q: "Do you feel shaky or irritable between meals?" },
      { id: "bloat", q: "Does your belly bloat by evening regardless of what you ate?" },
      { id: "weight", q: "Has weight crept on around your middle in the last year?" },
      { id: "alcohol", q: "Does alcohol affect you more than it used to?" },
      { id: "skin", q: "Has acne or breakouts returned?" },
    ],
    bands: [
      { min: 0, max: 5, title: "Steady metabolism", body: "Beautiful. Keep the protein-forward breakfasts and the strength training. They will protect you for the next decade.", suggestArticles: ["perimenopause-nutrition-the-quiet-rules-that-change"], suggestHerbs: ["berberine", "magnesium-glycinate"] },
      { min: 6, max: 11, title: "Insulin starting to drift", body: "Your insulin sensitivity is shifting. Try 30g of protein at breakfast, walking after meals, and reducing alcohol to once a week for two weeks. Notice everything.", suggestArticles: ["perimenopause-nutrition-the-quiet-rules-that-change", "perimenopause-weight-gain-and-the-belly-shift"], suggestHerbs: ["berberine", "inositol", "chromium"] },
      { min: 12, max: 18, title: "Please request a panel", body: "Ask for HbA1c, fasting insulin, and a lipid panel. Insulin resistance in perimenopause is common, treatable, and the root of many other symptoms.", suggestArticles: ["perimenopause-nutrition-the-quiet-rules-that-change", "perimenopause-weight-gain-and-the-belly-shift"], suggestHerbs: ["berberine", "inositol", "chromium", "magnesium-glycinate"] },
    ],
  },

  // 11
  {
    slug: "readiness-for-hrt-conversation",
    title: "The Readiness-For-HRT Conversation",
    oneLiner: "Are you ready to ask the question?",
    blurb:
      "A grounded inventory to help you decide whether your next clinician visit should include the HRT conversation. There is no wrong answer — only your own.",
    imageKey: "readiness",
    estimatedMinutes: 4,
    questions: [
      { id: "symptoms", q: "Do you have moderate-to-severe symptoms more than 3 days a week?" },
      { id: "function", q: "Are your symptoms affecting work, parenting, or relationships?" },
      { id: "tried", q: "Have lifestyle changes alone been insufficient for at least 3 months?" },
      { id: "risk", q: "Are you under 60 or within 10 years of your last period?" },
      { id: "history", q: "Do you have a history of severe migraine with aura, breast cancer, or unprovoked clots?", hint: "This question reverses: 0 = no, 3 = yes." },
      { id: "informed", q: "Have you read at least one balanced, evidence-led article on HRT?" },
      { id: "support", q: "Do you have a clinician open to evidence-based perimenopause care?" },
    ],
    bands: [
      { min: 0, max: 7, title: "Hold the question for now", body: "Lifestyle, herbs, and time are reasonable next steps. Re-take this in 3 months.", suggestArticles: ["the-truth-about-hrt-in-perimenopause"], suggestHerbs: ["black-cohosh", "vitex-chasteberry", "ashwagandha"] },
      { min: 8, max: 14, title: "It's a fair question to ask", body: "Bring this score to a perimenopause-literate clinician. Frame it as: 'My symptoms are affecting daily life and I'd like to discuss whether HRT is appropriate.'", suggestArticles: ["the-truth-about-hrt-in-perimenopause"], suggestHerbs: ["black-cohosh", "ashwagandha", "magnesium-glycinate"] },
      { min: 15, max: 21, title: "Please have the conversation soon", body: "Your symptoms warrant a real discussion. The recent evidence on HRT for women under 60 is reassuring; the bigger risk is often the cost of waiting.", suggestArticles: ["the-truth-about-hrt-in-perimenopause"], suggestHerbs: ["ashwagandha", "magnesium-glycinate", "rhodiola-rosea"] },
    ],
  },
];

export function findAssessment(slug: string): Assessment | undefined {
  return ASSESSMENTS.find((a) => a.slug === slug);
}
