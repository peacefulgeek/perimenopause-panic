export interface ArticleBlueprint {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  metaDescription: string;
  imageAlt: string;
  opener: "gut-punch" | "question" | "story" | "counterintuitive";
  conclusion: "cta" | "reflection" | "question" | "challenge" | "benediction";
  authority: { name: string; href: string };
}

const NIH_FSH = {
  name: "NIH StatPearls overview of FSH biology",
  href: "https://www.ncbi.nlm.nih.gov/books/NBK535442/",
};
const NAMS = {
  name: "The Menopause Society 2022 hormone therapy position statement",
  href: "https://menopause.org/professional-resources/position-statements",
};
const CDC_SLEEP = {
  name: "CDC adult sleep recommendations",
  href: "https://www.cdc.gov/sleep/about/index.html",
};
const NIH_DEPRESSION = {
  name: "NIH NIMH on depression in midlife women",
  href: "https://www.nimh.nih.gov/health/topics/depression",
};
const NIH_THYROID = {
  name: "NIDDK overview of hypothyroidism",
  href: "https://www.niddk.nih.gov/health-information/endocrine-diseases/hypothyroidism",
};
const NIH_HEART = {
  name: "NHLBI on heart disease in women",
  href: "https://www.nhlbi.nih.gov/health/heart-disease-women",
};
const NIH_BONE = {
  name: "NIAMS on bone health and osteoporosis",
  href: "https://www.niams.nih.gov/health-topics/osteoporosis",
};
const PUBMED_HRT = {
  name: "PubMed reanalysis of the Women's Health Initiative",
  href: "https://pubmed.ncbi.nlm.nih.gov/35435270/",
};
const PUBMED_PROG = {
  name: "PubMed review of micronised progesterone in perimenopause",
  href: "https://pubmed.ncbi.nlm.nih.gov/29754194/",
};
const NIH_GSM = {
  name: "NIH StatPearls genitourinary syndrome of menopause",
  href: "https://www.ncbi.nlm.nih.gov/books/NBK559253/",
};
const NIH_INSULIN = {
  name: "NIDDK on insulin resistance and prediabetes",
  href: "https://www.niddk.nih.gov/health-information/diabetes/overview/what-is-diabetes/prediabetes-insulin-resistance",
};
const NIH_BRAIN = {
  name: "NIH on estrogen and the female brain",
  href: "https://www.ninds.nih.gov/health-information/disorders/migraine",
};
const NIH_EXERCISE = {
  name: "ODPHP Physical Activity Guidelines for Americans",
  href: "https://health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines",
};

export const ARTICLE_BLUEPRINTS: ArticleBlueprint[] = [
  {
    slug: "perimenopause-starts-late-30s",
    title: "Perimenopause Starts in Your Late 30s. Why Nobody Told You.",
    category: "diagnosis",
    tags: ["perimenopause", "late-30s", "diagnosis", "fsh", "doctor"],
    metaDescription:
      "Perimenopause routinely begins in the late 30s. Here is why your doctor missed it and what the actual evidence says.",
    imageAlt: "Soft morning light across a warm cream room with a journal and tea.",
    opener: "gut-punch",
    conclusion: "cta",
    authority: NIH_FSH,
  },
  {
    slug: "the-hormonal-cascade",
    title: "The Hormonal Cascade. What Is Actually Happening to Your Body.",
    category: "biology",
    tags: ["estrogen", "progesterone", "fsh", "biology", "perimenopause"],
    metaDescription:
      "Estrogen rises and crashes. Progesterone disappears first. Here is the cascade nobody draws on the whiteboard.",
    imageAlt: "An abstract painted swirl in cream and terra cotta.",
    opener: "counterintuitive",
    conclusion: "reflection",
    authority: NIH_FSH,
  },
  {
    slug: "estrogen-and-the-female-brain",
    title: "Estrogen and the Female Brain. What Lisa Mosconi Found.",
    category: "brain",
    tags: ["brain", "estrogen", "cognition", "mosconi", "neurology"],
    metaDescription:
      "Estrogen is the master regulator of female metabolism in the brain. Lisa Mosconi's research changed the conversation.",
    imageAlt: "A wide-format watercolour of a tree in soft cream backlight.",
    opener: "story",
    conclusion: "challenge",
    authority: NIH_BRAIN,
  },
  {
    slug: "perimenopause-vs-pms",
    title: "Perimenopause Versus PMS. How to Know the Difference.",
    category: "diagnosis",
    tags: ["pms", "diagnosis", "cycle", "premenstrual", "perimenopause"],
    metaDescription:
      "PMS is cyclical. Perimenopause is destabilising. Here is the practical decision tree.",
    imageAlt: "A clean editorial flat lay of a calendar and a warm mug.",
    opener: "question",
    conclusion: "cta",
    authority: NIH_FSH,
  },
  {
    slug: "night-sweats-thermoregulation-breakdown",
    title: "Night Sweats, Hot Flashes, and the Thermoregulation Breakdown.",
    category: "symptoms",
    tags: ["hot-flashes", "night-sweats", "cooling", "sleep", "thermoregulation"],
    metaDescription:
      "Vasomotor symptoms are not in your head. They are a hypothalamic event with predictable triggers and remedies.",
    imageAlt: "An open window at dusk with a warm breeze blowing a linen curtain.",
    opener: "story",
    conclusion: "cta",
    authority: NIH_FSH,
  },
  {
    slug: "perimenopause-brain-fog",
    title: "Perimenopause Brain Fog. What Is Neurologically Happening.",
    category: "brain",
    tags: ["fog", "memory", "brain", "estrogen", "cognition"],
    metaDescription:
      "Brain fog is real, measurable, and almost always reversible. Here is what is happening in the wiring.",
    imageAlt: "A foggy field at sunrise with warm tones over the horizon.",
    opener: "gut-punch",
    conclusion: "reflection",
    authority: NIH_BRAIN,
  },
  {
    slug: "perimenopausal-anxiety",
    title: "Perimenopausal Anxiety. The Hormone-Mental Health Connection.",
    category: "mental-health",
    tags: ["anxiety", "mood", "estrogen", "progesterone", "mental-health"],
    metaDescription:
      "New onset anxiety in your forties is a hormonal event before it is a personality flaw. Here is the evidence.",
    imageAlt: "A still life of a candle and a worn book on a wooden surface.",
    opener: "question",
    conclusion: "challenge",
    authority: NIH_DEPRESSION,
  },
  {
    slug: "perimenopause-rage",
    title: "Perimenopause Rage. Why You Are Losing It and What Is Behind It.",
    category: "mental-health",
    tags: ["rage", "anger", "mood", "perimenopause"],
    metaDescription:
      "The rage is real. It is also explicable. Here is the neuroendocrine story behind your fuse.",
    imageAlt: "A close up of a flickering candle flame against a warm background.",
    opener: "gut-punch",
    conclusion: "challenge",
    authority: NIH_DEPRESSION,
  },
  {
    slug: "perimenopause-sleep-3am",
    title: "Sleep in Perimenopause. Why You Wake at 3am and Cannot Go Back.",
    category: "sleep",
    tags: ["sleep", "insomnia", "3am", "cortisol", "progesterone"],
    metaDescription:
      "The 3am wake-up has a name and a mechanism. Here is what is happening and what actually helps.",
    imageAlt: "A bedside table with a warm lamp and a glass of water.",
    opener: "story",
    conclusion: "cta",
    authority: CDC_SLEEP,
  },
  {
    slug: "irregular-cycles-what-is-normal",
    title: "The Irregular Cycle. What Is Normal and What Needs Investigation.",
    category: "diagnosis",
    tags: ["cycle", "bleeding", "perimenopause", "investigation"],
    metaDescription:
      "Cycles get weird in perimenopause. Here is the line between normal weird and call-your-clinician weird.",
    imageAlt: "A folded paper calendar with hand-marked dates.",
    opener: "counterintuitive",
    conclusion: "cta",
    authority: NIH_FSH,
  },
  {
    slug: "perimenopause-and-thyroid-overlap",
    title: "Perimenopause and Your Thyroid. The Frequently Missed Overlap.",
    category: "diagnosis",
    tags: ["thyroid", "tsh", "diagnosis", "fatigue"],
    metaDescription:
      "The thyroid mimics perimenopause and vice versa. Here is the panel to ask for and what to watch.",
    imageAlt: "A laboratory test tube rack on a warm wood surface.",
    opener: "question",
    conclusion: "cta",
    authority: NIH_THYROID,
  },
  {
    slug: "insulin-resistance-perimenopause",
    title: "Insulin Resistance in Perimenopause. The Metabolic Shift.",
    category: "metabolic",
    tags: ["insulin", "metabolism", "weight", "hba1c"],
    metaDescription:
      "Insulin sensitivity drops with estrogen. Here is what to test, what to track, and what reverses it.",
    imageAlt: "A bowl of berries and walnuts on a cream linen napkin.",
    opener: "counterintuitive",
    conclusion: "challenge",
    authority: NIH_INSULIN,
  },
  {
    slug: "estrogen-heart-window",
    title: "Estrogen and Heart Health. The Cardiovascular Window You Did Not Know Existed.",
    category: "cardio",
    tags: ["heart", "cardio", "estrogen", "hrt", "window"],
    metaDescription:
      "There is a cardioprotective window in early menopause. Missing it has consequences. Here is the evidence.",
    imageAlt: "A warm watercolour heart shape on cream paper.",
    opener: "gut-punch",
    conclusion: "cta",
    authority: NIH_HEART,
  },
  {
    slug: "bone-density-perimenopause",
    title: "Bone Density and Perimenopause. Starting Earlier Than You Think.",
    category: "bone",
    tags: ["bone", "osteoporosis", "dexa", "calcium", "vitamin-d"],
    metaDescription:
      "Bone loss accelerates years before your last period. Here is the early-action playbook.",
    imageAlt: "A pair of running shoes on a sunlit cream floor.",
    opener: "counterintuitive",
    conclusion: "cta",
    authority: NIH_BONE,
  },
  {
    slug: "dutch-test-vs-standard-labs",
    title: "The DUTCH Test. Why Standard Hormone Labs Miss the Whole Picture.",
    category: "testing",
    tags: ["dutch", "lab", "estrogen", "metabolites", "testing"],
    metaDescription:
      "Serum hormones are a snapshot. The DUTCH test is a video. Here is when each one earns its keep.",
    imageAlt: "A laboratory dropper and small glass vial on cream linen.",
    opener: "question",
    conclusion: "reflection",
    authority: NAMS,
  },
  {
    slug: "fsh-testing-not-enough",
    title: "FSH Testing Is Not Enough. How to Actually Diagnose Perimenopause.",
    category: "testing",
    tags: ["fsh", "diagnosis", "lab", "perimenopause"],
    metaDescription:
      "An FSH number on the wrong cycle day proves nothing. Here is the real diagnostic playbook.",
    imageAlt: "A pen and clipboard on a wood desk with morning light.",
    opener: "gut-punch",
    conclusion: "cta",
    authority: NIH_FSH,
  },
  {
    slug: "hrt-2025-evidence",
    title: "Hormone Therapy in 2025. What the Evidence Actually Shows.",
    category: "hrt",
    tags: ["hrt", "evidence", "whi", "menopause", "estrogen"],
    metaDescription:
      "The evidence on hormone therapy moved on. Your doctor's training may not have. Here is the modern position.",
    imageAlt: "A small estradiol patch on warm cream skin tone fabric.",
    opener: "counterintuitive",
    conclusion: "challenge",
    authority: PUBMED_HRT,
  },
  {
    slug: "bioidentical-vs-synthetic",
    title: "Bioidentical Versus Synthetic Hormones. A Clear Breakdown.",
    category: "hrt",
    tags: ["bioidentical", "synthetic", "hrt", "estrogen", "progesterone"],
    metaDescription:
      "The bioidentical conversation has been muddled by marketing. Here is the actual chemistry and the actual evidence.",
    imageAlt: "Glass vials and a wood spoon on a soft blush napkin.",
    opener: "question",
    conclusion: "reflection",
    authority: NAMS,
  },
  {
    slug: "transdermal-vs-oral-estrogen",
    title: "Transdermal Estrogen Versus Oral. Why the Route Matters.",
    category: "hrt",
    tags: ["transdermal", "oral", "estrogen", "patch", "clot-risk"],
    metaDescription:
      "Route changes risk. Patches and gels bypass first-pass liver metabolism, and that matters. Here is the evidence.",
    imageAlt: "A small patch on a soft warm cream background.",
    opener: "counterintuitive",
    conclusion: "cta",
    authority: PUBMED_HRT,
  },
  {
    slug: "progesterone-underrated",
    title: "Progesterone. The Most Underrated Hormone in Perimenopause.",
    category: "hrt",
    tags: ["progesterone", "sleep", "anxiety", "endometrial"],
    metaDescription:
      "Micronised progesterone is a workhorse for sleep, anxiety and endometrial protection. Here is the case.",
    imageAlt: "A small glass jar with a soft warm light over linen.",
    opener: "story",
    conclusion: "cta",
    authority: PUBMED_PROG,
  },
  {
    slug: "non-hormonal-options-that-work",
    title: "Non-Hormonal Options That Actually Work. And Ones That Do Not.",
    category: "treatment",
    tags: ["snri", "ssri", "fezolinetant", "lifestyle", "non-hormonal"],
    metaDescription:
      "Not everyone wants or can take hormones. Here is the evidence-based shortlist of what helps.",
    imageAlt: "A row of wood spoons holding small herbs against cream cloth.",
    opener: "question",
    conclusion: "reflection",
    authority: NAMS,
  },
  {
    slug: "libido-changes-perimenopause",
    title: "Libido Changes in Perimenopause. A Non-Embarrassing Conversation.",
    category: "intimacy",
    tags: ["libido", "intimacy", "testosterone", "estrogen"],
    metaDescription:
      "Desire is a system, not a switch. Here is the system, the levers, and the conversation worth having.",
    imageAlt: "A linen pillow with a warm window light beside it.",
    opener: "story",
    conclusion: "reflection",
    authority: NAMS,
  },
  {
    slug: "vaginal-changes-gsm",
    title: "Vaginal Changes in Perimenopause. What Genitourinary Syndrome Actually Means.",
    category: "vaginal-health",
    tags: ["gsm", "vaginal", "atrophy", "estrogen", "moisturizer"],
    metaDescription:
      "GSM is medical, common, and treatable. Here is what it is and what works, plainly.",
    imageAlt: "A small glass jar of warm light cream on a fabric surface.",
    opener: "gut-punch",
    conclusion: "cta",
    authority: NIH_GSM,
  },
  {
    slug: "perimenopause-and-weight",
    title: "Perimenopause and Weight. What Is Metabolically Changing.",
    category: "metabolic",
    tags: ["weight", "metabolism", "muscle", "diet"],
    metaDescription:
      "Weight gain in perimenopause is hormonal, behavioural, and structural. Here is each part, and what helps.",
    imageAlt: "A scale with a small soft cloth folded on top.",
    opener: "counterintuitive",
    conclusion: "challenge",
    authority: NIH_INSULIN,
  },
  {
    slug: "exercise-and-perimenopause",
    title: "Exercise and Perimenopause. Strength Training Changes Everything.",
    category: "exercise",
    tags: ["exercise", "strength", "muscle", "bone", "training"],
    metaDescription:
      "Cardio is fine. Strength is the protocol. Here is why and how, with real load progressions.",
    imageAlt: "A pair of dumbbells on a warm wooden floor.",
    opener: "gut-punch",
    conclusion: "challenge",
    authority: NIH_EXERCISE,
  },
  {
    slug: "diet-and-perimenopause",
    title: "Diet and Perimenopause. What the Research Supports.",
    category: "metabolic",
    tags: ["diet", "protein", "fiber", "blood-sugar"],
    metaDescription:
      "Forget the trendy plates. Here is the research on protein, fiber, and blood sugar through perimenopause.",
    imageAlt: "An overhead shot of a colorful Mediterranean plate.",
    opener: "question",
    conclusion: "cta",
    authority: NIH_INSULIN,
  },
  {
    slug: "find-a-menopause-literate-doctor",
    title: "Finding a Menopause-Literate Doctor. A Practical Guide.",
    category: "advocacy",
    tags: ["doctor", "menopause", "directory", "advocacy", "consult"],
    metaDescription:
      "Most clinicians did not get this training. Here is how to find one who did, and what to ask first.",
    imageAlt: "A clipboard with a doctor's pen on a warm cream desk.",
    opener: "story",
    conclusion: "cta",
    authority: NAMS,
  },
  {
    slug: "nams-directory-how-to-use",
    title: "The NAMS Directory. How to Use It Effectively.",
    category: "advocacy",
    tags: ["nams", "menopause", "directory", "doctor"],
    metaDescription:
      "The directory is a starting point, not an answer. Here is how to read it like a clinician would.",
    imageAlt: "A laptop screen on a warm wood desk with morning light.",
    opener: "counterintuitive",
    conclusion: "cta",
    authority: NAMS,
  },
  {
    slug: "perimenopause-and-work",
    title: "Perimenopause and Work. Managing Symptoms Without Disclosing Everything.",
    category: "lifestyle",
    tags: ["work", "career", "symptoms", "boundaries"],
    metaDescription:
      "You do not owe anyone a hormonal report card. Here is the practical workplace playbook.",
    imageAlt: "A laptop and notepad on a warm cream desk with soft window light.",
    opener: "question",
    conclusion: "challenge",
    authority: NAMS,
  },
  {
    slug: "perimenopause-toolkit",
    title: "Your Perimenopause Toolkit. Building a Protocol That Works.",
    category: "lifestyle",
    tags: ["protocol", "toolkit", "lifestyle", "supplements"],
    metaDescription:
      "Hormones, sleep, strength, food, mind. Here is the assembled toolkit, in working order.",
    imageAlt: "A flat lay of a notebook, herbal tea, and small dumbbells.",
    opener: "story",
    conclusion: "benediction",
    authority: NAMS,
  },
];
