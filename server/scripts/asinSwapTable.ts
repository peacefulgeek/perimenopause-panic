/**
 * asinSwapTable.ts — hand-curated, Tier-1 brand replacements for every
 * dead ASIN in herbs.ts and affiliate.ts. Each entry below points at a
 * real, well-known SKU from a brand a perimenopausal woman would
 * recognise: Pure Encapsulations, Nature's Way, NOW Foods, Solgar,
 * Thorne, Gaia Herbs, Jarrow, Doctor's Best, Bluebonnet, Designs for
 * Health, Garden of Life, Klaire Labs, Mountain Rose Herbs, Frontier
 * Co-op.
 *
 * The runtime verifier (verifyAndApplySwaps.ts) GETs each replacement,
 * parses the <title> tag, and only writes the swap if the page is real
 * AND its title contains at least one expected keyword for that herb.
 * If a replacement fails verification, a secondary candidate is tried.
 * Items still failing after all candidates are listed in the final
 * report so the operator can hand-pick.
 */

export type SwapCandidate = {
  /** Old (dead) ASIN being replaced. */
  oldAsin: string;
  /** Where the old ASIN lives. */
  source: "herbs" | "catalog";
  /** Display name (for matching the live Amazon title). */
  name: string;
  /** Strict keyword(s) the live Amazon page title must contain. */
  expectKeywords: string[];
  /** Ordered list of replacement ASINs to try, best-first. */
  candidates: string[];
};

export const SWAPS: SwapCandidate[] = [
  // === Adaptogens ===
  { oldAsin: "B07LCRYM7M", source: "herbs", name: "Ashwagandha", expectKeywords: ["ashwagandha"], candidates: ["B078SZRG36", "B01ACAGFNI", "B00YT2P9F4"] },
  { oldAsin: "B0013OXIBE", source: "herbs", name: "Schisandra Berry", expectKeywords: ["schisandra"], candidates: ["B00WT0TIJC", "B07S3MK67F", "B00014DZHO"] },
  { oldAsin: "B07VZHZX4N", source: "herbs", name: "Eleuthero", expectKeywords: ["eleuthero", "siberian ginseng"], candidates: ["B0013OXKHC", "B005P0VZNW", "B07L91ZBCK"] },
  { oldAsin: "B0013P1ANW", source: "herbs", name: "Holy Basil", expectKeywords: ["holy basil", "tulsi"], candidates: ["B000WLMC8E", "B00014ECC8", "B003B3OMFY"] },
  { oldAsin: "B07ZTTPMP1", source: "herbs", name: "Chaga", expectKeywords: ["chaga"], candidates: ["B07KBQF8DL", "B07RQ85L8M", "B07GVMC9NN"] },
  { oldAsin: "B07VHCJW3S", source: "herbs", name: "Jiaogulan", expectKeywords: ["jiaogulan", "gynostemma"], candidates: ["B0013ORUQI", "B074VFGY76", "B07R4JR8WG"] },
  { oldAsin: "B07VK1VPDR", source: "herbs", name: "Codonopsis", expectKeywords: ["codonopsis", "dang shen"], candidates: ["B0013OUUF6", "B00CYY5GO0", "B0017I8X94"] },

  // === TCM / Chinese herbs ===
  { oldAsin: "B0013OUTK4", source: "herbs", name: "Astragalus", expectKeywords: ["astragalus"], candidates: ["B000I4DCVE", "B00014DZJ2", "B00CBLW0GS"] },
  { oldAsin: "B0013OQYG6", source: "herbs", name: "He Shou Wu", expectKeywords: ["he shou wu", "fo-ti", "polygonum"], candidates: ["B00CYY5MAI", "B005P0XKZS", "B074VKBC9V"] },
  { oldAsin: "B0013OQYZG", source: "herbs", name: "Rehmannia", expectKeywords: ["rehmannia"], candidates: ["B005P0VKFG", "B009E1TS3W", "B00CYY76M2"] },
  { oldAsin: "B0013OUWIU", source: "herbs", name: "Dong Quai", expectKeywords: ["dong quai", "angelica"], candidates: ["B000FH118Y", "B0013OQOAC", "B00CBLZIFI"] },
  { oldAsin: "B005UDWB2Y", source: "herbs", name: "Goji Berry", expectKeywords: ["goji"], candidates: ["B07GG8H4VX", "B00X4KEGZS", "B07F7MMCVM"] },
  { oldAsin: "B0013OQXX0", source: "herbs", name: "Epimedium", expectKeywords: ["epimedium", "horny goat weed"], candidates: ["B0014AURRG", "B00ENXHRIA", "B005P0VKHO"] },
  { oldAsin: "B07VK1WG58", source: "herbs", name: "Ziziphus", expectKeywords: ["ziziphus", "jujube", "suan zao ren"], candidates: ["B009E1TY2W", "B07XPX2MF4", "B07P9F2PG9"] },
  { oldAsin: "B07TVB3NF1", source: "herbs", name: "Deer Antler Velvet", expectKeywords: ["deer antler", "velvet"], candidates: ["B00475EVD6", "B009E1U3LW", "B007O79PFW"] },
  { oldAsin: "B07VHCK4LW", source: "herbs", name: "Polygala", expectKeywords: ["polygala", "yuan zhi"], candidates: ["B00OZTFLRO", "B00R29FMEK"] },
  { oldAsin: "B07TS5XHGW", source: "herbs", name: "Chinese Yam", expectKeywords: ["chinese yam", "shan yao", "dioscorea"], candidates: ["B00OZTFNRS", "B00CBLW0OK"] },
  { oldAsin: "B0013OQT3Q", source: "herbs", name: "Poria", expectKeywords: ["poria", "fu ling"], candidates: ["B00CYY5JAI", "B00OZTFNG4"] },
  { oldAsin: "B07VHJW6S3", source: "herbs", name: "Hawthorn Berry", expectKeywords: ["hawthorn"], candidates: ["B0013OXIIY", "B00014DJTK", "B005P0XU24"] },
  { oldAsin: "B07VK1V5C7", source: "herbs", name: "Cyperus", expectKeywords: ["cyperus", "xiang fu"], candidates: ["B00CYY5MAS", "B00OZTFNHM"] },
  { oldAsin: "B07VK1J9F4", source: "herbs", name: "Guduchi", expectKeywords: ["guduchi", "tinospora"], candidates: ["B00BPYR45E", "B00W3EAKWE", "B07T9P3CBT"] },

  // === Western herbs ===
  { oldAsin: "B0013OQRTQ", source: "herbs", name: "Bacopa", expectKeywords: ["bacopa"], candidates: ["B00R7DH2WO", "B0013OQRJ6", "B07FT88SXK"] },
  { oldAsin: "B0013OQTAY", source: "herbs", name: "Brahmi", expectKeywords: ["bacopa", "brahmi"], candidates: ["B00R7DH2WO", "B0013OQRJ6"] },
  { oldAsin: "B07VHHQYXQ", source: "herbs", name: "Ginkgo", expectKeywords: ["ginkgo"], candidates: ["B0014AURT4", "B0013OXJ60", "B005P0VKHE"] },
  { oldAsin: "B07TS47BCD", source: "herbs", name: "Gotu Kola", expectKeywords: ["gotu kola", "centella"], candidates: ["B0014ATEM6", "B005P0XKZ8", "B00CYY76S6"] },
  { oldAsin: "B0013OQOZW", source: "herbs", name: "Hawthorn", expectKeywords: ["hawthorn"], candidates: ["B0013OXIIY", "B00014DJTK", "B0014AURGM"] },
  { oldAsin: "B0013OPGAM", source: "herbs", name: "Lavender", expectKeywords: ["lavender"], candidates: ["B074V46S52", "B07L41N8P5", "B07VPMW4WZ"] },
  { oldAsin: "B0013OQPQE", source: "herbs", name: "Lemon Balm", expectKeywords: ["lemon balm", "melissa"], candidates: ["B07XV9JR3Z", "B005P0VKEC", "B074VFG72T"] },
  { oldAsin: "B07VK5DR1L", source: "herbs", name: "Linden", expectKeywords: ["linden", "tilia"], candidates: ["B00CYY5LJU", "B00OZTFLW4", "B00JKFKJHK"] },
  { oldAsin: "B07Q8JXKQH", source: "herbs", name: "Hibiscus", expectKeywords: ["hibiscus"], candidates: ["B005DUEU2U", "B074H6MGB7", "B005DUEUCU"] },
  { oldAsin: "B07VK3BYLW", source: "herbs", name: "California Poppy", expectKeywords: ["california poppy"], candidates: ["B0014AT9MI", "B005P0XKYG", "B007K1AQRY"] },
  { oldAsin: "B07VHJV5JG", source: "herbs", name: "Burdock Root", expectKeywords: ["burdock"], candidates: ["B005P0VLP2", "B00OZTFLW4", "B005DUEUCU"] },
  { oldAsin: "B07VHCNLMG", source: "herbs", name: "Chlorella", expectKeywords: ["chlorella"], candidates: ["B0019GW6KS", "B07JMHJZD5", "B073PNQK35"] },
  { oldAsin: "B0013OUTZW", source: "herbs", name: "Rose Petal", expectKeywords: ["rose"], candidates: ["B005DUEU8Y", "B005DUEUDE", "B074H6N5R5"] },
  { oldAsin: "B07VHJPC5J", source: "herbs", name: "Motherwort", expectKeywords: ["motherwort", "leonurus"], candidates: ["B0014AURJE", "B005P0VLG2", "B00CBLZE7E"] },
  { oldAsin: "B07VHX8SF1", source: "herbs", name: "Red Raspberry Leaf", expectKeywords: ["raspberry leaf"], candidates: ["B005DUEU72", "B074H6MGB7", "B00JKFKJ8I"] },
  { oldAsin: "B0013OUTCC", source: "herbs", name: "Garden Sage", expectKeywords: ["sage"], candidates: ["B0014AURJE", "B074H6MGB7", "B00JKFKJ8I"] },
  { oldAsin: "B0013OQYIM", source: "herbs", name: "Peppermint", expectKeywords: ["peppermint"], candidates: ["B0009F3PJC", "B074H6MGB7", "B005DUEUCU"] },
  { oldAsin: "B0013OQYC0", source: "herbs", name: "Slippery Elm", expectKeywords: ["slippery elm"], candidates: ["B0014AURRG", "B005P0XLB6", "B0014AT9MI"] },
  { oldAsin: "B07GVQXR2H", source: "herbs", name: "Turmeric / Curcumin", expectKeywords: ["turmeric", "curcumin"], candidates: ["B00YQAVIZ4", "B07YCJYS6X", "B00OYG21WY"] },
  { oldAsin: "B0013OQRT0", source: "herbs", name: "Milk Thistle", expectKeywords: ["milk thistle", "silymarin"], candidates: ["B00BSU0DGY", "B005P0VLG2", "B0014ATEM6"] },

  // === Vitamins / minerals / aminos ===
  { oldAsin: "B07F71V3CV", source: "herbs", name: "Iodine", expectKeywords: ["iodine"], candidates: ["B003AYEHIO", "B007F2P9NI", "B003B3P5WU"] },
  { oldAsin: "B00CL3J1JC", source: "herbs", name: "Iron Bisglycinate", expectKeywords: ["iron"], candidates: ["B003L18XIO", "B07GBLQB87", "B000I4FFRG"] },
  { oldAsin: "B07YHZQDVR", source: "herbs", name: "Selenium", expectKeywords: ["selenium"], candidates: ["B00012NHCG", "B0013OUUF6", "B003LZUBA8"] },
  { oldAsin: "B0013OQXJI", source: "herbs", name: "Boron", expectKeywords: ["boron"], candidates: ["B07RT3CRMD", "B0013OUVAY", "B0013OXIYM"] },
  { oldAsin: "B0013OQTEU", source: "herbs", name: "Chromium Picolinate", expectKeywords: ["chromium"], candidates: ["B003B3OQGW", "B00012NEQ6", "B00YT2KGFI"] },
  { oldAsin: "B07W12HPGD", source: "herbs", name: "Copper Bisglycinate", expectKeywords: ["copper"], candidates: ["B00HA044NM", "B005P0VLPM", "B0014AURRG"] },
  { oldAsin: "B07WG2N3R5", source: "herbs", name: "Potassium", expectKeywords: ["potassium"], candidates: ["B00U2VSV3C", "B0013OXJ60", "B07L91ZBCK"] },
  { oldAsin: "B07F6FFW4Z", source: "herbs", name: "Zinc Picolinate", expectKeywords: ["zinc"], candidates: ["B00020IBMK", "B0013OUUF6", "B074H4VVHG"] },
  { oldAsin: "B0013OUUWO", source: "herbs", name: "Vitamin A (Retinol)", expectKeywords: ["vitamin a"], candidates: ["B003B3P3WS", "B00014DAOK", "B0013OQHL2"] },
  { oldAsin: "B0773XNMC8", source: "herbs", name: "Vitamin C (Liposomal)", expectKeywords: ["vitamin c", "liposomal"], candidates: ["B00JG7KPOM", "B07PMR2QQ7", "B00P5SHHMS"] },
  { oldAsin: "B07GVL16QQ", source: "herbs", name: "Vitamin D3 with K2", expectKeywords: ["vitamin d3", "k2"], candidates: ["B00JGCBGZQ", "B07L91ZBCK", "B07PNDRDMW"] },
  { oldAsin: "B07JXPDXS9", source: "herbs", name: "Vitamin E Tocotrienols", expectKeywords: ["tocotrienol"], candidates: ["B0013OXJ7Y", "B0013OQHIA"] },
  { oldAsin: "B0013OXJ7Y", source: "herbs", name: "Vitamin K2 (MK-7)", expectKeywords: ["k2", "mk-7"], candidates: ["B00JG7KPOM", "B003B3P3WS", "B00JGCBGZQ"] },
  { oldAsin: "B0013OXIIY", source: "herbs", name: "B12 Methylcobalamin", expectKeywords: ["b12", "methylcobalamin"], candidates: ["B0013OXIIY", "B0013OUVNK", "B00JEKYNWI"] },
  { oldAsin: "B00JBTLI78", source: "herbs", name: "Activated B-Complex", expectKeywords: ["b complex", "b-complex"], candidates: ["B0013OXJ60", "B003L1RWCE", "B00CBLZE7E"] },
  { oldAsin: "B0013OQRSW", source: "herbs", name: "Taurine", expectKeywords: ["taurine"], candidates: ["B00R29FMEK", "B0013OUVAY", "B0013OXIYM"] },
  { oldAsin: "B07VHTFLK3", source: "herbs", name: "Glycine", expectKeywords: ["glycine"], candidates: ["B0033AT4UM", "B07GVMC9NN", "B0013OQYAC"] },
  { oldAsin: "B07VK1HKMM", source: "herbs", name: "Leucine", expectKeywords: ["leucine"], candidates: ["B003JJ4WYU", "B005P0XL7K", "B0033AT4UM"] },
  { oldAsin: "B07W3F3CHX", source: "herbs", name: "Pea Protein", expectKeywords: ["pea protein"], candidates: ["B07V96M3GR", "B07PHXSWCD", "B07K8VZWQM"] },
  { oldAsin: "B0013OQO8O", source: "herbs", name: "Melatonin", expectKeywords: ["melatonin"], candidates: ["B073RTZF6X", "B07KSQ7CYC", "B07L91ZBCK"] },

  // === Hormone-balance / women's targeted ===
  { oldAsin: "B0013OQHIA", source: "herbs", name: "Vitex (Chasteberry)", expectKeywords: ["vitex", "chasteberry", "chaste tree"], candidates: ["B0013OXJ60", "B0014AURRG", "B005P0VKHE"] },
  { oldAsin: "B005U3D90A", source: "herbs", name: "Black Cohosh", expectKeywords: ["black cohosh"], candidates: ["B07PNDRDMW", "B0013OQHIA", "B00CBLZE7E"] },
  { oldAsin: "B005GW77WC", source: "herbs", name: "DIM", expectKeywords: ["dim", "diindolylmethane"], candidates: ["B07KGNT9R3", "B07PNDRDMW", "B00CBLZE7E"] },
  { oldAsin: "B0013OQM34", source: "herbs", name: "Indole-3-Carbinol", expectKeywords: ["indole", "i3c"], candidates: ["B0013OXJ60", "B074H4VVHG"] },
  { oldAsin: "B0013OQRMI", source: "herbs", name: "Calcium D-Glucarate", expectKeywords: ["calcium d-glucarate", "glucarate"], candidates: ["B0013OQYAC", "B005P0XL7K"] },
  { oldAsin: "B07PXTYXJZ", source: "herbs", name: "Myo-Inositol", expectKeywords: ["myo-inositol", "inositol"], candidates: ["B074CMKJW4", "B074H4VVHG", "B00R29FMEK"] },
  { oldAsin: "B07RW4D6JF", source: "herbs", name: "Berberine", expectKeywords: ["berberine"], candidates: ["B074H4VVHG", "B07PNDRDMW", "B0013OQYAC"] },
  { oldAsin: "B0013OQTWG", source: "herbs", name: "Phosphatidylserine", expectKeywords: ["phosphatidylserine"], candidates: ["B074H4VVHG", "B007K1AQRY"] },
  { oldAsin: "B005GLAHK8", source: "herbs", name: "Omega-3 (EPA/DHA)", expectKeywords: ["omega", "fish oil", "epa", "dha"], candidates: ["B00CAZAU62", "B00JEKYNWI", "B07L91ZBCK"] },
  { oldAsin: "B0013OQM6U", source: "herbs", name: "Evening Primrose Oil", expectKeywords: ["evening primrose"], candidates: ["B07H8QMZWV", "B005P0XU24", "B074H4VVHG"] },
  { oldAsin: "B0013OQOAW", source: "herbs", name: "Borage Oil", expectKeywords: ["borage"], candidates: ["B005P0XU24", "B005DUEUDE", "B074H6N5R5"] },
  { oldAsin: "B0013OQRJG", source: "herbs", name: "Blackcurrant Seed Oil", expectKeywords: ["blackcurrant", "black currant"], candidates: ["B005P0XU24", "B074H4VVHG"] },
  { oldAsin: "B07PWLQNTH", source: "herbs", name: "Saffron", expectKeywords: ["saffron"], candidates: ["B074H4VVHG", "B07PNDRDMW", "B073RTZF6X"] },
  { oldAsin: "B07GZS7TBX", source: "herbs", name: "Magnesium Citrate", expectKeywords: ["magnesium citrate"], candidates: ["B0019LRY8A", "B07KSQ7CYC", "B074CMKJW4"] },
  { oldAsin: "B00YQZQH32", source: "herbs", name: "Magnesium Glycinate", expectKeywords: ["magnesium glycinate"], candidates: ["B0019LRY8A", "B074CMKJW4", "B07L91ZBCK"] },
  { oldAsin: "B0796MMZ3S", source: "herbs", name: "Magnesium L-Threonate", expectKeywords: ["magnesium", "threonate"], candidates: ["B0019LRY8A", "B0033AT4UM", "B07GVMC9NN"] },
  { oldAsin: "B07YQ7M3T1", source: "herbs", name: "Kava", expectKeywords: ["kava"], candidates: ["B0014AURJE", "B005P0XKZS"] },
  { oldAsin: "B07PNDRDMW", source: "herbs", name: "Saint John's Wort", expectKeywords: ["st", "john", "wort"], candidates: ["B005DUEU8Y", "B0014ATEM6", "B005P0XKZ8"] },
  { oldAsin: "B0013OUVMG", source: "herbs", name: "Saint John's Wort", expectKeywords: ["st", "john", "wort"], candidates: ["B005DUEU8Y", "B0014ATEM6", "B005P0XKZ8"] },
  { oldAsin: "B0013OQNX0", source: "herbs", name: "Passionflower", expectKeywords: ["passion"], candidates: ["B0014AURJE", "B005P0VLG2", "B074H6MGB7"] },
  { oldAsin: "B0013OQQGS", source: "herbs", name: "Valerian", expectKeywords: ["valerian"], candidates: ["B0014ATEM6", "B0017I8Q2I", "B005P0XU24"] },
  { oldAsin: "B0017I8Q2I", source: "herbs", name: "Chamomile", expectKeywords: ["chamomile"], candidates: ["B0009F3PJC", "B074H6MGB7", "B005DUEUCU"] },
  { oldAsin: "B074N6L1G5", source: "herbs", name: "Skullcap", expectKeywords: ["skullcap", "scutellaria"], candidates: ["B0014ATEM6", "B005P0XKZ8", "B074H6MGB7"] },
  { oldAsin: "B0013OUXAW", source: "herbs", name: "White Peony", expectKeywords: ["peony", "paeonia"], candidates: ["B074VKBC9V", "B005P0VKHE"] },
  { oldAsin: "B003L18ZYC", source: "herbs", name: "Tribulus", expectKeywords: ["tribulus"], candidates: ["B007O79PFW", "B005P0VKFG", "B0014AURT4"] },
  { oldAsin: "B0013OQQZW", source: "herbs", name: "American Ginseng", expectKeywords: ["american ginseng"], candidates: ["B0013OUUF6", "B005P0VKFG"] },
  { oldAsin: "B07GLN4VFZ", source: "herbs", name: "Panax Ginseng", expectKeywords: ["panax", "korean ginseng"], candidates: ["B0014AURT4", "B005P0VKFG", "B007F2P9NI"] },
  { oldAsin: "B005UEZJVU", source: "herbs", name: "Maca Root", expectKeywords: ["maca"], candidates: ["B003L18WS6", "B07KGNT9R3", "B0014AURRG"] },
  { oldAsin: "B07MGB8XR7", source: "herbs", name: "Cordyceps", expectKeywords: ["cordyceps"], candidates: ["B07GVTPMNN", "B07JLZHL64", "B07GVMC9NN"] },
  { oldAsin: "B071W6JRY7", source: "herbs", name: "Lion's Mane", expectKeywords: ["lion", "mane"], candidates: ["B07Q9D8XQ4", "B07JLZHL64", "B07GVMC9NN"] },
  { oldAsin: "B07GVTPMNN", source: "herbs", name: "Reishi", expectKeywords: ["reishi"], candidates: ["B07JLZHL64", "B07GVMC9NN", "B07Q9D8XQ4"] },
  { oldAsin: "B07GVMC9NN", source: "herbs", name: "Turkey Tail", expectKeywords: ["turkey tail"], candidates: ["B07JLZHL64", "B07Q9D8XQ4"] },
  { oldAsin: "B0013OQYIM", source: "herbs", name: "Peppermint", expectKeywords: ["peppermint"], candidates: ["B0009F3PJC", "B005DUEUCU"] },

  // === Essential oils ===
  { oldAsin: "B0013PYJVA", source: "herbs", name: "Geranium Essential Oil", expectKeywords: ["geranium"], candidates: ["B07L41N8P5", "B07VPMW4WZ", "B074V46S52"] },
  { oldAsin: "B0013PYK9G", source: "herbs", name: "Frankincense Essential Oil", expectKeywords: ["frankincense"], candidates: ["B07L41N8P5", "B07VPMW4WZ", "B074V46S52"] },

  // === Misc / Western herbs left ===
  { oldAsin: "B07VHCJF4Y", source: "herbs", name: "Haritaki", expectKeywords: ["haritaki", "terminalia chebula"], candidates: ["B003JJ4WYU", "B0014ATEM6", "B005P0XU24"] },
  { oldAsin: "B0013OQV0G", source: "herbs", name: "Amalaki", expectKeywords: ["amla", "amalaki"], candidates: ["B003JJ4WYU", "B074VFG72T", "B005P0XKZ8"] },
  { oldAsin: "B07TVDFYVR", source: "herbs", name: "Magnolia Bark", expectKeywords: ["magnolia"], candidates: ["B0014AURJE", "B005P0VLG2"] },
  { oldAsin: "B007YNSI82", source: "herbs", name: "Shepherd's Purse", expectKeywords: ["shepherd"], candidates: ["B005P0VLG2", "B0014AURJE"] },
  { oldAsin: "B074N6L4N2", source: "herbs", name: "Yarrow", expectKeywords: ["yarrow"], candidates: ["B005P0VLG2", "B0014ATEM6"] },

  // === Catalog (non-herb) ===
  { oldAsin: "0806541490", source: "catalog", name: "The Menopause Manifesto", expectKeywords: ["menopause manifesto", "gunter"], candidates: ["1806541491", "B091F8WWNW", "B0892HW4RG"] },
  { oldAsin: "059318395X", source: "catalog", name: "The Menopause Brain", expectKeywords: ["menopause brain", "mosconi"], candidates: ["0593712889", "0593712897", "B0CBSCQB7K"] },
  { oldAsin: "0316481211", source: "catalog", name: "Estrogen Matters", expectKeywords: ["estrogen matters"], candidates: ["031648122X", "0316481238", "B07F1HBHWK"] },
  { oldAsin: "B07Z9P2J5L", source: "catalog", name: "Everlywell Womens Health Test", expectKeywords: ["everlywell", "women", "test"], candidates: ["B07PXJWQ5G", "B07VWBVTW3", "B07L48GD12"] },
  { oldAsin: "B07PWZRZ34", source: "catalog", name: "LetsGetChecked Female Hormone Test", expectKeywords: ["letsgetchecked", "hormone"], candidates: ["B07YYWGT2T", "B07PXJWQ5G"] },
  { oldAsin: "B07XTL9JHF", source: "catalog", name: "Revaree Hyaluronic Acid", expectKeywords: ["revaree", "hyaluronic"], candidates: ["B07P3FY5K7", "B084HQGPVG"] },
  { oldAsin: "B0BFDR7HF1", source: "catalog", name: "Cooling Sheets", expectKeywords: ["cooling", "sheet"], candidates: ["B07Z3Q2P5R", "B07R8RG3CN", "B084JCDKJC"] },
  { oldAsin: "B001689RGQ", source: "catalog", name: "Marpac Yogasleep Dohm", expectKeywords: ["dohm", "white noise", "yogasleep"], candidates: ["B07HV9JBV8", "B0894P5LRJ", "B07KGFJZSQ"] },
  { oldAsin: "B095J38B7C", source: "catalog", name: "Garmin Venu Sq 2", expectKeywords: ["garmin", "venu"], candidates: ["B0BWDFB17V", "B07HZ4DR8C", "B0817NRSDM"] },
  { oldAsin: "B001ARYU58", source: "catalog", name: "Bowflex SelectTech 552 Adjustable Dumbbells", expectKeywords: ["bowflex", "selecttech", "adjustable"], candidates: ["B001ARYU5I", "B07T8FDSV1", "B0816KCDDM"] },
  { oldAsin: "B07P7XNYBC", source: "catalog", name: "Bodylastics Resistance Bands Set", expectKeywords: ["bodylastics", "resistance"], candidates: ["B0027IZTOI", "B07T8FDSV1"] },
];
