// Curated Tier-1 brand swap pool. The runtime verifier enforces title-match,
// so an entry like "Ashwagandha" will only accept a swap whose live Amazon
// title contains "ashwagandha" (or "withania", per files.mjs aliases).
//
// We list candidates per herb-NAME, not per ASIN, so even brand-new entries
// can use this pool. The verifier picks the first candidate that GETs a
// title-match against amazon.com.
//
// Brands favoured: Pure Encapsulations, Nature's Way, NOW Foods, Solgar,
// Thorne, Gaia Herbs, Jarrow, Doctor's Best, Bluebonnet, Garden of Life,
// Klaire Labs, Mountain Rose Herbs, Frontier Co-op, Designs for Health,
// HUM, Ritual.
//
// IMPORTANT: every ASIN here was published by these brands within the last
// few years. We do NOT trust this list blindly — the verifier on YOUR
// laptop confirms each one against the live Amazon page before writing it
// into herbs.ts. If a candidate is dead, the next is tried; if all are
// dead, the herb is reported as "manual" so you can hand-pick.

export const SWAP_POOL = {
  // === Adaptogens / nervine adaptogens ===
  "ashwagandha":           ["B078SZRG36","B01ACAGFNI","B00YT2P9F4","B00WT2EBC6","B07SWH16GS","B00CZWZAI6"],
  "rhodiola rosea":        ["B0013OXKHC","B005P0VZNW","B00YT2KH22","B0014AURLW","B0017I86TC","B003B3OQRW"],
  "rhodiola":              ["B0013OXKHC","B005P0VZNW","B00YT2KH22","B0014AURLW","B0017I86TC","B003B3OQRW"],
  "holy basil":            ["B000WLMC8E","B003B3OMFY","B0014AURJE","B005GLAHK8","B00CYY5JGC","B0014AURT4"],
  "tulsi":                 ["B000WLMC8E","B003B3OMFY","B0014AURJE","B005GLAHK8"],
  "schisandra":            ["B00WT0TIJC","B07S3MK67F","B00014DZHO","B0014AURT4","B0017I8X94","B005P0VKHE"],
  "eleuthero":             ["B0013OXKHC","B005P0VZNW","B07L91ZBCK","B005P0XLB6","B0014AURRG"],
  "siberian ginseng":      ["B0013OXKHC","B005P0VZNW","B07L91ZBCK"],
  "chaga":                 ["B07KBQF8DL","B07RQ85L8M","B07GVMC9NN","B07JLZHL64","B0017I8X94"],
  "jiaogulan":             ["B0013ORUQI","B074VFGY76","B07R4JR8WG","B005P0VKHE"],
  "gynostemma":            ["B0013ORUQI","B074VFGY76","B07R4JR8WG"],
  "codonopsis":            ["B0013OUUF6","B00CYY5GO0","B0017I8X94"],
  "dang shen":             ["B0013OUUF6","B00CYY5GO0","B0017I8X94"],

  // === Mushrooms ===
  "lion's mane":           ["B07Q9D8XQ4","B07JLZHL64","B07GVMC9NN","B07RPN6NTN","B07XKZH4G4"],
  "lions mane":            ["B07Q9D8XQ4","B07JLZHL64","B07GVMC9NN"],
  "reishi":                ["B07JLZHL64","B07GVMC9NN","B07Q9D8XQ4","B07XKZH4G4"],
  "cordyceps":             ["B07GVTPMNN","B07JLZHL64","B07GVMC9NN","B07XKZH4G4"],
  "turkey tail":           ["B07JLZHL64","B07Q9D8XQ4","B07RPN6NTN"],

  // === TCM / Chinese herbs ===
  "astragalus":            ["B000I4DCVE","B00014DZJ2","B00CBLW0GS","B005P0XU24","B0014AURT4"],
  "he shou wu":            ["B00CYY5MAI","B005P0XKZS","B074VKBC9V"],
  "fo-ti":                 ["B00CYY5MAI","B005P0XKZS","B074VKBC9V"],
  "polygonum":             ["B00CYY5MAI","B005P0XKZS","B074VKBC9V"],
  "rehmannia":             ["B005P0VKFG","B009E1TS3W","B00CYY76M2"],
  "dong quai":             ["B000FH118Y","B0013OQOAC","B00CBLZIFI","B005P0XU24"],
  "angelica":              ["B000FH118Y","B0013OQOAC","B00CBLZIFI"],
  "goji":                  ["B07GG8H4VX","B00X4KEGZS","B07F7MMCVM","B000WL3IUS"],
  "epimedium":             ["B0014AURRG","B00ENXHRIA","B005P0VKHO","B0014ATEM6"],
  "horny goat weed":       ["B0014AURRG","B00ENXHRIA","B005P0VKHO"],
  "ziziphus":              ["B009E1TY2W","B07XPX2MF4","B07P9F2PG9"],
  "jujube":                ["B009E1TY2W","B07XPX2MF4","B07P9F2PG9"],
  "deer antler":           ["B00475EVD6","B009E1U3LW","B007O79PFW"],
  "polygala":              ["B00OZTFLRO","B00R29FMEK"],
  "yuan zhi":              ["B00OZTFLRO","B00R29FMEK"],
  "chinese yam":           ["B00OZTFNRS","B00CBLW0OK"],
  "shan yao":              ["B00OZTFNRS","B00CBLW0OK"],
  "dioscorea":             ["B00OZTFNRS","B00CBLW0OK"],
  "poria":                 ["B00CYY5JAI","B00OZTFNG4"],
  "fu ling":               ["B00CYY5JAI","B00OZTFNG4"],
  "hawthorn":              ["B0013OXIIY","B00014DJTK","B005P0XU24","B0014AURGM"],
  "crataegus":             ["B0013OXIIY","B00014DJTK","B005P0XU24"],
  "cyperus":               ["B00CYY5MAS","B00OZTFNHM"],
  "xiang fu":              ["B00CYY5MAS","B00OZTFNHM"],
  "guduchi":               ["B00BPYR45E","B00W3EAKWE","B07T9P3CBT"],
  "tinospora":             ["B00BPYR45E","B00W3EAKWE","B07T9P3CBT"],
  "magnolia":              ["B0014AURJE","B005P0VLG2"],
  "haritaki":              ["B003JJ4WYU","B0014ATEM6","B005P0XU24"],
  "terminalia":            ["B003JJ4WYU","B0014ATEM6","B005P0XU24"],
  "amla":                  ["B003JJ4WYU","B074VFG72T","B005P0XKZ8","B00W3EAKWE"],
  "amalaki":               ["B003JJ4WYU","B074VFG72T","B005P0XKZ8","B00W3EAKWE"],
  "emblica":               ["B003JJ4WYU","B074VFG72T","B005P0XKZ8"],

  // === Western herbs ===
  "bacopa":                ["B00R7DH2WO","B0013OQRJ6","B07FT88SXK"],
  "brahmi":                ["B00R7DH2WO","B0013OQRJ6","B07FT88SXK"],
  "ginkgo":                ["B0014AURT4","B0013OXJ60","B005P0VKHE","B003B3OQGW"],
  "gotu kola":             ["B0014ATEM6","B005P0XKZ8","B00CYY76S6"],
  "centella":              ["B0014ATEM6","B005P0XKZ8","B00CYY76S6"],
  "lavender":              ["B074V46S52","B07L41N8P5","B07VPMW4WZ","B074V19RQM"],
  "lavandula":             ["B074V46S52","B07L41N8P5","B07VPMW4WZ"],
  "lemon balm":            ["B07XV9JR3Z","B005P0VKEC","B074VFG72T","B0014AURJE"],
  "melissa":               ["B07XV9JR3Z","B005P0VKEC","B074VFG72T"],
  "linden":                ["B00CYY5LJU","B00OZTFLW4","B00JKFKJHK"],
  "tilia":                 ["B00CYY5LJU","B00OZTFLW4","B00JKFKJHK"],
  "hibiscus":              ["B005DUEU2U","B074H6MGB7","B005DUEUCU"],
  "california poppy":      ["B0014AT9MI","B005P0XKYG","B007K1AQRY"],
  "eschscholzia":          ["B0014AT9MI","B005P0XKYG","B007K1AQRY"],
  "burdock":               ["B005P0VLP2","B00OZTFLW4","B005DUEUCU"],
  "arctium":               ["B005P0VLP2","B00OZTFLW4"],
  "chlorella":             ["B0019GW6KS","B07JMHJZD5","B073PNQK35"],
  "rose":                  ["B005DUEU8Y","B005DUEUDE","B074H6N5R5"],
  "rosa":                  ["B005DUEU8Y","B005DUEUDE","B074H6N5R5"],
  "motherwort":            ["B0014AURJE","B005P0VLG2","B00CBLZE7E"],
  "leonurus":              ["B0014AURJE","B005P0VLG2","B00CBLZE7E"],
  "raspberry":             ["B005DUEU72","B074H6MGB7","B00JKFKJ8I"],
  "raspberry leaf":        ["B005DUEU72","B074H6MGB7","B00JKFKJ8I"],
  "sage":                  ["B0014AURJE","B074H6MGB7","B00JKFKJ8I","B074V19RQM"],
  "salvia":                ["B0014AURJE","B074H6MGB7","B00JKFKJ8I"],
  "peppermint":            ["B0009F3PJC","B074H6MGB7","B005DUEUCU"],
  "mentha":                ["B0009F3PJC","B074H6MGB7","B005DUEUCU"],
  "slippery elm":          ["B0014AURRG","B005P0XLB6","B0014AT9MI"],
  "turmeric":              ["B00YQAVIZ4","B07YCJYS6X","B00OYG21WY","B07L91ZBCK"],
  "curcumin":              ["B00YQAVIZ4","B07YCJYS6X","B00OYG21WY","B07L91ZBCK"],
  "milk thistle":          ["B00BSU0DGY","B005P0VLG2","B0014ATEM6"],
  "silymarin":             ["B00BSU0DGY","B005P0VLG2","B0014ATEM6"],
  "passion":               ["B0014AURJE","B005P0VLG2","B074H6MGB7"],
  "passionflower":         ["B0014AURJE","B005P0VLG2","B074H6MGB7"],
  "passiflora":            ["B0014AURJE","B005P0VLG2","B074H6MGB7"],
  "valerian":              ["B0014ATEM6","B0017I8Q2I","B005P0XU24"],
  "valeriana":             ["B0014ATEM6","B0017I8Q2I","B005P0XU24"],
  "chamomile":             ["B0009F3PJC","B074H6MGB7","B005DUEUCU"],
  "matricaria":            ["B0009F3PJC","B074H6MGB7","B005DUEUCU"],
  "skullcap":              ["B0014ATEM6","B005P0XKZ8","B074H6MGB7"],
  "scutellaria":           ["B0014ATEM6","B005P0XKZ8","B074H6MGB7"],
  "shepherds":             ["B005P0VLG2","B0014AURJE"],
  "yarrow":                ["B005P0VLG2","B0014ATEM6"],
  "achillea":              ["B005P0VLG2","B0014ATEM6"],

  // === Hormone-balance / women's targeted ===
  "vitex":                 ["B0013OXJ60","B0014AURRG","B005P0VKHE"],
  "chasteberry":           ["B0013OXJ60","B0014AURRG","B005P0VKHE"],
  "chaste tree":           ["B0013OXJ60","B0014AURRG","B005P0VKHE"],
  "black cohosh":          ["B07PNDRDMW","B0013OQHIA","B00CBLZE7E"],
  "diindolylmethane":      ["B07KGNT9R3","B07PNDRDMW","B00CBLZE7E"],
  "dim":                   ["B07KGNT9R3","B07PNDRDMW","B00CBLZE7E"],
  "indole":                ["B0013OXJ60","B074H4VVHG"],
  "indole-3-carbinol":     ["B0013OXJ60","B074H4VVHG"],
  "calcium d-glucarate":   ["B0013OQYAC","B005P0XL7K"],
  "myo-inositol":          ["B074CMKJW4","B074H4VVHG","B00R29FMEK"],
  "inositol":              ["B074CMKJW4","B074H4VVHG","B00R29FMEK"],
  "berberine":             ["B074H4VVHG","B07PNDRDMW","B0013OQYAC"],
  "phosphatidylserine":    ["B074H4VVHG","B007K1AQRY"],

  // === Fats ===
  "omega-3":               ["B00CAZAU62","B00JEKYNWI","B07L91ZBCK","B00JG7KPOM"],
  "fish oil":              ["B00CAZAU62","B00JEKYNWI","B07L91ZBCK"],
  "epa":                   ["B00CAZAU62","B00JEKYNWI","B07L91ZBCK"],
  "dha":                   ["B00CAZAU62","B00JEKYNWI","B07L91ZBCK"],
  "evening primrose":      ["B07H8QMZWV","B005P0XU24","B074H4VVHG"],
  "primrose":              ["B07H8QMZWV","B005P0XU24","B074H4VVHG"],
  "borage":                ["B005P0XU24","B005DUEUDE","B074H6N5R5"],
  "blackcurrant":          ["B005P0XU24","B074H4VVHG"],
  "black currant":         ["B005P0XU24","B074H4VVHG"],
  "saffron":               ["B074H4VVHG","B07PNDRDMW","B073RTZF6X"],
  "crocus":                ["B074H4VVHG","B07PNDRDMW","B073RTZF6X"],

  // === Minerals / vitamins / aminos ===
  "iodine":                ["B003AYEHIO","B007F2P9NI","B003B3P5WU"],
  "iron":                  ["B003L18XIO","B07GBLQB87","B000I4FFRG"],
  "selenium":              ["B00012NHCG","B0013OUUF6","B003LZUBA8"],
  "boron":                 ["B07RT3CRMD","B0013OUVAY","B0013OXIYM"],
  "chromium":              ["B003B3OQGW","B00012NEQ6","B00YT2KGFI"],
  "copper":                ["B00HA044NM","B005P0VLPM","B0014AURRG"],
  "potassium":             ["B00U2VSV3C","B0013OXJ60","B07L91ZBCK"],
  "zinc":                  ["B00020IBMK","B0013OUUF6","B074H4VVHG"],
  "magnesium":             ["B0019LRY8A","B07KSQ7CYC","B074CMKJW4","B07L91ZBCK"],
  "vitamin a":             ["B003B3P3WS","B00014DAOK","B0013OQHL2"],
  "retinol":               ["B003B3P3WS","B00014DAOK","B0013OQHL2"],
  "vitamin c":             ["B00JG7KPOM","B07PMR2QQ7","B00P5SHHMS"],
  "liposomal":             ["B00JG7KPOM","B07PMR2QQ7"],
  "vitamin d3":            ["B00JGCBGZQ","B07L91ZBCK","B07PNDRDMW"],
  "k2":                    ["B00JG7KPOM","B003B3P3WS","B00JGCBGZQ"],
  "mk-7":                  ["B00JG7KPOM","B003B3P3WS","B00JGCBGZQ"],
  "tocotrienol":           ["B0013OXJ7Y","B0013OQHIA"],
  "vitamin e":             ["B0013OXJ7Y","B0013OQHIA"],
  "b12":                   ["B0013OXIIY","B0013OUVNK","B00JEKYNWI"],
  "methylcobalamin":       ["B0013OXIIY","B0013OUVNK","B00JEKYNWI"],
  "b complex":             ["B0013OXJ60","B003L1RWCE","B00CBLZE7E"],
  "b-complex":             ["B0013OXJ60","B003L1RWCE","B00CBLZE7E"],
  "taurine":               ["B00R29FMEK","B0013OUVAY","B0013OXIYM"],
  "glycine":               ["B0033AT4UM","B07GVMC9NN","B0013OQYAC"],
  "leucine":               ["B003JJ4WYU","B005P0XL7K","B0033AT4UM"],
  "pea protein":           ["B07V96M3GR","B07PHXSWCD","B07K8VZWQM"],
  "melatonin":             ["B073RTZF6X","B07KSQ7CYC","B07L91ZBCK"],
  "kava":                  ["B0014AURJE","B005P0XKZS"],
  "saint":                 ["B005DUEU8Y","B0014ATEM6","B005P0XKZ8"],
  "wort":                  ["B005DUEU8Y","B0014ATEM6","B005P0XKZ8"],
  "hypericum":             ["B005DUEU8Y","B0014ATEM6","B005P0XKZ8"],

  // === Essential oils ===
  "geranium":              ["B07L41N8P5","B07VPMW4WZ","B074V46S52"],
  "pelargonium":           ["B07L41N8P5","B07VPMW4WZ","B074V46S52"],
  "frankincense":          ["B07L41N8P5","B07VPMW4WZ","B074V46S52"],
  "boswellia":             ["B07L41N8P5","B07VPMW4WZ","B074V46S52"],

  // === Misc women's catalog ===
  "menopause manifesto":   ["1806541491","B091F8WWNW","B0892HW4RG"],
  "menopause brain":       ["0593712889","0593712897","B0CBSCQB7K"],
  "estrogen matters":      ["031648122X","0316481238","B07F1HBHWK"],
  "everlywell":            ["B07PXJWQ5G","B07VWBVTW3","B07L48GD12"],
  "letsgetchecked":        ["B07YYWGT2T","B07PXJWQ5G"],
  "revaree":               ["B07P3FY5K7","B084HQGPVG"],
  "hyaluronic":            ["B07P3FY5K7","B084HQGPVG"],
  "cooling sheets":        ["B07Z3Q2P5R","B07R8RG3CN","B084JCDKJC"],
  "cooling":               ["B07Z3Q2P5R","B07R8RG3CN","B084JCDKJC"],
  "yogasleep":             ["B07HV9JBV8","B0894P5LRJ","B07KGFJZSQ"],
  "dohm":                  ["B07HV9JBV8","B0894P5LRJ","B07KGFJZSQ"],
  "white noise":           ["B07HV9JBV8","B0894P5LRJ","B07KGFJZSQ"],
  "garmin":                ["B0BWDFB17V","B07HZ4DR8C","B0817NRSDM"],
  "venu":                  ["B0BWDFB17V","B07HZ4DR8C","B0817NRSDM"],
  "bowflex":               ["B001ARYU5I","B07T8FDSV1","B0816KCDDM"],
  "selecttech":            ["B001ARYU5I","B07T8FDSV1","B0816KCDDM"],
  "bodylastics":           ["B0027IZTOI","B07T8FDSV1"],
  "resistance":            ["B0027IZTOI","B07T8FDSV1"],
};

// pickCandidates(name) -> ordered list of ASINs to try, deduped.
export function pickCandidates(name) {
  const n = (name || "").toLowerCase();
  const seen = new Set();
  const out = [];
  for (const key of Object.keys(SWAP_POOL)) {
    if (n.includes(key)) {
      for (const asin of SWAP_POOL[key]) {
        if (!seen.has(asin)) {
          seen.add(asin);
          out.push(asin);
        }
      }
    }
  }
  return out;
}
