/**
 * ReviewGuard AI - Product & Category Knowledge Base
 * Maintains verified product catalogue, category taxonomy, and cross-relevance detection.
 * Categories: Electronics, Fashion, Beauty, Home/Kitchen, Grocery, Books, Sports, Other.
 */

const VALID_CATEGORIES = [
  "Electronics",
  "Fashion",
  "Beauty",
  "Home/Kitchen",
  "Grocery",
  "Books",
  "Sports",
  "Other"
];

// Seed catalogue of verified products
const INITIAL_PRODUCTS = [
  {
    product_id: "PROD-ELEC-001",
    name: "Sony WH-1000XM5 Wireless Headphones",
    category: "Electronics",
    keywords: ["headphone", "audio", "noise cancelling", "anc", "sound", "bass", "bluetooth", "battery", "earcups"],
    verified: true
  },
  {
    product_id: "PROD-ELEC-002",
    name: "Apple iPhone 15 Pro",
    category: "Electronics",
    keywords: ["phone", "screen", "camera", "display", "battery", "ios", "charging", "processor", "titanium"],
    verified: true
  },
  {
    product_id: "PROD-ELEC-003",
    name: "Samsung Galaxy Watch 6",
    category: "Electronics",
    keywords: ["smartwatch", "heart rate", "sleep", "tracking", "fitness", "display", "battery", "wrist"],
    verified: true
  },
  {
    product_id: "PROD-FASH-001",
    name: "Levi's 511 Slim Fit Jeans",
    category: "Fashion",
    keywords: ["jeans", "denim", "fit", "waist", "fabric", "stitching", "stretch", "pants", "cotton"],
    verified: true
  },
  {
    product_id: "PROD-FASH-002",
    name: "Nike Dri-FIT Running T-Shirt",
    category: "Fashion",
    keywords: ["shirt", "t-shirt", "fabric", "breathable", "sizing", "wash", "sweat", "collar", "seams"],
    verified: true
  },
  {
    product_id: "PROD-BEAU-001",
    name: "CeraVe Hydrating Facial Cleanser",
    category: "Beauty",
    keywords: ["skin", "cleanser", "moisturizer", "fragrance", "dermatologist", "sensitive", "face wash", "pores"],
    verified: true
  },
  {
    product_id: "PROD-BEAU-002",
    name: "L'Oreal Paris Revitalift 1.5% Hyaluronic Acid Serum",
    category: "Beauty",
    keywords: ["serum", "skin", "wrinkle", "hydration", "dropper", "glow", "skincare", "absorption"],
    verified: true
  },
  {
    product_id: "PROD-HOME-001",
    name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker",
    category: "Home/Kitchen",
    keywords: ["cooker", "lid", "pressure", "pot", "cooking", "kitchen", "steamer", "recipe", "stainless steel"],
    verified: true
  },
  {
    product_id: "PROD-HOME-002",
    name: "Ninja Air Fryer Pro 4-in-1",
    category: "Home/Kitchen",
    keywords: ["crispy", "air fryer", "basket", "cooking", "reheat", "oil", "food", "kitchen", "clean"],
    verified: true
  },
  {
    product_id: "PROD-GROC-001",
    name: "Organic Extra Virgin Olive Oil 1L",
    category: "Grocery",
    keywords: ["oil", "olive", "flavor", "taste", "cooking", "dressing", "bottle", "organic", "aroma"],
    verified: true
  },
  {
    product_id: "PROD-GROC-002",
    name: "Blue Mountain Whole Bean Coffee 500g",
    category: "Grocery",
    keywords: ["coffee", "roast", "beans", "brew", "flavor", "aroma", "acidity", "grind", "taste"],
    verified: true
  },
  {
    product_id: "PROD-BOOK-001",
    name: "Clean Code: A Handbook of Agile Software Craftsmanship",
    category: "Books",
    keywords: ["book", "reading", "author", "chapters", "programming", "software", "practices", "refactoring", "pages"],
    verified: true
  },
  {
    product_id: "PROD-BOOK-002",
    name: "Atomic Habits by James Clear",
    category: "Books",
    keywords: ["book", "author", "habits", "psychology", "reading", "chapters", "mindset", "life", "principles"],
    verified: true
  },
  {
    product_id: "PROD-SPRT-001",
    name: "Bowflex SelectTech 552 Adjustable Dumbbells",
    category: "Sports",
    keywords: ["dumbbell", "weights", "workout", "gym", "grip", "plates", "exercise", "lifting", "strength"],
    verified: true
  },
  {
    product_id: "PROD-SPRT-002",
    name: "Manduka PRO Yoga Mat",
    category: "Sports",
    keywords: ["yoga", "mat", "grip", "cushion", "floor", "stretching", "pilates", "thickness", "sweat"],
    verified: true
  }
];

// Product name to category keyword heuristics for unknown products
const CATEGORY_HEURISTICS = [
  {
    category: "Electronics",
    regex: /\b(iphone|ipad|macbook|laptop|headphones?|earbuds?|tv|monitor|camera|phone|smartwatch|charger|usb|battery|screen|audio|wireless|gadget)\b/i
  },
  {
    category: "Fashion",
    regex: /\b(shirt|t-shirt|jeans|pants|jacket|dress|shoes?|sneakers?|boots?|sandals?|socks|coat|hoodie|clothing|apparel|outfit)\b/i
  },
  {
    category: "Beauty",
    regex: /\b(cream|serum|lipstick|perfume|shampoo|conditioner|cleanser|sunscreen|lotion|skincare|makeup|mascara|moisturizer|cosmetics)\b/i
  },
  {
    category: "Home/Kitchen",
    regex: /\b(cooker|fryer|blender|toaster|pan|pot|knife|sofa|chair|desk|bed|pillow|curtain|vacuum|lamp|furniture|kitchenware|kettle)\b/i
  },
  {
    category: "Grocery",
    regex: /\b(coffee|tea|oil|rice|milk|snack|chocolate|cereal|honey|spice|flour|sugar|sauce|pasta|juice|cookie|biscuit)\b/i
  },
  {
    category: "Books",
    regex: /\b(book|novel|paperback|hardcover|textbook|author|edition|volume|memoir|biography|guidebook|comic)\b/i
  },
  {
    category: "Sports",
    regex: /\b(dumbbell|yoga|mat|treadmill|bicycle|racket|football|basketball|gloves|weights|fitness|gym|trainer|workout)\b/i
  }
];

/**
 * Validates a product name against its selected category.
 * Distinguishes known catalogue items from arbitrary items.
 */
function validateProductCategory(productName, selectedCategory, productId = null) {
  if (!productName || typeof productName !== "string") {
    return { valid: false, error: "Product name is required." };
  }

  const trimmedProd = productName.trim();
  const trimmedCat = selectedCategory ? selectedCategory.trim() : "";

  if (!VALID_CATEGORIES.includes(trimmedCat)) {
    return {
      valid: false,
      error: "Invalid Category",
      message: `Category '${trimmedCat}' is unrecognized. Valid choices: ${VALID_CATEGORIES.join(", ")}.`,
      expectedCategory: null,
      isVerifiedCatalogue: false
    };
  }

  // 1. Check exact or fuzzy match in catalogue
  const lowerProd = trimmedProd.toLowerCase();
  const catalogueMatch = INITIAL_PRODUCTS.find(p => 
    (productId && p.product_id.toLowerCase() === productId.toLowerCase()) ||
    p.name.toLowerCase() === lowerProd ||
    lowerProd.includes(p.name.toLowerCase()) ||
    p.name.toLowerCase().includes(lowerProd)
  );

  if (catalogueMatch) {
    if (catalogueMatch.category.toLowerCase() !== trimmedCat.toLowerCase()) {
      return {
        valid: false,
        error: "Product-Category Mismatch",
        message: `'${catalogueMatch.name}' belongs to catalogue category '${catalogueMatch.category}', but '${trimmedCat}' was selected.`,
        expectedCategory: catalogueMatch.category,
        catalogueProduct: catalogueMatch,
        isVerifiedCatalogue: true
      };
    }
    return {
      valid: true,
      isVerifiedCatalogue: true,
      catalogueProduct: catalogueMatch,
      expectedCategory: catalogueMatch.category
    };
  }

  // 2. For items not explicitly in catalogue, use keyword heuristics
  if (trimmedCat !== "Other") {
    for (const heuristic of CATEGORY_HEURISTICS) {
      if (heuristic.regex.test(trimmedProd)) {
        if (heuristic.category.toLowerCase() !== trimmedCat.toLowerCase()) {
          return {
            valid: false,
            error: "Suspected Category Mismatch",
            message: `Product title '${trimmedProd}' appears to belong to '${heuristic.category}', but '${trimmedCat}' was selected.`,
            expectedCategory: heuristic.category,
            isVerifiedCatalogue: false
          };
        }
        break;
      }
    }
  }

  return {
    valid: true,
    isVerifiedCatalogue: false,
    expectedCategory: trimmedCat
  };
}

module.exports = {
  VALID_CATEGORIES,
  INITIAL_PRODUCTS,
  validateProductCategory
};
