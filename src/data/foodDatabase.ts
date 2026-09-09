export type FoodDatabaseEntry = {
  name: string;
  aliases: string[];
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  category: string;
};

const wholeFoods: FoodDatabaseEntry[] = [
  { name: "Apple", aliases: ["red apple", "green apple"], serving: "1 medium, 182g", calories: 95, protein: 1, carbs: 25, fat: 0, category: "Fruit" },
  { name: "Banana", aliases: ["ripe banana"], serving: "1 medium, 118g", calories: 105, protein: 1, carbs: 27, fat: 0, category: "Fruit" },
  { name: "Orange", aliases: ["navel orange"], serving: "1 medium, 131g", calories: 62, protein: 1, carbs: 15, fat: 0, category: "Fruit" },
  { name: "Strawberries", aliases: ["strawberry"], serving: "1 cup halves, 152g", calories: 49, protein: 1, carbs: 12, fat: 0, category: "Fruit" },
  { name: "Blueberries", aliases: ["blueberry"], serving: "1 cup, 148g", calories: 84, protein: 1, carbs: 21, fat: 0, category: "Fruit" },
  { name: "Grapes", aliases: ["green grapes", "red grapes"], serving: "1 cup, 151g", calories: 104, protein: 1, carbs: 27, fat: 0, category: "Fruit" },
  { name: "Avocado", aliases: ["avocado half"], serving: "1/2 fruit, 100g", calories: 160, protein: 2, carbs: 9, fat: 15, category: "Fruit" },
  { name: "Broccoli", aliases: ["steamed broccoli"], serving: "1 cup cooked, 156g", calories: 55, protein: 4, carbs: 11, fat: 1, category: "Vegetable" },
  { name: "Spinach", aliases: ["raw spinach"], serving: "2 cups raw, 60g", calories: 14, protein: 2, carbs: 2, fat: 0, category: "Vegetable" },
  { name: "Carrots", aliases: ["carrot sticks"], serving: "1 cup, 128g", calories: 52, protein: 1, carbs: 12, fat: 0, category: "Vegetable" },
  { name: "Tomato", aliases: ["tomatoes"], serving: "1 medium, 123g", calories: 22, protein: 1, carbs: 5, fat: 0, category: "Vegetable" },
  { name: "Cucumber", aliases: ["cucumbers"], serving: "1 cup slices, 104g", calories: 16, protein: 1, carbs: 4, fat: 0, category: "Vegetable" },
  { name: "Sweet potato", aliases: ["baked sweet potato"], serving: "1 medium, 130g", calories: 112, protein: 2, carbs: 26, fat: 0, category: "Vegetable" },
  { name: "Potato", aliases: ["baked potato"], serving: "1 medium, 173g", calories: 161, protein: 4, carbs: 37, fat: 0, category: "Vegetable" },
  { name: "White rice", aliases: ["cooked rice", "steamed rice"], serving: "1 cup cooked, 158g", calories: 205, protein: 4, carbs: 45, fat: 0, category: "Grain" },
  { name: "Brown rice", aliases: ["cooked brown rice"], serving: "1 cup cooked, 195g", calories: 216, protein: 5, carbs: 45, fat: 2, category: "Grain" },
  { name: "Quinoa", aliases: ["cooked quinoa"], serving: "1 cup cooked, 185g", calories: 222, protein: 8, carbs: 39, fat: 4, category: "Grain" },
  { name: "Oatmeal", aliases: ["oats", "cooked oats", "porridge"], serving: "1 cup cooked, 234g", calories: 158, protein: 6, carbs: 27, fat: 3, category: "Grain" },
  { name: "Whole wheat bread", aliases: ["whole grain bread"], serving: "1 slice, 43g", calories: 110, protein: 5, carbs: 20, fat: 2, category: "Grain" },
  { name: "White toast", aliases: ["toast", "white bread"], serving: "1 slice, 28g", calories: 75, protein: 2, carbs: 14, fat: 1, category: "Grain" },
  { name: "All-purpose flour", aliases: ["flour", "plain flour", "white flour"], serving: "100g", calories: 364, protein: 10, carbs: 76, fat: 1, category: "Grain" },
  { name: "Bagel", aliases: ["plain bagel"], serving: "1 medium, 105g", calories: 270, protein: 10, carbs: 53, fat: 2, category: "Grain" },
  { name: "Pita bread", aliases: ["pita"], serving: "1 medium, 60g", calories: 165, protein: 6, carbs: 33, fat: 1, category: "Grain" },
  { name: "Tortilla", aliases: ["flour tortilla", "wrap"], serving: "1 medium, 49g", calories: 140, protein: 4, carbs: 24, fat: 4, category: "Grain" },
  { name: "Pasta", aliases: ["cooked pasta", "spaghetti"], serving: "1 cup cooked, 140g", calories: 220, protein: 8, carbs: 43, fat: 1, category: "Grain" },
  { name: "Chicken breast", aliases: ["grilled chicken", "chicken fillet"], serving: "100g cooked", calories: 165, protein: 31, carbs: 0, fat: 4, category: "Protein" },
  { name: "Chicken thigh", aliases: ["boneless chicken thigh"], serving: "100g cooked", calories: 209, protein: 26, carbs: 0, fat: 11, category: "Protein" },
  { name: "Turkey breast", aliases: ["sliced turkey", "turkey slices"], serving: "100g cooked", calories: 135, protein: 30, carbs: 0, fat: 1, category: "Protein" },
  { name: "Lean ground beef", aliases: ["ground beef 90/10"], serving: "100g cooked", calories: 217, protein: 26, carbs: 0, fat: 12, category: "Protein" },
  { name: "Beef steak", aliases: ["sirloin steak"], serving: "100g cooked", calories: 250, protein: 26, carbs: 0, fat: 15, category: "Protein" },
  { name: "Pork chop", aliases: ["pork loin"], serving: "100g cooked", calories: 231, protein: 26, carbs: 0, fat: 14, category: "Protein" },
  { name: "Salmon", aliases: ["grilled salmon", "salmon fillet"], serving: "100g cooked", calories: 206, protein: 22, carbs: 0, fat: 12, category: "Protein" },
  { name: "Tuna", aliases: ["canned tuna in water"], serving: "100g drained", calories: 116, protein: 26, carbs: 0, fat: 1, category: "Protein" },
  { name: "Shrimp", aliases: ["prawns"], serving: "100g cooked", calories: 99, protein: 24, carbs: 0, fat: 0, category: "Protein" },
  { name: "Egg", aliases: ["large egg", "boiled egg", "fried egg"], serving: "1 large, 50g", calories: 72, protein: 6, carbs: 0, fat: 5, category: "Protein" },
  { name: "Scrambled eggs", aliases: ["scrambled egg"], serving: "2 large eggs", calories: 182, protein: 13, carbs: 2, fat: 14, category: "Protein" },
  { name: "Tofu", aliases: ["firm tofu"], serving: "100g", calories: 144, protein: 17, carbs: 3, fat: 9, category: "Protein" },
  { name: "Tempeh", aliases: ["soy tempeh"], serving: "100g", calories: 193, protein: 20, carbs: 8, fat: 11, category: "Protein" },
  { name: "Black beans", aliases: ["cooked black beans"], serving: "1 cup cooked, 172g", calories: 227, protein: 15, carbs: 41, fat: 1, category: "Legume" },
  { name: "Chickpeas", aliases: ["garbanzo beans"], serving: "1 cup cooked, 164g", calories: 269, protein: 15, carbs: 45, fat: 4, category: "Legume" },
  { name: "Lentils", aliases: ["cooked lentils"], serving: "1 cup cooked, 198g", calories: 230, protein: 18, carbs: 40, fat: 1, category: "Legume" },
  { name: "Greek yogurt", aliases: ["plain greek yogurt"], serving: "170g", calories: 100, protein: 17, carbs: 6, fat: 0, category: "Dairy" },
  { name: "Whole milk", aliases: ["milk"], serving: "100g", calories: 61, protein: 3, carbs: 5, fat: 3, category: "Dairy" },
  { name: "Skim milk", aliases: ["fat free milk"], serving: "100g", calories: 34, protein: 3, carbs: 5, fat: 0, category: "Dairy" },
  { name: "Cottage cheese", aliases: ["low fat cottage cheese"], serving: "1 cup, 226g", calories: 180, protein: 24, carbs: 10, fat: 5, category: "Dairy" },
  { name: "Cheddar cheese", aliases: ["cheese slice"], serving: "1 oz, 28g", calories: 113, protein: 7, carbs: 1, fat: 9, category: "Dairy" },
  { name: "Mozzarella", aliases: ["mozzarella cheese"], serving: "1 oz, 28g", calories: 85, protein: 6, carbs: 1, fat: 6, category: "Dairy" },
  { name: "Butter", aliases: ["butter pat"], serving: "1 tbsp, 14g", calories: 102, protein: 0, carbs: 0, fat: 12, category: "Fat" },
  { name: "Olive oil", aliases: ["oil", "extra virgin olive oil"], serving: "1 tbsp, 14g", calories: 119, protein: 0, carbs: 0, fat: 14, category: "Fat" },
  { name: "Peanut butter", aliases: ["pb"], serving: "2 tbsp, 32g", calories: 190, protein: 7, carbs: 7, fat: 16, category: "Fat" },
  { name: "Almonds", aliases: ["almond"], serving: "1 oz, 28g", calories: 164, protein: 6, carbs: 6, fat: 14, category: "Nuts" },
  { name: "Walnuts", aliases: ["walnut"], serving: "1 oz, 28g", calories: 185, protein: 4, carbs: 4, fat: 18, category: "Nuts" },
  { name: "Cashews", aliases: ["cashew"], serving: "1 oz, 28g", calories: 157, protein: 5, carbs: 9, fat: 12, category: "Nuts" },
  { name: "Hummus", aliases: ["houmous"], serving: "2 tbsp, 30g", calories: 70, protein: 2, carbs: 4, fat: 5, category: "Dip" },
];

const preparedMeals: FoodDatabaseEntry[] = [
  { name: "Chicken rice bowl", aliases: ["chicken and rice", "chicken rice"], serving: "1 bowl", calories: 560, protein: 38, carbs: 62, fat: 16, category: "Prepared meal" },
  { name: "Chicken salad", aliases: ["grilled chicken salad"], serving: "1 large salad", calories: 420, protein: 35, carbs: 18, fat: 24, category: "Prepared meal" },
  { name: "Caesar salad with chicken", aliases: ["chicken caesar salad"], serving: "1 entree salad", calories: 650, protein: 42, carbs: 24, fat: 44, category: "Prepared meal" },
  { name: "Tuna salad sandwich", aliases: ["tuna sandwich"], serving: "1 sandwich", calories: 430, protein: 25, carbs: 38, fat: 20, category: "Prepared meal" },
  { name: "Turkey sandwich", aliases: ["turkey sub"], serving: "1 sandwich", calories: 420, protein: 28, carbs: 45, fat: 14, category: "Prepared meal" },
  { name: "Grilled cheese sandwich", aliases: ["grilled cheese"], serving: "1 sandwich", calories: 400, protein: 14, carbs: 32, fat: 24, category: "Prepared meal" },
  { name: "Cheeseburger", aliases: ["burger with cheese"], serving: "1 burger", calories: 535, protein: 30, carbs: 40, fat: 30, category: "Fast food" },
  { name: "Hamburger", aliases: ["plain burger"], serving: "1 burger", calories: 390, protein: 22, carbs: 36, fat: 18, category: "Fast food" },
  { name: "French fries", aliases: ["fries"], serving: "medium order", calories: 365, protein: 4, carbs: 48, fat: 17, category: "Fast food" },
  { name: "Chicken nuggets", aliases: ["nuggets"], serving: "6 pieces", calories: 270, protein: 15, carbs: 16, fat: 17, category: "Fast food" },
  { name: "Pepperoni pizza", aliases: ["pizza slice"], serving: "1 slice, 107g", calories: 313, protein: 13, carbs: 35, fat: 13, category: "Fast food" },
  { name: "Cheese pizza", aliases: ["plain pizza"], serving: "1 slice, 107g", calories: 285, protein: 12, carbs: 36, fat: 10, category: "Fast food" },
  { name: "Hot dog", aliases: ["hotdog"], serving: "1 hot dog with bun", calories: 290, protein: 10, carbs: 25, fat: 17, category: "Fast food" },
  { name: "Fried chicken", aliases: ["chicken drumstick fried"], serving: "1 piece", calories: 320, protein: 22, carbs: 10, fat: 21, category: "Fast food" },
  { name: "Burrito", aliases: ["bean and cheese burrito"], serving: "1 medium burrito", calories: 580, protein: 23, carbs: 72, fat: 22, category: "Mexican" },
  { name: "Chicken burrito bowl", aliases: ["burrito bowl"], serving: "1 bowl", calories: 700, protein: 45, carbs: 78, fat: 23, category: "Mexican" },
  { name: "Chicken taco", aliases: ["soft chicken taco"], serving: "1 taco", calories: 190, protein: 12, carbs: 19, fat: 8, category: "Mexican" },
  { name: "Beef taco", aliases: ["ground beef taco"], serving: "1 taco", calories: 210, protein: 11, carbs: 18, fat: 11, category: "Mexican" },
  { name: "Quesadilla", aliases: ["cheese quesadilla"], serving: "1 medium", calories: 520, protein: 22, carbs: 40, fat: 30, category: "Mexican" },
  { name: "Sushi roll", aliases: ["california roll"], serving: "8 pieces", calories: 255, protein: 9, carbs: 38, fat: 7, category: "Japanese" },
  { name: "Salmon sushi", aliases: ["salmon nigiri"], serving: "2 pieces", calories: 120, protein: 8, carbs: 14, fat: 3, category: "Japanese" },
  { name: "Chicken teriyaki", aliases: ["teriyaki chicken rice"], serving: "1 plate", calories: 640, protein: 42, carbs: 76, fat: 18, category: "Japanese" },
  { name: "Ramen", aliases: ["ramen bowl", "tonkotsu ramen"], serving: "1 bowl", calories: 600, protein: 25, carbs: 70, fat: 24, category: "Japanese" },
  { name: "Pho", aliases: ["beef pho"], serving: "1 bowl", calories: 450, protein: 28, carbs: 62, fat: 10, category: "Vietnamese" },
  { name: "Pad thai", aliases: ["chicken pad thai"], serving: "1 plate", calories: 760, protein: 32, carbs: 94, fat: 28, category: "Thai" },
  { name: "Green curry with rice", aliases: ["thai green curry"], serving: "1 plate", calories: 690, protein: 28, carbs: 76, fat: 30, category: "Thai" },
  { name: "Chicken tikka masala", aliases: ["tikka masala"], serving: "1 cup curry", calories: 430, protein: 28, carbs: 18, fat: 28, category: "Indian" },
  { name: "Butter chicken", aliases: ["murgh makhani"], serving: "1 cup curry", calories: 485, protein: 29, carbs: 15, fat: 35, category: "Indian" },
  { name: "Chana masala", aliases: ["chickpea curry"], serving: "1 cup", calories: 290, protein: 12, carbs: 45, fat: 8, category: "Indian" },
  { name: "Naan", aliases: ["naan bread"], serving: "1 piece", calories: 260, protein: 8, carbs: 42, fat: 7, category: "Indian" },
  { name: "Falafel pita", aliases: ["falafel sandwich"], serving: "1 pita", calories: 560, protein: 18, carbs: 70, fat: 24, category: "Middle Eastern" },
  { name: "Falafel balls", aliases: ["falafel"], serving: "4 pieces", calories: 230, protein: 8, carbs: 24, fat: 12, category: "Middle Eastern" },
  { name: "Shawarma pita", aliases: ["chicken shawarma"], serving: "1 pita", calories: 650, protein: 38, carbs: 58, fat: 30, category: "Middle Eastern" },
  { name: "Sabich", aliases: ["sabich pita"], serving: "1 pita", calories: 620, protein: 18, carbs: 68, fat: 32, category: "Middle Eastern" },
  { name: "Shakshuka", aliases: ["eggs in tomato sauce"], serving: "1 pan serving", calories: 340, protein: 18, carbs: 18, fat: 22, category: "Middle Eastern" },
  { name: "Greek salad", aliases: ["feta salad"], serving: "1 entree salad", calories: 380, protein: 12, carbs: 18, fat: 29, category: "Mediterranean" },
  { name: "Pasta bolognese", aliases: ["spaghetti bolognese"], serving: "1 plate", calories: 650, protein: 31, carbs: 78, fat: 22, category: "Italian" },
  { name: "Pasta alfredo", aliases: ["fettuccine alfredo"], serving: "1 plate", calories: 820, protein: 24, carbs: 84, fat: 42, category: "Italian" },
  { name: "Lasagna", aliases: ["meat lasagna"], serving: "1 piece", calories: 420, protein: 25, carbs: 35, fat: 21, category: "Italian" },
  { name: "Fried rice", aliases: ["chicken fried rice"], serving: "1 plate", calories: 650, protein: 24, carbs: 86, fat: 22, category: "Chinese" },
  { name: "Orange chicken", aliases: ["orange chicken with rice"], serving: "1 entree", calories: 760, protein: 34, carbs: 86, fat: 30, category: "Chinese" },
  { name: "Beef and broccoli", aliases: ["beef broccoli"], serving: "1 entree", calories: 430, protein: 32, carbs: 28, fat: 22, category: "Chinese" },
  { name: "Dumplings", aliases: ["potstickers", "gyoza"], serving: "6 pieces", calories: 330, protein: 14, carbs: 42, fat: 12, category: "Chinese" },
  { name: "Bibimbap", aliases: ["korean rice bowl"], serving: "1 bowl", calories: 620, protein: 28, carbs: 82, fat: 20, category: "Korean" },
  { name: "Chicken soup", aliases: ["homemade chicken soup"], serving: "1 bowl", calories: 180, protein: 16, carbs: 14, fat: 7, category: "Soup" },
  { name: "Tomato soup", aliases: ["tomato bisque"], serving: "1 bowl", calories: 220, protein: 5, carbs: 28, fat: 10, category: "Soup" },
  { name: "Minestrone soup", aliases: ["vegetable bean soup"], serving: "1 bowl", calories: 200, protein: 9, carbs: 32, fat: 5, category: "Soup" },
];

const snacksAndDrinks: FoodDatabaseEntry[] = [
  { name: "Protein bar", aliases: ["quest bar", "protein snack bar"], serving: "1 bar", calories: 200, protein: 20, carbs: 22, fat: 7, category: "Snack" },
  { name: "Granola bar", aliases: ["cereal bar"], serving: "1 bar", calories: 140, protein: 3, carbs: 24, fat: 4, category: "Snack" },
  { name: "Potato chips", aliases: ["chips", "crisps"], serving: "1 oz, 28g", calories: 152, protein: 2, carbs: 15, fat: 10, category: "Snack" },
  { name: "Tortilla chips", aliases: ["nacho chips"], serving: "1 oz, 28g", calories: 140, protein: 2, carbs: 19, fat: 7, category: "Snack" },
  { name: "Pretzels", aliases: ["pretzel twists"], serving: "1 oz, 28g", calories: 110, protein: 3, carbs: 23, fat: 1, category: "Snack" },
  { name: "Popcorn", aliases: ["air popped popcorn"], serving: "3 cups", calories: 93, protein: 3, carbs: 19, fat: 1, category: "Snack" },
  { name: "Trail mix", aliases: ["nuts and raisins"], serving: "1/4 cup, 40g", calories: 180, protein: 5, carbs: 18, fat: 11, category: "Snack" },
  { name: "Dark chocolate", aliases: ["chocolate"], serving: "1 oz, 28g", calories: 170, protein: 2, carbs: 13, fat: 12, category: "Snack" },
  { name: "Milk chocolate", aliases: ["chocolate bar"], serving: "1 oz, 28g", calories: 150, protein: 2, carbs: 17, fat: 9, category: "Snack" },
  { name: "Cookies", aliases: ["chocolate chip cookies"], serving: "2 medium cookies", calories: 160, protein: 2, carbs: 22, fat: 8, category: "Snack" },
  { name: "Ice cream", aliases: ["vanilla ice cream"], serving: "1/2 cup, 66g", calories: 137, protein: 2, carbs: 16, fat: 7, category: "Dessert" },
  { name: "Brownie", aliases: ["chocolate brownie"], serving: "1 square", calories: 240, protein: 3, carbs: 34, fat: 11, category: "Dessert" },
  { name: "Croissant", aliases: ["butter croissant"], serving: "1 medium", calories: 272, protein: 5, carbs: 31, fat: 14, category: "Bakery" },
  { name: "Muffin", aliases: ["blueberry muffin"], serving: "1 medium", calories: 385, protein: 6, carbs: 56, fat: 15, category: "Bakery" },
  { name: "Pancakes", aliases: ["plain pancakes"], serving: "2 medium", calories: 350, protein: 8, carbs: 56, fat: 10, category: "Breakfast" },
  { name: "Waffles", aliases: ["waffle"], serving: "2 small", calories: 310, protein: 8, carbs: 44, fat: 11, category: "Breakfast" },
  { name: "Cereal with milk", aliases: ["breakfast cereal"], serving: "1 bowl", calories: 250, protein: 9, carbs: 47, fat: 3, category: "Breakfast" },
  { name: "Smoothie", aliases: ["fruit smoothie"], serving: "16 oz", calories: 300, protein: 8, carbs: 58, fat: 4, category: "Beverage" },
  { name: "Protein shake", aliases: ["whey shake"], serving: "1 scoop with water", calories: 120, protein: 24, carbs: 3, fat: 2, category: "Beverage" },
  { name: "Latte", aliases: ["cafe latte"], serving: "12 oz", calories: 150, protein: 9, carbs: 14, fat: 6, category: "Beverage" },
  { name: "Cappuccino", aliases: ["coffee cappuccino"], serving: "8 oz", calories: 80, protein: 5, carbs: 8, fat: 3, category: "Beverage" },
  { name: "Black coffee", aliases: ["coffee", "americano"], serving: "1 cup", calories: 2, protein: 0, carbs: 0, fat: 0, category: "Beverage" },
  { name: "Orange juice", aliases: ["oj"], serving: "1 cup, 248ml", calories: 112, protein: 2, carbs: 26, fat: 0, category: "Beverage" },
  { name: "Apple juice", aliases: ["juice"], serving: "1 cup, 248ml", calories: 114, protein: 0, carbs: 28, fat: 0, category: "Beverage" },
  { name: "Cola", aliases: ["coke", "soda"], serving: "12 oz can", calories: 140, protein: 0, carbs: 39, fat: 0, category: "Beverage" },
  { name: "Diet soda", aliases: ["diet coke"], serving: "12 oz can", calories: 0, protein: 0, carbs: 0, fat: 0, category: "Beverage" },
  { name: "Beer", aliases: ["lager"], serving: "12 oz", calories: 153, protein: 2, carbs: 13, fat: 0, category: "Alcohol" },
  { name: "Wine", aliases: ["red wine", "white wine"], serving: "5 oz", calories: 125, protein: 0, carbs: 4, fat: 0, category: "Alcohol" },
  { name: "Margarita", aliases: ["cocktail margarita"], serving: "1 cocktail", calories: 250, protein: 0, carbs: 30, fat: 0, category: "Alcohol" },
];

export const foodDatabase: FoodDatabaseEntry[] = [...wholeFoods, ...preparedMeals, ...snacksAndDrinks];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchTerms(entry: FoodDatabaseEntry) {
  return [entry.name, ...entry.aliases, entry.category].map(normalizeText);
}

export function findFoodDatabaseMatches(query: string, maxMatches = 30) {
  const normalizedQuery = normalizeText(query);
  const queryTokens = new Set(normalizedQuery.split(" ").filter((token) => token.length > 2));

  if (!normalizedQuery || queryTokens.size === 0) {
    return [];
  }

  return foodDatabase
    .map((entry) => {
      const terms = getSearchTerms(entry);
      const termTokens = new Set(terms.flatMap((term) => term.split(" ").filter((token) => token.length > 2)));
      const phraseScore = terms.some((term) => normalizedQuery.includes(term) || term.includes(normalizedQuery)) ? 8 : 0;
      const tokenScore = [...termTokens].reduce((score, token) => score + (queryTokens.has(token) ? 2 : 0), 0);
      const partialScore = [...queryTokens].reduce(
        (score, token) => score + (terms.some((term) => term.includes(token)) ? 1 : 0),
        0,
      );

      return { entry, score: phraseScore + tokenScore + partialScore };
    })
    .filter((match) => match.score > 0)
    .sort((first, second) => second.score - first.score || first.entry.name.localeCompare(second.entry.name))
    .slice(0, maxMatches)
    .map((match) => match.entry);
}

export function formatFoodDatabaseReference(entries: FoodDatabaseEntry[]) {
  if (entries.length === 0) {
    return "No strong local database matches found.";
  }

  return entries
    .map(
      (entry) =>
        `- ${entry.name} (${entry.serving}): ${entry.calories} kcal, protein ${entry.protein}g, carbs ${entry.carbs}g, fat ${entry.fat}g`,
    )
    .join("\n");
}
