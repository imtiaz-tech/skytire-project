export const IMG = "/images/storefront/photos";
export const ICO = "/images/storefront/icons";

export const navItems = [
  { label: "Tires", href: "/products", hasMenu: true },
  { label: "Wheels", href: "/wheels", hasMenu: true },
  { label: "Wire Wheels", href: "/wire-wheels", active: true },
  { label: "Whitewalls", href: "/products?sidewall=WHITE_WALL" },
  { label: "Blackwalls", href: "/products?sidewall=BLACK_WALL" },
  { label: "Accessories", href: "/accessories" },
  { label: "Deals", href: "/products" },
] as const;

export const trustItems = [
  { icon: "truck", label: "Free Shipping", mobileLabel: "Free Shipping" },
  { icon: "financing", label: "0% Financing Available", mobileLabel: "0% Financing Available" },
  { icon: "returns", label: "Easy 30-Day Returns", mobileLabel: "Easy Returns" },
  { icon: "fitment", label: "100% Fitment Guarantee", mobileLabel: "100% Fitment Guarantee" },
  { icon: "lock", label: "Secure Encrypted Payments", mobileLabel: "100% Secure Payments" },
] as const;

export const heroCtas = [
  { label: "Shop Wire Wheels", href: "/wire-wheels", icon: "logo-mark" },
  { label: "Shop Wheels", href: "/wheels", icon: "logo-mark" },
  { label: "Shop Tires", href: "/products", icon: "logo-mark" },
  { label: "Shop Lowrider Accessories", href: "/accessories", icon: "why-tools" },
] as const;

export const finalCtas = [
  { label: "Shop Wire Wheels", href: "/wire-wheels" },
  { label: "Shop Whitewalls", href: "/products?sidewall=WHITE_WALL" },
  { label: "Build Your Lowrider", href: "/#vehicle-finder" },
] as const;

export const collectionCards = [
  {
    title: "Wire Wheels",
    description: "Chrome • Gold • Two-Tone • Rose Gold • Neon",
    href: "/wire-wheels",
    image: `${IMG}/collection-wire-wheels.png`,
    cta: "Explore the Collection",
    featured: true,
  },
  {
    title: "Whitewall Tires",
    description: "Classic looks. Modern radial performance.",
    href: "/products?sidewall=WHITE_WALL",
    image: `${IMG}/collection-white-walls.png`,
  },
  {
    title: "Promotions",
    eyebrow: "Limited Time",
    description: "Deals • Packages • Clearance",
    offer: "Up to 67% Off",
    href: "/products",
    image: `${IMG}/collection-promotions.png`,
    cta: "See All Offers",
    promo: true,
  },
  {
    title: "Bolt-On Wire Wheels",
    description: "The wire-wheel look. Easy installation.",
    href: "/bolt-on-wire-wheels",
    image: `${IMG}/collection-bolt-on.png`,
  },
  {
    title: "Accessories",
    description: "Knock-Offs • Spinners • Adapters • More",
    href: "/accessories",
    image: `${IMG}/collection-accessories.png`,
  },
  {
    title: "Wheels",
    description: "Chrome • Custom • Performance",
    href: "/wheels",
    image: `${IMG}/collection-wheels.png`,
  },
  {
    title: "Blackwall Tires",
    description: "Premium Brands • Everyday Performance",
    href: "/products?sidewall=BLACK_WALL",
    image: `${IMG}/collection-blackwalls.png`,
  },
] as const;

export const spokeOptions = [
  { count: "72", label: "72 Spoke Cross Lace" },
  { count: "100", label: "100 Spoke Straight Lace" },
  { count: "150", label: "150 Spoke Radial Lace" },
  { count: "204", label: "204 Straight Lace" },
] as const;

export const finishes = [
  { name: "Chrome", image: `${IMG}/finish-chrome.png` },
  { name: "All Gold", image: `${IMG}/finish-all-gold.png` },
  { name: "Gold Center", image: `${IMG}/finish-gold-center.png` },
  { name: "Rose Gold", image: `${IMG}/finish-rose-gold.png` },
  { name: "Neon", image: `${IMG}/finish-neon.png` },
] as const;

export const looks = [
  {
    title: "The Classic",
    subtitle: "Chrome Wire + Whitewall",
    image: `${IMG}/look-classic.png`,
    href: "/wire-wheels",
  },
  {
    title: "The Lowrider",
    subtitle: "Gold Wire + Whitewall",
    image: `${IMG}/look-lowrider.png`,
    href: "/wire-wheels",
  },
  {
    title: "The Luxury",
    subtitle: "Gold Center + Chrome",
    image: `${IMG}/look-luxury.png`,
    href: "/wheels",
  },
  {
    title: "The Show Car",
    subtitle: "Rose Gold",
    image: `${IMG}/look-showcar.png`,
    href: "/wire-wheels",
  },
  {
    title: "The Clean Build",
    subtitle: "Minimal chrome, sharp stance",
    image: `${IMG}/look-clean.png`,
    href: "/wheels",
  },
] as const;

export const packages = [
  {
    title: "The Street Classic",
    image: `${IMG}/package-classic.png`,
    price: 1299,
    items: [
      "13x7 Rev-Master Chrome Spoke",
      "155/80R13 SkyTire Whitewall",
      "Mounted & Road-Force Balanced",
      "Chrome Lug Nuts Included",
    ],
  },
  {
    title: "The Executive Gold",
    image: `${IMG}/package-gold.png`,
    price: 1850,
    featured: true,
    items: [
      "14x7 Gold-Center Luxury Spoke",
      "175/70R14 SkyTire Whitewall",
      "Precision High-Speed Balancing",
      "Matching Gold Lug Kit",
    ],
  },
  {
    title: "The Boulevard King",
    image: `${IMG}/package-king.png`,
    price: 1575,
    items: [
      "15x7 Deep-Dish Chrome Spoke",
      "195/60R15 Premium Whitewall",
      "Custom Valve Stems",
      "Lifetime Balance Support",
    ],
  },
] as const;

export const whySkyTire = [
  {
    title: "Lowrider Specialists",
    body: "We understand offsets, hydraulics, and custom clearances like no one else in the industry.",
    icon: "why-tools",
  },
  {
    title: "Massive Selection",
    body: "Thousands of whitewalls, blackwalls, and specialty wire wheels in stock and ready to ship.",
    icon: "why-warehouse",
  },
  {
    title: "Fitment Confidence",
    body: "Our proprietary fitment database ensures what you buy fits your specific year and model perfectly.",
    icon: "why-fitment",
  },
  {
    title: "Complete Packages",
    body: "Receive your wheels and tires mounted, balanced, and ready for the boulevard right out of the box.",
    icon: "why-package",
  },
  {
    title: "Premium Service",
    body: "Dedicated automotive experts available via chat or phone to guide your build from start to finish.",
    icon: "why-handshake",
  },
  {
    title: "Lowest Price Guaranteed",
    body: "Find a lower advertised price and we'll beat it. We won't be undersold on quality or value.",
    icon: "why-pricetag",
  },
] as const;

export const financingOptions = [
  {
    name: "Affirm",
    image: `${IMG}/finance-affirm.png`,
    logoWidth: 199,
    logoHeight: 89,
    title: "Monthly Payments",
    body: "Rate from 0% APR on approved credit.",
    cta: "Learn more about Affirm",
    href: "https://www.affirm.com",
    featured: true,
    badge: "0% APR",
  },
  {
    name: "PayTomorrow",
    image: `${IMG}/finance-paytomorrow.png`,
    logoWidth: 210,
    logoHeight: 194,
    title: "Full Spectrum Financing",
    body: "No effect on your credit to apply.",
    cta: "Learn more about Pay Tomorrow",
    href: "https://www.paytomorrow.com",
    featured: false,
    badge: null,
  },
  {
    name: "Snap",
    image: `${IMG}/finance-snap.png`,
    logoWidth: 216,
    logoHeight: 109,
    title: "Lease Financing",
    body: "Flexible lease-to-own financing options.",
    cta: "Get approved with Snap",
    href: "https://www.snapfinance.com",
    featured: false,
    badge: null,
  },
] as const;

export const whyChooseCards = [
  {
    title: "Original White Wall Tires for Classic & Lowrider Cars.",
    body: "Sky Tire specializes in original white sidewall tires designed for classic cars, lowriders, and vintage vehicles. Popular among lowrider enthusiasts across California and throughout the United States, our tires feature factory-produced white sidewalls rather than painted or shaved whitewalls. These sidewalls are chemically treated to resist cracking, yellowing, and sidewall damage. Available in popular sizes for classic American cars, lowriders, and vintage imports, our white wall tires combine authentic styling with dependable modern performance.",
    image: `${IMG}/why-whitewall.png`,
    href: "/products?sidewall=WHITE_WALL",
    cta: "Learn More",
  },
  {
    title: "Premium 72, 100 & 150 Spoke Lowrider Wire Wheels.",
    body: "Upgrade your vehicle with premium lowrider wire wheels available in 72-spoke, 100-spoke, and 150-spoke designs. Sky Tire offers chrome, gold & rose gold wire wheels in multiple sizes to fit classic cars, lowriders, and custom builds. These iconic wheels provide timeless style and precision craftsmanship for enthusiasts who demand both performance and visual impact.",
    image: `${IMG}/why-wire.png`,
    href: "/wire-wheels",
    cta: "Explore Wheels",
  },
  {
    title: "Stylish Custom & Alloy Wheels for Modern Vehicles.",
    body: "In addition to classic wire wheels, Sky Tire offers a wide selection of modern alloy wheels designed for today's vehicles. From sleek multi-spoke designs to aggressive performance styles, our wheels provide durability, style, and perfect fitment for a wide range of cars and SUVs.",
    image: `${IMG}/why-alloy.png`,
    href: "/wheels",
    cta: "View Modern Wheels",
  },
  {
    title: "Bolt-On Wire Wheels for Easy Installation.",
    body: "Bolt-on wire wheels provide the classic wire wheel look without requiring knock-off adapters. Designed for simple installation, these wheels fit many modern vehicles while delivering the timeless appearance of traditional wire wheels.",
    image: `${IMG}/why-bolton.png`,
    href: "/bolt-on-wire-wheels",
    cta: "Shop Bolt-On",
  },
] as const;

export const premiumServices = [
  {
    title: "Fast and Free Shipping",
    body: "Next-day delivery available for all premium tire sets. Fully insured transit to your doorstep or preferred specialist workshop.",
    icon: "truck",
    href: "/shipping",
  },
  {
    title: "30 Days Returns",
    body: "Changed your mind? Send unused products back within 30 days for a straightforward return.",
    icon: "returns",
    href: "/returns",
  },
  {
    title: "Buy Now Pay Later",
    body: "Get your ride sitting right today with flexible financing options that fit your budget.",
    icon: "financing",
    href: "/#financing",
  },
  {
    title: "100% Fitment Guarantee",
    body: "Our proprietary fitment database ensures what you buy fits your specific year and model perfectly.",
    icon: "fitment",
    href: "/#vehicle-finder",
  },
] as const;

export const testimonials = [
  {
    name: "Marcus R.",
    purchase: "Purchased: 100 Spoke Chrome Knocker-Off Set",
    quote:
      "The fitment on my '64 was spot on. Nobody knows wire wheels like Sky Tire. Shipping was faster than expected and the quality is next level.",
    image: `${IMG}/avatar-marcus.png`,
  },
  {
    name: "Diego L.",
    purchase: "Purchased: Vogue Tyre & Wire Wheel Package",
    quote:
      "Ordered a complete package and it arrived mounted and balanced. Bolted straight on. The whitewalls make the whole car.",
    image: `${IMG}/avatar-marcus.png`,
  },
  {
    name: "Andre W.",
    purchase: "Purchased: Custom Gold-Finish Zenith Wire Wheels",
    quote:
      "Called with questions and actually spoke to someone who knew lowriders. That alone earned my business.",
    image: `${IMG}/avatar-marcus.png`,
  },
] as const;

export const tireShowcaseProducts = [
  {
    name: "Venom Power Grand AM 175/70R13 82H 25MM 0.984\"",
    image: `${IMG}/tire-venom-175.png`,
    price: 125,
    rating: 5,
    reviews: 342,
    stock: 1,
  },
  {
    name: "Venom Power Grand AM 155/80R13 79S 20MM 0.787\"",
    image: `${IMG}/tire-venom-155.png`,
    price: 109.5,
    rating: 5,
    reviews: 156,
    stock: 1,
  },
  {
    name: "Gripmax MaxGrip Classic G/T 155/80R13 79S 35MM",
    image: `${IMG}/tire-gripmax.png`,
    price: 101.99,
    rating: 5,
    reviews: 89,
    stock: 1,
  },
  {
    name: "Vitour Galaxy F1 155/80R13 79T Original White Side",
    image: `${IMG}/tire-vitour.png`,
    price: 105,
    rating: 4,
    reviews: 112,
    stock: 0,
  },
  {
    name: "Lionhart LH-101",
    image: `${IMG}/tire-lionhart.png`,
    price: 84.99,
    rating: 5,
    reviews: 124,
    stock: 1,
  },
  {
    name: "Michelin Defender",
    image: `${IMG}/tire-michelin.png`,
    price: 142,
    rating: 5,
    reviews: 89,
    stock: 1,
  },
  {
    name: "Bridgestone Turanza",
    image: `${IMG}/tire-bridgestone.png`,
    price: 118.5,
    rating: 5,
    reviews: 56,
    stock: 1,
  },
  {
    name: "Goodyear Assurance",
    image: `${IMG}/tire-goodyear.png`,
    price: 105.99,
    rating: 4.5,
    reviews: 203,
    stock: 1,
  },
] as const;

export const cultureTags = ["#LowriderStyle", "#StreetKings", "#SkyTireBuilds"] as const;

export const cultureColumns = [
  [
    {
      src: `${IMG}/culture-1.png`,
      alt: "Black vintage Cadillac grille",
      shop: true,
      aspect: "aspect-square",
    },
    {
      src: `${IMG}/culture-2.png`,
      alt: "Chrome custom wheel close-up",
      aspect: "aspect-[294/320]",
    },
  ],
  [
    {
      src: `${IMG}/culture-3.png`,
      alt: "Blue Impala on a city street",
      shop: true,
      featured: true,
      aspect: "aspect-square",
    },
    {
      src: `${IMG}/culture-4.png`,
      alt: "Red classic car in front of a graffiti mural",
      aspect: "aspect-[294/452]",
    },
  ],
  [
    {
      src: `${IMG}/culture-5.png`,
      alt: "Wheels catching sunset on a city street",
      aspect: "aspect-square",
    },
    {
      src: `${IMG}/culture-6.png`,
      alt: "Classic car interior with blue tufted seats",
      shop: true,
      aspect: "aspect-[294/322]",
    },
  ],
  [
    {
      src: `${IMG}/culture-7.png`,
      alt: "Classic cars at a night meet under neon",
      aspect: "aspect-square",
    },
    {
      src: `${IMG}/culture-8.png`,
      alt: "White classic Chevrolet at golden hour",
      aspect: "aspect-[294/402]",
    },
  ],
] as const;

export const footerColumns = [
  {
    title: "Shop",
    links: [
      { label: "Wire Wheels", href: "/wire-wheels" },
      { label: "Bolt-On Wire Wheels", href: "/bolt-on-wire-wheels" },
      { label: "Whitewall Tires", href: "/products?sidewall=WHITE_WALL" },
      { label: "Blackwall Tires", href: "/products?sidewall=BLACK_WALL" },
      { label: "Wheels", href: "/wheels" },
      { label: "Lowrider Accessories", href: "/accessories" },
      { label: "Wheel & Tire Packages", href: "/products" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Fitment Help", href: "/#vehicle-finder" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "FAQs", href: "/faqs" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Brands", href: "/brands" },
      { label: "Shop", href: "/products" },
      { label: "Shipping", href: "/shipping" },
      { label: "Warranty Claims", href: "/warranty" },
      { label: "Help & FAQs", href: "/faqs" },
    ],
  },
] as const;

export const legalLinks = [
  { label: "Terms and Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Shipping Policy", href: "/shipping" },
  { label: "Contact Us", href: "/contact" },
] as const;

export const socialLinks = [
  { name: "Instagram", href: "https://www.instagram.com/", icon: "instagram" },
  { name: "Facebook", href: "https://www.facebook.com/", icon: "facebook" },
  { name: "Help", href: "/faqs", icon: "help" },
  { name: "YouTube", href: "https://www.youtube.com/", icon: "youtube" },
  { name: "TikTok", href: "https://www.tiktok.com/", icon: "tiktok" },
  { name: "Pinterest", href: "https://www.pinterest.com/", icon: "pinterest" },
] as const;
