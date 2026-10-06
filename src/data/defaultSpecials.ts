import { ComboDeal, SpecialOffer } from "../types";

export const DEFAULT_COMBOS: ComboDeal[] = [
  {
    id: "combo-1",
    title: "The Signature Glow Combo",
    tagline: "BIAB Builder Gel Hands & Deluxe Spa Pedicure",
    badge: "Most Popular",
    originalPrice: 730,
    discountedPrice: 590,
    savings: 140,
    durationMinutes: 135,
    description:
      "Our most requested pamper combo! Includes our signature natural BIAB overlay on hands with high-gloss finish, paired with a full deluxe spa jelly foot soak, scrub, cuticle tidy, and gel polish toes.",
    includedItems: [
      "BIAB Natural Nail Overlay (apex rebuild)",
      "Deluxe Spa Pedicure with exfoliating scrub",
      "Cuticle clean, shape & buff",
      "High-shine gel top coat on hands & feet",
      "Complimentary organic rose cuticle oil",
    ],
    serviceIds: ["srv-bi-1", "srv-ped-1"],
    isPopular: true,
  },
  {
    id: "combo-2",
    title: "Luxe Sculpt & Art Duo",
    tagline: "Sculptured Acrylic Set + Chrome Finish + Free Soak-Off",
    badge: "Save R145",
    originalPrice: 640,
    discountedPrice: 495,
    savings: 145,
    durationMinutes: 140,
    description:
      "Bespoke form-sculpted acrylic nails (no glue-on plastic tips!) finished with trending Glazed Donut or metallic chrome powder, with complimentary soak-off of previous work.",
    includedItems: [
      "Custom Form-Sculpted Acrylic Set (Medium/Long)",
      "Glazed Donut / Pearl Chrome Powder (all 10 fingers)",
      "Gentle Soak-Off of previous set included",
      "Deep cuticle oil hydration",
    ],
    serviceIds: ["srv-ac-3", "srv-art-1", "srv-mn-1"],
    isPopular: true,
  },
  {
    id: "combo-3",
    title: "Clean Girl Aesthetic Set",
    tagline: "Milky BIAB Overlay + Micro French + Hand Massage",
    badge: "Client Favorite",
    originalPrice: 450,
    discountedPrice: 370,
    savings: 80,
    durationMinutes: 90,
    description:
      "The viral minimalist Pinterest look. Strengthening milk-bath BIAB builder gel overlay with razor-sharp micro-French tips and relaxing warm lotion hand massage.",
    includedItems: [
      "BIAB Strengthening Natural Overlay",
      "Hand-painted Micro French Tips",
      "Warm lavender massage lotion finish",
      "Flawless cuticle e-file prep",
    ],
    serviceIds: ["srv-bi-1", "srv-art-4"],
    isPopular: false,
  },
  {
    id: "combo-4",
    title: "Baby Boomer Ombré & 3D Art",
    tagline: "Seamless French Fade + 2-Finger 3D Gel/Charms",
    badge: "Weekend Glam",
    originalPrice: 560,
    discountedPrice: 470,
    savings: 90,
    durationMinutes: 120,
    description:
      "Classic seamless Baby Boomer ombré acrylic transition with 2 statement accent nails featuring 3D sculpted florals or Korean-style water droplets.",
    includedItems: [
      "Full Baby Boomer / Ombré Acrylic Set",
      "2x 3D Textured Nail Art or Charms",
      "High-gloss diamond gel top coat",
    ],
    serviceIds: ["srv-ac-2", "srv-art-3"],
    isPopular: false,
  },
  {
    id: "combo-5",
    title: "Express Hands & Feet Pamper",
    tagline: "Quick Gel Overlay Hands + Express Gel Toes",
    badge: "Fast & Fresh",
    originalPrice: 510,
    discountedPrice: 410,
    savings: 100,
    durationMinutes: 75,
    description:
      "Pressed for time? Get both hands and feet looking pristine in under 80 minutes with full dry cuticle manicure and matching long-lasting gel polish.",
    includedItems: [
      "Express Gel Polish Manicure on natural nails",
      "Express Pedicure & Gel Toes",
      "Precision filing, shape & cuticle clean",
    ],
    serviceIds: ["srv-bi-3", "srv-ped-2"],
    isPopular: false,
  },
];

export const DEFAULT_SPECIALS: SpecialOffer[] = [
  {
    id: "spec-1",
    title: "First-Time Client Welcome",
    code: "HUSH15",
    badge: "15% OFF",
    discountText: "15% OFF your very first appointment at HUSH nails",
    description:
      "New to HUSH nails? Receive 15% discount on any full set or BIAB overlay when you book your debut appointment with us in Rosebank.",
    validity: "Valid for all first-time client bookings",
    terms: "Applies to treatments over R300. Cannot be combined with combo deals.",
  },
  {
    id: "spec-2",
    title: "Mid-Week Self-Care Glow",
    code: "MIDWEEK60",
    badge: "R60 OFF",
    discountText: "R60 OFF any appointment booked on Tuesdays or Wednesdays",
    description:
      "Skip the weekend rush! Book any nail service valued at R350 or more on a Tuesday or Wednesday and enjoy an instant R60 saving.",
    validity: "Tuesdays & Wednesdays all day",
    terms: "Minimum spend R350. Mention code or claim during booking.",
  },
  {
    id: "spec-3",
    title: "Birthday Month Glam Voucher",
    code: "BDAYGLAM",
    badge: "FREE ART",
    discountText: "Free Chrome Glaze or 2x Accent Nail Art during your birthday month",
    description:
      "Celebrate your special day with HUSH nails! Bring ID showing your birthday month to get complimentary glazed chrome or bespoke nail art on your set.",
    validity: "Valid anytime during your birthday month",
    terms: "With any full set, BIAB or pedicure booking.",
  },
  {
    id: "spec-4",
    title: "Besties Date Special",
    code: "BESTIES10",
    badge: "10% OFF BOTH",
    discountText: "10% OFF when two clients book together back-to-back",
    description:
      "Bring your sister, mom, or best friend! Book two consecutive time slots on the same day and you both enjoy 10% off your totals.",
    validity: "Valid Mondays to Thursdays",
    terms: "Both clients must attend their respective slots on the same date.",
  },
];
