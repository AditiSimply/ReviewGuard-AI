/**
 * ReviewGuard AI - 20 Standard & Edge Test Cases
 * Exactly matches all 20 test cases mandated in the specification.
 */

export const TEST_CASES = [
  {
    id: 1,
    title: "1. Valid Genuine Review",
    categoryType: "Normal",
    description: "Detailed, balanced review with natural pros, cons, and technical dimensions.",
    payload: {
      product_name: "Sony WH-1000XM5 Headphones",
      category: "Electronics",
      reviewer_name: "David K.",
      rating: 4,
      review_text: "The battery lasts around 28 hours with active noise cancelling turned on. Sound reproduction is balanced with crisp highs, though the headband padding creates minor pressure after 3 hours of continuous use."
    },
    expectedBehavior: "Passes validation, classified as Genuine by ML model with Low Risk and high quality score."
  },
  {
    id: 2,
    title: "2. Valid Suspicious Review",
    categoryType: "Forensics",
    description: "Extreme superlatives, hype language, and unverified commercial solicitation.",
    payload: {
      product_name: "Wireless Earbuds",
      category: "Electronics",
      reviewer_name: "Rahul123",
      rating: 5,
      review_text: "AMAZING BEST EVER PRODUCT! Buy this right now 100% recommended guaranteed satisfaction incredible deal!!!"
    },
    expectedBehavior: "Passes validation, classified as Fake by ML model with High Risk and highlighted promotional markers."
  },
  {
    id: 3,
    title: "3. Wrong Product Category",
    categoryType: "Intelligence",
    description: "iPhone 15 Pro selected under Footwear category.",
    payload: {
      product_name: "iPhone 15 Pro",
      category: "Footwear",
      reviewer_name: "Sam M.",
      rating: 5,
      review_text: "Super responsive titanium phone with incredible optical zoom and battery endurance."
    },
    expectedBehavior: "Validation BLOCKS analysis: Displays 'Invalid Product Category: iPhone 15 Pro belongs to Electronics, but Footwear was selected'."
  },
  {
    id: 4,
    title: "4. Empty Review Text",
    categoryType: "Validation",
    description: "Review text field is completely empty.",
    payload: {
      product_name: "Ergonomic Office Chair",
      category: "Home & Living",
      reviewer_name: "Sarah T.",
      rating: 5,
      review_text: ""
    },
    expectedBehavior: "Validation BLOCKS analysis: Displays 'Review text cannot be empty'."
  },
  {
    id: 5,
    title: "5. Very Short Review",
    categoryType: "Validation",
    description: "Review text below minimum 15 characters threshold.",
    payload: {
      product_name: "Yoga Mat",
      category: "Sports & Fitness",
      reviewer_name: "Chris L.",
      rating: 5,
      review_text: "It was okay."
    },
    expectedBehavior: "Validation BLOCKS analysis: Displays 'Review text is too short (minimum 15 characters required)'."
  },
  {
    id: 6,
    title: "6. Very Long Review",
    categoryType: "Validation",
    description: "Review text exceeding 2000 character buffer limit.",
    payload: {
      product_name: "MacBook Air M2",
      category: "Electronics",
      reviewer_name: "TechTester",
      rating: 4,
      review_text: "This is an extremely long test review intended to exceed system limits. ".repeat(40)
    },
    expectedBehavior: "Validation BLOCKS analysis: Displays 'Review text exceeds maximum allowed limit of 2000 characters'."
  },
  {
    id: 7,
    title: "7. Gibberish / Random Letters",
    categoryType: "Validation",
    description: "Keyboard mash with consonant clustering and no linguistic structure.",
    payload: {
      product_name: "Nike Air Max",
      category: "Footwear",
      reviewer_name: "AnonUser",
      rating: 5,
      review_text: "asdfghjklqwerty zxcvbnmasdfghjkl qwertyuiopasdfg hjklzxcvbnm"
    },
    expectedBehavior: "Validation BLOCKS analysis: Displays 'Meaningless gibberish or random character sequences detected'."
  },
  {
    id: 8,
    title: "8. Emoji-Only Review",
    categoryType: "Validation",
    description: "Review consisting entirely of emoji symbols.",
    payload: {
      product_name: "Whole Milk",
      category: "Grocery",
      reviewer_name: "DairyFan",
      rating: 5,
      review_text: "🥛🥛🥛🥛🥛😋😋😋🔥🔥🔥👍👍👍"
    },
    expectedBehavior: "Validation BLOCKS analysis: Displays 'Review contains only emojis without any descriptive text'."
  },
  {
    id: 9,
    title: "9. Invalid Rating",
    categoryType: "Validation",
    description: "Rating value of 0, negative, or greater than 5.",
    payload: {
      product_name: "Ceramic Coffee Mug",
      category: "Home & Living",
      reviewer_name: "James P.",
      rating: 0,
      review_text: "Decent mug that holds heat for 45 minutes without cracking."
    },
    expectedBehavior: "Validation BLOCKS analysis: Displays 'Invalid rating: Allowed values are strictly integers 1 to 5'."
  },
  {
    id: 10,
    title: "10. Rating-Sentiment Mismatch",
    categoryType: "Forensics",
    description: "5-star rating paired with harshly negative feedback text.",
    payload: {
      product_name: "Bluetooth Speaker",
      category: "Electronics",
      reviewer_name: "AngryBuyer",
      rating: 5,
      review_text: "Terrible horrible device! It arrived completely broken and shattered, toxic smell, worst product ever waste of money!"
    },
    expectedBehavior: "Passes validation, flags 'Rating-Sentiment Mismatch Detected' with explanation of contradiction."
  },
  {
    id: 11,
    title: "11. Product-Category Mismatch",
    categoryType: "Intelligence",
    description: "Nike Air Max entered under Grocery category.",
    payload: {
      product_name: "Nike Air Max 90",
      category: "Grocery",
      reviewer_name: "Runner99",
      rating: 4,
      review_text: "Cushioning is great for morning track runs and heel support feels sturdy."
    },
    expectedBehavior: "Validation BLOCKS analysis: Displays 'Nike Air Max 90 is classified under Footwear, not Grocery'."
  },
  {
    id: 12,
    title: "12. Duplicate Review",
    categoryType: "Forensics",
    description: "Exact duplicate of previously analyzed review already in forensic database.",
    payload: {
      product_name: "Wireless Earbuds",
      category: "Electronics",
      reviewer_name: "Rahul123",
      rating: 5,
      review_text: "AMAZING BEST EVER PRODUCT!!! Buy this right now 100% recommended guaranteed satisfaction incredible deal!!!!!"
    },
    expectedBehavior: "Detects existing duplicate hash: Shows 'Duplicate Review Detected - Previously Analyzed' with option to view or re-analyze."
  },
  {
    id: 13,
    title: "13. Excessive Punctuation",
    categoryType: "Validation",
    description: "Artificial hype with dozens of consecutive exclamation points.",
    payload: {
      product_name: "Hydrating Facial Cleanser",
      category: "Beauty & Personal Care",
      reviewer_name: "GlowLover",
      rating: 5,
      review_text: "Best cleanser ever!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    },
    expectedBehavior: "Validation BLOCKS analysis: Displays 'Excessive punctuation detected'."
  },
  {
    id: 14,
    title: "14. Excessive Capitalization",
    categoryType: "Validation",
    description: "ALL CAPS aggressive commercial shouting.",
    payload: {
      product_name: "Resistance Bands",
      category: "Sports & Fitness",
      reviewer_name: "FitnessPro",
      rating: 5,
      review_text: "EVERYONE MUST BUY THIS RIGHT NOW DO NOT HESITATE BEST ITEM IN THE ENTIRE WORLD"
    },
    expectedBehavior: "Validation BLOCKS analysis: Displays 'Excessive capitalization detected'."
  },
  {
    id: 15,
    title: "15. Promotional Review",
    categoryType: "Forensics",
    description: "Astroturfing with affiliate codes and discount marketing keywords.",
    payload: {
      product_name: "Vitamin C Serum",
      category: "Beauty & Personal Care",
      reviewer_name: "PromoAffiliate",
      rating: 5,
      review_text: "Check out bit.ly/greatdeals for promo code SAVE20! 100% genuine miracle product link in bio buy now!"
    },
    expectedBehavior: "Passes validation, flags high promotional language score (>80), classifies as Fake with High Risk."
  },
  {
    id: 16,
    title: "16. Unrelated Review Content",
    categoryType: "Intelligence",
    description: "Electronics product but review discusses cheese and bakery recipes.",
    payload: {
      product_name: "Dell XPS 15 Laptop",
      category: "Electronics",
      reviewer_name: "FoodBlogger",
      rating: 5,
      review_text: "Delicious creamy cheese and fresh pastry baked to crispy perfection with sweet organic honey taste."
    },
    expectedBehavior: "ML Engine BLOCKS analysis: Displays 'Content-Category Mismatch: Review discusses concepts outside Electronics domain'."
  },
  {
    id: 17,
    title: "17. ML Service Failure Simulation",
    categoryType: "Resilience",
    description: "Simulates downtime or network fault contacting ML service.",
    payload: {
      product_name: "Smart Watch",
      category: "Electronics",
      reviewer_name: "Tester",
      rating: 4,
      review_text: "Testing network resilience and graceful fallback error message display.",
      simulate_ml_failure: true
    },
    expectedBehavior: "UI gracefully presents Service Unavailable alert with diagnostic guide, recovery actions, and zero blank screen."
  },
  {
    id: 18,
    title: "18. Backend Failure Simulation",
    categoryType: "Resilience",
    description: "Simulates network disconnection from backend server.",
    payload: {
      product_name: "Cotton T-Shirt",
      category: "Fashion & Apparel",
      reviewer_name: "Tester",
      rating: 5,
      review_text: "Testing graceful UI error recovery when backend cannot be reached.",
      simulate_backend_failure: true
    },
    expectedBehavior: "UI catches network error, displays offline recovery state with retry button, and preserves user draft."
  },
  {
    id: 19,
    title: "19. Invalid CSV Batch",
    categoryType: "Batch",
    description: "CSV containing malformed rows, invalid categories, and rating violations.",
    isCsvTest: true,
    csvType: "invalid",
    expectedBehavior: "Batch analysis catches each faulty row, isolates valid vs invalid records, and displays line-by-line rejection reasons."
  },
  {
    id: 20,
    title: "20. Empty CSV Batch",
    categoryType: "Batch",
    description: "Uploaded CSV with zero data records.",
    isCsvTest: true,
    csvType: "empty",
    expectedBehavior: "Rejects upload with clear user-friendly error: 'The uploaded CSV file contains no data rows'."
  }
];
