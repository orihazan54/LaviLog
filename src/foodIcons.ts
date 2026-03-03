const FOOD_EMOJI_MAP: Record<string, string> = {
  // Fruits
  'תפוח': '🍎', 'אגס': '🍐', 'בננה': '🍌', 'ענבים': '🍇',
  'תפוז': '🍊', 'לימון': '🍋', 'אבטיח': '🍉', 'תות': '🍓',
  'דובדבן': '🍒', 'אפרסק': '🍑', 'מנגו': '🥭', 'אננס': '🍍',
  'קיווי': '🥝', 'אבוקדו': '🥑', 'שזיף': '🫐',

  // Vegetables
  'בטטה': '🍠', 'גזר': '🥕', 'תירס': '🌽', 'ברוקולי': '🥦',
  'מלפפון': '🥒', 'עגבניה': '🍅', 'חציל': '🍆', 'פלפל': '🫑',
  'בצל': '🧅', 'שום': '🧄', 'תפוח אדמה': '🥔', 'פטריות': '🍄',
  'חסה': '🥬', 'אפונה': '🫛', 'דלעת': '🎃',

  // Grains & bread
  'אורז': '🍚', 'לחם': '🍞', 'פסטה': '🍝', 'דגנים': '🥣',
  'שיבולת שועל': '🥣', 'קוסקוס': '🍚', 'פיתה': '🫓',
  'קמח': '🌾', 'חיטה': '🌾',

  // Protein
  'ביצה': '🥚', 'ביצים': '🥚', 'עוף': '🍗', 'בשר': '🥩',
  'דג': '🐟', 'דגים': '🐟', 'סלמון': '🐟', 'טונה': '🐟',
  'טופו': '🧈', 'חומוס': '🫘', 'עדשים': '🫘',

  // Dairy
  'חלב': '🥛', 'גבינה': '🧀', 'יוגורט': '🥛', 'שמנת': '🥛',
  'קוטג': '🧀', 'חמאה': '🧈',

  // Nuts & allergens
  'בוטנים': '🥜', 'שקדים': '🌰', 'אגוזים': '🌰', 'שומשום': '🫘',
  'טחינה': '🫘', 'סויה': '🫘',

  // Other
  'מרק': '🍲', 'מחית': '🥣', 'פירה': '🥣', 'ממרח': '🫙',
  'רוטב': '🫙', 'שמן': '🫒', 'מים': '💧', 'מיץ': '🧃',
  'עוגה': '🍰', 'ביסקוויט': '🍪', 'במבה': '🥜',
};

const DEFAULT_EMOJI = '🍽️';

export function getFoodEmoji(name: string): string {
  const lower = name.trim().toLowerCase();

  if (FOOD_EMOJI_MAP[lower]) return FOOD_EMOJI_MAP[lower];

  for (const [key, emoji] of Object.entries(FOOD_EMOJI_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return emoji;
  }

  return DEFAULT_EMOJI;
}

const COMMON_ALLERGENS = [
  'חלב', 'ביצה', 'ביצים', 'בוטנים', 'אגוזים', 'שקדים',
  'חיטה', 'קמח', 'סויה', 'דג', 'דגים', 'סלמון', 'טונה',
  'שומשום', 'טחינה', 'גלוטן', 'במבה',
];

export function isCommonAllergen(name: string): boolean {
  const lower = name.trim().toLowerCase();
  return COMMON_ALLERGENS.some((a) => lower.includes(a) || a.includes(lower));
}
