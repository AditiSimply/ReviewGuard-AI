"""
ReviewGuard AI - ML Model Training Pipeline
Trains and compares Logistic Regression, Naive Bayes, and SVM on labeled review forensics data.
Calculates real Accuracy, Precision, Recall, F1-Score, and Confusion Matrix.
Automatically selects and serializes the best-performing model.
"""

import os
import json
import pickle
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

# Comprehensive, realistic dataset of labeled reviews (0: Genuine, 1: Fake/Suspicious)
# Diverse categories: Electronics, Footwear, Grocery, Beauty, Home & Living, Sports, Fashion
TRAINING_DATA = [
    # --- ELECTRONICS (GENUINE) ---
    ("The battery life on this laptop lasts about 6 to 7 hours of standard office work. The trackpad is smooth, though the keyboard travel is a bit shallow.", 0),
    ("Sound quality on these headphones is balanced with decent mids, but the active noise cancellation creates a slight hiss in silent rooms.", 0),
    ("Display is crisp and bright outdoors. However, the phone heats up noticeably when playing 3D games for more than 20 minutes.", 0),
    ("Connected easily to my home Wi-Fi 6 router. Speed tests show 450 Mbps in the next room, which matches my previous mesh node.", 0),
    ("The camera takes natural photos in daylight with good dynamic range, but low-light shots have visible noise along the shadows.", 0),
    ("Packaging arrived slightly dented, but the monitor was unharmed. Setup took 10 minutes with the included HDMI cable.", 0),
    ("Solid build quality for the price. The USB-C port feels firm, though I wish it included an extra USB-A slot on the side.", 0),
    ("Volume controls are responsive. The Bluetooth pairing can sometimes drop when switching between my iPad and laptop.", 0),
    ("Using this keyboard for 3 weeks now. The brown switches offer good tactile feedback without being too loud for open office spaces.", 0),
    ("The smart watch tracks heart rate accurately compared to my chest strap during jogging, but the sleep tracking sometimes counts watching TV as light sleep.", 0),

    # --- ELECTRONICS (FAKE / SUSPICIOUS) ---
    ("AMAZING BEST EVER PRODUCT!!! Buy this right now 100% recommended guaranteed satisfaction incredible deal!!!!!", 1),
    ("Total perfection! Best gadget in the whole world! Everyone must buy this today! Five stars all the way!!!!!", 1),
    ("Do not hesitate buy immediately best purchase of my life absolute perfection must have item five stars!!", 1),
    ("Incredible amazing sensational life changing product!! You will never regret this buy buy buy now!", 1),
    ("100% genuine top quality number one seller fast shipping awesome fantastic super great purchase!!", 1),
    ("Best quality ever seen. I bought 10 for all my relatives. Unbelievable miracle gadget five stars!", 1),
    ("Must buy item! Miracle product! Everyone on my Instagram loves this so much buy immediately!", 1),
    ("PERFECT PERFECT PERFECT! Everything is outstanding and flawless. Greatest experience ever!", 1),
    ("Check out this seller they are the best! Premium VIP quality guaranteed 1000% satisfaction!", 1),
    ("Simply the best in the market. No other brand comes close. Mind blowing unbelievable five stars!", 1),

    # --- FOOTWEAR (GENUINE) ---
    ("Soles have good traction on wet pavement. The toe box runs slightly narrow so I recommend sizing up by half a size.", 0),
    ("Wore these for a 10k road run yesterday. Arch support is firm and the breathable mesh kept my feet cool throughout.", 0),
    ("The leather feels genuine and broke in nicely after 4 days of light walking. Stitching around the heel is uniform.", 0),
    ("Comfortable cushioning for daily office commutes, though the white rubber trim scuffs rather easily.", 0),
    ("The ankle padding is generous. They feel a bit heavy compared to modern foam runners, but durability appears solid.", 0),
    ("Fit is true to size with medium wool socks. Insole offers moderate arch support, easily replaceable if you need orthotics.", 0),
    ("Good grip on gravel trails. Laces stay tied without double knotting, but the shoe tongue slips slightly to the side.", 0),

    # --- FOOTWEAR (FAKE / SUSPICIOUS) ---
    ("BEST SHOES EVER MADE IN HUMAN HISTORY! Super comfy everyone buy now 100 stars!!", 1),
    ("Unbelievable shoes! My feet never touched the ground before this miracle footwear buy buy buy!", 1),
    ("SUPER FAST SHIPPING BEST SELLER AMAZING COMFORT BUY RIGHT NOW 10/10 MUST BUY!!", 1),
    ("Flawless shoes! Walking on clouds 1000% recommend to all friends and family best ever!", 1),
    ("The greatest footwear in existence! Absolutely no flaws pure perfection buy immediately!", 1),
    ("Spectacular shoes! Everyone stopped me on the street to compliment! BUY THEM NOW!", 1),

    # --- GROCERY (GENUINE) ---
    ("Milk has a fresh taste with 3.5% fat content. Expiration date was 6 days out from delivery date.", 0),
    ("Olive oil has a slightly peppery finish with green herbal aroma, good for salads though price is on the higher side.", 0),
    ("Oatmeal cooks in 3 minutes on stovetop. Texture is chewy rather than mushy, with minimal husks found in the bag.", 0),
    ("Coffee beans roasted two weeks prior to shipping. Medium roast with subtle caramel notes and mild acidity.", 0),
    ("The pasta retains an al dente bite when boiled for 9 minutes. Holds heavy tomato sauces well without falling apart.", 0),
    ("Almond butter was well-emulsified with minimal oil separation at the top. Mild roasted nutty flavor without added sugar.", 0),

    # --- GROCERY (FAKE / SUSPICIOUS) ---
    ("BEST TASTING FOOD EVER DISCOVERED! Tastes like heaven buy 20 packs now amazing deliciousness!!", 1),
    ("MIRACLE GROCERY ITEM! Completely changed my life and health overnight buy now five stars!", 1),
    ("Tastes like paradise! Best company best seller fast delivery 100% recommended buy immediately!!", 1),
    ("Delicious beyond imagination! Nothing on earth tastes this good buy right now trust me!", 1),

    # --- BEAUTY (GENUINE) ---
    ("Serum has a lightweight watery consistency that absorbs in about 45 seconds. No noticeable scent or irritation on my sensitive skin.", 0),
    ("Sunscreen leaves zero white cast on medium skin tones. It has a dewy finish that requires a light setting powder for oily T-zones.", 0),
    ("Lipstick has decent pigmentation with one swipe. It lasts about 4 hours before fading slightly after coffee and lunch.", 0),
    ("Cleanser foams gently without stripping natural moisture. Does struggle to remove waterproof mascara without an oil pre-cleanse.", 0),
    ("Moisturizer contains ceramides and niacinamide. Helped reduce dry patches around my nose over two weeks of nightly application.", 0),

    # --- BEAUTY (FAKE / SUSPICIOUS) ---
    ("MIRACLE CREAM REMOVED ALL MY WRINKLES IN 10 MINUTES! BUY THIS MAGIC FORMULA NOW!", 1),
    ("Flawless skin overnight! Incredible miracle beauty solution everyone must purchase now!", 1),
    ("Best cosmetics company in the world! 100% flawless results immediately buy buy buy!", 1),
    ("HOLY GRAIL! Erased 20 years from my face in 3 days! Best seller ever 500 stars!", 1),

    # --- HOME & LIVING (GENUINE) ---
    ("Desk assembly took about 40 minutes with two people. The steel frame is sturdy, though the wood veneer can scratch if not careful.", 0),
    ("Pillow offers medium-firm support which relieved my neck stiffness. There was a mild chemical odor that aired out within 24 hours.", 0),
    ("Ceramic mugs hold approximately 14 oz. Microwave safe and handles stay relatively cool after 90 seconds of reheating tea.", 0),
    ("Blackout curtains block roughly 90% of morning sunlight. Fabric is thick and stitching along the grommets is well-reinforced.", 0),
    ("Vacuum cleaner has strong suction on hardwood floors and low-pile rugs. Dust canister fills quickly in pet-heavy rooms.", 0),

    # --- HOME & LIVING (FAKE / SUSPICIOUS) ---
    ("BEST FURNITURE EVER BUILT! Stunned beyond words amazing masterpiece buy right now!", 1),
    ("Incredible divine perfection for your home! Buy 5 of them right now 100% satisfaction!", 1),
    ("Mind blowing quality! Greatest home item ever conceived buy buy buy five stars!!", 1),

    # --- SPORTS & FITNESS (GENUINE) ---
    ("Yoga mat is 6mm thick providing good joint cushioning on wooden floors. Grip gets slightly slick during sweaty hot yoga sessions.", 0),
    ("Dumbbells have a durable rubber coating that prevents floor scuffing. Knurled grip provides secure hold during heavy presses.", 0),
    ("Hydration backpack bladder holds 2 liters without leaking. Shoulder straps are breathable and didn't chafe during an 8-mile hike.", 0),
    ("Resistance bands offer progressive tension. After 2 months of regular use, no signs of snapping or fraying along the seams.", 0),

    # --- SPORTS & FITNESS (FAKE / SUSPICIOUS) ---
    ("BEST FITNESS GEAR IN THE ENTIRE UNIVERSE! Got six pack in 2 days buy now amazing!", 1),
    ("Miracle equipment! Unbelievable results in hours everyone order immediately five stars!", 1),
    ("Supreme VIP athletic quality! Don't look anywhere else buy right now best ever!", 1),

    # --- FASHION & APPAREL (GENUINE) ---
    ("Cotton shirt feels soft and pre-shrunk. Sizing fits true across the shoulders, though sleeve length is slightly long.", 0),
    ("Denim jacket has substantial weight with classic brass buttons. Side pockets are somewhat shallow for modern smartphones.", 0),
    ("Wool trench coat kept me warm in 45-degree weather with a light sweater underneath. Lining is polyester but feels silky.", 0),
    ("Socks maintain elasticity after several wash cycles. Reinforced heel padding prevents early wear against hiking boots.", 0),

    # --- FASHION & APPAREL (FAKE / SUSPICIOUS) ---
    ("BEST CLOTHES EVER CREATED! Everyone was jealous of my look buy now 100% perfection!!", 1),
    ("Astonishing VIP quality fabric! Pure elegance buy immediately top seller five stars!!", 1),
    ("Unreal perfection! Never taking this off buy buy buy amazing unbelievable!!", 1),

    # --- ADDITIONAL VARIED GENUINE EXAMPLES ---
    ("Decent value for everyday use. Does what it says on the box without any fancy extras. Happy with the purchase overall.", 0),
    ("The delivery was fast, arriving in two days. Item was properly packaged with bubble wrap. Minor scuff on corner but works fine.", 0),
    ("I have mixed feelings. On one hand the performance is great, but on the other hand the manual was poorly translated.", 0),
    ("Good build quality and ergonomic design. I appreciate the 2-year warranty included by the manufacturer in the documentation.", 0),
    ("Takes some getting used to the interface, but once configured it runs quietly in the background without hogging memory.", 0),
    ("Purchased as a replacement for my older 2021 model. Noticeably faster processing times and slightly better battery efficiency.", 0),
    ("Simple installation and straightforward controls. Could benefit from a longer power cord, but an extension strip solved that.", 0),
    ("Material feels durable and withstands daily wear. A bit stiffer than anticipated out of the box, but loosening up with time.", 0),
    ("Arrived on time. The box was sealed. Haven't tested thoroughly yet but looks good so far.", 0),
    ("Decent product for the price. Not the best I have ever had, but for fifteen dollars it works reasonably well.", 0),
    ("Purchased after seeing an advertisement on Instagram. Packaging is nice. Doesn't quite live up to viral hype but it's okay.", 0),
    ("Average quality. The plastic feels a little cheap and hollow, but functionally it serves its intended purpose.", 0),
    ("Works fine most days. Had a small glitch on day two but after resetting it hasn't given me any further issues.", 0),
    ("Pretty standard product. Nothing outstanding to brag about, but certainly not bad either. Three stars.", 0),
    ("I bought this on sale. It does what I need. Customer support was slow to answer my question about dimensions.", 0),
    ("The color is a little darker than the photo on the listing. Still functional and fits well.", 0),

    # --- ADDITIONAL VARIED FAKE / SPAM / ASTROTURF EXAMPLES ---
    ("Check out bit.ly/greatdeals for discount code! Amazing review best product ever five stars buy now!", 1),
    ("Five stars! Great product! Buy now! Recommend to all! Best seller! 5/5 stars!", 1),
    ("AMAZINGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG SO GOOOOOOOOD BUY IT!", 1),
    ("Unbeatable price and quality! I am professional reviewer and this is top rated number one worldwide!", 1),
    ("I never write reviews but this one forced me to! It is an absolute life-saver, divine gift, five stars unconditionally!", 1),
    ("FREE GIFT RECEIVED WITH THIS ORDER! Best company in history please give them your money now!", 1),
    ("WOW WOW WOW WOW WOW WOW WOW WOW WOW WOW BUY THIS NOW EVERYTHING ABOUT IT IS PERFECT!", 1),
    ("100% genuine guaranteed original best product in the world order today fast shipping!", 1),
    ("Don't hesitate for a single second! Click buy immediately! You will thank me later 100%!", 1),
    ("Excellent excellent excellent excellent excellent magnificent spectacular wonderful super!", 1),
    ("Sponsored review: This product exceeded every expectation. Absolutely flawless and essential for everyone.", 1),
    ("Promo code SAVE20 for discount! Best gadget in market! Five stars rating guaranteed!", 1),
    ("I received this complimentary product in exchange for honest feedback. Truly the most magnificent item ever crafted buy now!", 1),
    ("Super super super fast delivery! Authentic product 10/10 must have for everyone immediately!", 1),
    ("Greatest thing I ever bought online! Highly recommend to everyone around the world buy now!", 1),
    ("Love love love this product! Can't live without it anymore best seller best store!", 1),
    ("This item completely revolutionized my lifestyle. Don't waste time researching other brands just buy this!", 1),
    ("Affiliate discount link in bio! Incredible quality and stunning look five stars all the way!", 1)
]

def train_and_evaluate_models():
    print(f"Loaded {len(TRAINING_DATA)} labeled review samples.")
    texts, labels = zip(*TRAINING_DATA)

    # Train / Test split with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.25, random_state=42, stratify=labels
    )
    print(f"Training split: {len(X_train)} samples, Test split: {len(X_test)} samples")

    # Feature extraction with TF-IDF (unigrams + bigrams)
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=2500,
        sublinear_tf=True,
        min_df=1
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # Models to train and compare
    models = {
        "Logistic Regression": LogisticRegression(C=1.5, max_iter=1000, random_state=42),
        "Naive Bayes": MultinomialNB(alpha=0.3),
        "SVM": CalibratedClassifierCV(LinearSVC(C=1.0, random_state=42), cv=3)
    }

    metrics_results = {}
    best_model_name = None
    best_f1 = -1.0
    trained_models = {}

    for name, model in models.items():
        print(f"\n--- Training {name} ---")
        model.fit(X_train_vec, y_train)
        y_pred = model.predict(X_test_vec)

        # Real metrics calculation
        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        cm = confusion_matrix(y_test, y_pred).tolist()

        print(f"{name} -> Accuracy: {acc:.4f}, Precision: {prec:.4f}, Recall: {rec:.4f}, F1: {f1:.4f}")
        print(f"Confusion Matrix (TN, FP / FN, TP):\n{cm}")

        metrics_results[name] = {
            "name": name,
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "confusion_matrix": {
                "tn": int(cm[0][0]),
                "fp": int(cm[0][1]),
                "fn": int(cm[1][0]),
                "tp": int(cm[1][1]),
                "raw": cm
            },
            "train_samples": len(X_train),
            "test_samples": len(X_test)
        }
        trained_models[name] = model

        # Model selection: compare based on F1-score, fallback to accuracy
        if f1 > best_f1 or (f1 == best_f1 and acc > metrics_results.get(best_model_name, {}).get("accuracy", 0)):
            best_f1 = f1
            best_model_name = name

    print(f"\n==========================================")
    print(f"AUTOMATICALLY SELECTED BEST MODEL: {best_model_name} (F1: {best_f1:.4f})")
    print(f"==========================================")

    # Top feature keywords for explainability
    lr_model = trained_models["Logistic Regression"]
    feature_names = np.array(vectorizer.get_feature_names_out())
    coefs = lr_model.coef_[0]
    top_fake_idx = np.argsort(coefs)[-20:][::-1]
    top_genuine_idx = np.argsort(coefs)[:20]

    top_signals = {
        "fake_indicators": feature_names[top_fake_idx].tolist(),
        "genuine_indicators": feature_names[top_genuine_idx].tolist()
    }

    # Save artifacts
    output_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(output_dir, exist_ok=True)

    # Save vectorizer
    with open(os.path.join(output_dir, "vectorizer.pkl"), "wb") as f:
        pickle.dump(vectorizer, f)

    # Save all models
    with open(os.path.join(output_dir, "models.pkl"), "wb") as f:
        pickle.dump(trained_models, f)

    # Save metadata and metrics
    metadata = {
        "best_model": best_model_name,
        "models": metrics_results,
        "feature_signals": top_signals,
        "dataset_size": len(TRAINING_DATA)
    }

    with open(os.path.join(output_dir, "metrics.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Successfully saved all models, vectorizer, and metrics to {output_dir}")
    return metadata

if __name__ == "__main__":
    train_and_evaluate_models()
