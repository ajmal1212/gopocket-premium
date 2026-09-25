import type { StockFilters } from "@/lib/contracts";

/**
 * The /stocks landing pages - one per sector, industry and market-cap band -
 * each an indexable page for a search people actually make: "banking stocks",
 * "pharma stocks", "large cap stocks".
 *
 * `value` is the Contract Master option, exactly as stored (see
 * stock-list-data.ts). `name` is the phrase people search for, which is often
 * not the classification's own label - nobody searches "Ferrous Metals stocks",
 * they search "steel stocks" - and it is what the page's title and h1 carry.
 * `about` is the page's hand-written opening; the figures around it (how many
 * stocks, the largest ones) come from live data on each render.
 *
 * Every industry sits in exactly one sector; `sector` records which (from the
 * NSE classification Contract Master follows). An industry that is its sector's
 * only one - Construction, Power, Realty and a few more - gets no page of its
 * own: it would list the same stocks as the sector page under a second address.
 * Its links point at the sector page instead (see categoryForIndustry).
 */

export type CategoryKind = "sector" | "industry" | "market-cap";

export interface StockCategory {
  kind: CategoryKind;
  value: string;
  slug: string;
  name: string;
  about: string;
  /** An industry's sector, as its Contract Master value. */
  sector?: string;
}

type Entry = Omit<StockCategory, "kind">;

const SECTORS: Entry[] = [
  {
    value: "Automobile and Auto Components",
    slug: "automobile",
    name: "Auto Stocks",
    about:
      "Auto stocks cover the carmakers, two-wheeler, tractor and commercial vehicle manufacturers, and the component makers that supply them. The sector tends to track consumer demand, rural incomes, fuel prices and the move to electric vehicles.",
  },
  {
    value: "Capital Goods",
    slug: "capital-goods",
    name: "Capital Goods Stocks",
    about:
      "Capital goods companies make the machinery, electrical equipment, defence hardware and industrial products that other businesses invest in. Their order books usually follow government infrastructure spending and private capital expenditure.",
  },
  {
    value: "Chemicals",
    slug: "chemicals",
    name: "Chemical Stocks",
    about:
      "Chemical stocks include specialty and commodity chemical makers, petrochemical producers, and fertiliser and agrochemical companies. Demand comes from agriculture, pharmaceuticals, textiles, paints and exports.",
  },
  {
    value: "Construction",
    slug: "construction",
    name: "Construction Stocks",
    about:
      "Construction stocks are the engineering, procurement and construction (EPC) companies that build roads, railways, bridges, metros, water projects and buildings. Their fortunes are closely tied to infrastructure spending and the size of their order books.",
  },
  {
    value: "Construction Materials",
    slug: "construction-materials",
    name: "Construction Material Stocks",
    about:
      "Construction material stocks are led by cement makers, alongside producers of other building materials. Demand follows housing, infrastructure and commercial construction activity.",
  },
  {
    value: "Consumer Durables",
    slug: "consumer-durables",
    name: "Consumer Durables Stocks",
    about:
      "Consumer durables companies make goods households buy to last - appliances, electronics, electrical products, furniture, footwear, jewellery and paints. They benefit when incomes rise and consumers upgrade.",
  },
  {
    value: "Consumer Services",
    slug: "consumer-services",
    name: "Consumer Services Stocks",
    about:
      "Consumer services stocks include retailers, hotels, restaurants, travel and leisure companies, and other businesses that sell services directly to consumers.",
  },
  {
    value: "Diversified",
    slug: "diversified",
    name: "Diversified Stocks",
    about:
      "Diversified companies run several unrelated businesses under one listed entity, so no single industry describes them.",
  },
  {
    value: "Fast Moving Consumer Goods",
    slug: "fmcg",
    name: "FMCG Stocks",
    about:
      "FMCG (fast moving consumer goods) stocks make everyday products - packaged food, beverages, personal care, household products and tobacco. Steady demand has traditionally made the sector a defensive part of the market.",
  },
  {
    value: "Financial Services",
    slug: "financial-services",
    name: "Financial Services Stocks",
    about:
      "Financial services is one of the largest sectors on NSE: banks, NBFCs and housing finance companies, insurers, brokers, asset managers, exchanges and fintech firms. It is closely linked to credit growth and interest rates.",
  },
  {
    value: "Forest Materials",
    slug: "forest-materials",
    name: "Paper & Forest Products Stocks",
    about: "Paper and forest product stocks are the makers of paper, paperboard, packaging material and jute products.",
  },
  {
    value: "Healthcare",
    slug: "healthcare",
    name: "Healthcare Stocks",
    about:
      "Healthcare stocks include pharmaceutical and biotechnology companies, hospital chains, diagnostic labs and medical equipment makers - from generic-drug exporters to domestic healthcare services.",
  },
  {
    value: "Information Technology",
    slug: "it",
    name: "IT Stocks",
    about:
      "IT stocks are India's software services, product and hardware companies. The large IT services firms earn much of their revenue from clients in the US and Europe, so the rupee and global technology spending matter to the sector.",
  },
  {
    value: "Media, Entertainment & Publication",
    slug: "media-entertainment",
    name: "Media & Entertainment Stocks",
    about:
      "Media and entertainment stocks cover broadcasters, film producers and exhibitors, music companies, digital media and publishers.",
  },
  {
    value: "Metals & Mining",
    slug: "metals-mining",
    name: "Metal Stocks",
    about:
      "Metal and mining stocks include steel makers, aluminium, copper and zinc producers, and mining companies. Their earnings tend to follow global commodity prices and demand from construction and manufacturing.",
  },
  {
    value: "Oil, Gas & Consumable Fuels",
    slug: "oil-gas",
    name: "Oil & Gas Stocks",
    about:
      "Oil and gas stocks span exploration and production, refining and fuel marketing, gas transmission and city gas distribution, and coal. Crude oil prices and government pricing policy weigh heavily on the sector.",
  },
  {
    value: "Power",
    slug: "power",
    name: "Power Stocks",
    about:
      "Power stocks are the companies that generate, transmit and distribute electricity - thermal, hydro, nuclear and renewable. The shift to solar and wind has brought a wave of new listings to the sector.",
  },
  {
    value: "Realty",
    slug: "realty",
    name: "Real Estate Stocks",
    about:
      "Real estate stocks are residential and commercial property developers. Home-loan rates, housing demand and approvals for new projects drive the sector.",
  },
  {
    value: "Services",
    slug: "services",
    name: "Services Stocks",
    about:
      "The services sector groups logistics and transport companies, ports and transport infrastructure, engineering services and a range of commercial and business services.",
  },
  {
    value: "Telecommunication",
    slug: "telecom",
    name: "Telecom Stocks",
    about:
      "Telecom stocks include mobile and broadband operators, tower companies and makers of telecom equipment and cables. Tariffs, subscriber growth and spectrum costs shape the sector.",
  },
  {
    value: "Textiles",
    slug: "textiles",
    name: "Textile Stocks",
    about:
      "Textile stocks run from yarn and fabric makers to garment and apparel brands - a sector with a large share of exports and a large share of employment in India.",
  },
  {
    value: "Utilities",
    slug: "utilities",
    name: "Utility Stocks",
    about:
      "Utility stocks provide essential services such as water supply and waste management, outside the power sector.",
  },
];

const INDUSTRIES: Entry[] = [
  // Automobile and Auto Components
  {
    value: "Auto Components",
    sector: "Automobile and Auto Components",
    slug: "auto-ancillary",
    name: "Auto Ancillary Stocks",
    about:
      "Auto ancillary companies make the parts that go into vehicles - engines and transmission parts, tyres, batteries, lighting, wiring and electronics - for carmakers and for the replacement market.",
  },
  {
    value: "Automobiles",
    sector: "Automobile and Auto Components",
    slug: "automobiles",
    name: "Automobile Stocks",
    about:
      "Automobile stocks are the vehicle makers themselves: passenger cars, two-wheelers and three-wheelers. Monthly sales numbers are the figures the market watches most closely.",
  },
  // Capital Goods
  {
    value: "Aerospace & Defense",
    sector: "Capital Goods",
    slug: "defence",
    name: "Defence Stocks",
    about:
      "Defence stocks build aircraft, ships, missiles, electronics and equipment for the armed forces. Government procurement and the push to make defence equipment in India drive their order books.",
  },
  {
    value: "Agricultural, Commercial & Construction Vehicles",
    sector: "Capital Goods",
    slug: "commercial-vehicles",
    name: "Commercial Vehicle Stocks",
    about:
      "These companies make trucks, buses, tractors and construction equipment - vehicles bought for work, so demand follows the economy, farm incomes and infrastructure activity.",
  },
  {
    value: "Electrical Equipment",
    sector: "Capital Goods",
    slug: "electrical-equipment",
    name: "Electrical Equipment Stocks",
    about:
      "Electrical equipment makers produce transformers, switchgear, cables, motors and power equipment used by utilities, industry and infrastructure projects.",
  },
  {
    value: "Industrial Manufacturing",
    sector: "Capital Goods",
    slug: "industrial-manufacturing",
    name: "Industrial Manufacturing Stocks",
    about:
      "Industrial manufacturing companies build heavy machinery, railway equipment, process plants and other engineered systems for industrial customers.",
  },
  {
    value: "Industrial Products",
    sector: "Capital Goods",
    slug: "industrial-products",
    name: "Industrial Products Stocks",
    about:
      "Industrial products companies make pipes, bearings, castings, compressors, pumps and other components that go into factories, construction and infrastructure.",
  },
  // Chemicals
  {
    value: "Chemicals & Petrochemicals",
    sector: "Chemicals",
    slug: "chemicals-petrochemicals",
    name: "Chemical & Petrochemical Stocks",
    about:
      "Specialty chemical, commodity chemical and petrochemical makers - supplying pharmaceuticals, agrochemicals, dyes, polymers, paints and many other industries.",
  },
  {
    value: "Fertilizers & Agrochemicals",
    sector: "Chemicals",
    slug: "fertilizers",
    name: "Fertilizer Stocks",
    about:
      "Fertiliser and agrochemical companies make urea, phosphatic fertilisers, pesticides and crop protection products. The monsoon and government fertiliser subsidies play a large part in their results.",
  },
  // Construction Materials
  {
    value: "Cement & Cement Products",
    sector: "Construction Materials",
    slug: "cement",
    name: "Cement Stocks",
    about:
      "Cement stocks are the producers of cement and cement products. Demand comes from housing, infrastructure and commercial construction, while fuel and freight are their biggest costs.",
  },
  {
    value: "Other Construction Materials",
    sector: "Construction Materials",
    slug: "other-construction-materials",
    name: "Building Material Stocks",
    about: "Makers of building materials other than cement - such as tiles, glass, boards and roofing products.",
  },
  // Consumer Services
  {
    value: "Leisure Services",
    sector: "Consumer Services",
    slug: "hotels-leisure",
    name: "Hotel & Leisure Stocks",
    about: "Hotel, restaurant, travel and leisure companies - businesses that do well when people travel and eat out.",
  },
  {
    value: "Other Consumer Services",
    sector: "Consumer Services",
    slug: "other-consumer-services",
    name: "Consumer Service Stocks",
    about:
      "Consumer-facing service businesses outside retail and leisure, such as education and other personal services.",
  },
  {
    value: "Retailing",
    sector: "Consumer Services",
    slug: "retail",
    name: "Retail Stocks",
    about:
      "Retail stocks include supermarket and department store chains, fashion and lifestyle retailers, and e-commerce companies.",
  },
  // Fast Moving Consumer Goods
  {
    value: "Agricultural Food & other Products",
    sector: "Fast Moving Consumer Goods",
    slug: "agri-food",
    name: "Agri & Food Commodity Stocks",
    about: "Producers of sugar, tea, coffee, edible oils, rice and other agricultural food products.",
  },
  {
    value: "Beverages",
    sector: "Fast Moving Consumer Goods",
    slug: "beverages",
    name: "Beverage Stocks",
    about: "Makers of soft drinks, packaged water, beer and spirits.",
  },
  {
    value: "Cigarettes & Tobacco Products",
    sector: "Fast Moving Consumer Goods",
    slug: "tobacco",
    name: "Tobacco Stocks",
    about: "Cigarette and tobacco product makers.",
  },
  {
    value: "Diversified FMCG",
    sector: "Fast Moving Consumer Goods",
    slug: "diversified-fmcg",
    name: "Diversified FMCG Stocks",
    about:
      "The largest FMCG companies, selling across food, personal care, home care and other everyday product categories.",
  },
  {
    value: "Food Products",
    sector: "Fast Moving Consumer Goods",
    slug: "food-products",
    name: "Food Processing Stocks",
    about: "Packaged and processed food makers - dairy, biscuits, snacks, noodles and other branded foods.",
  },
  {
    value: "Household Products",
    sector: "Fast Moving Consumer Goods",
    slug: "household-products",
    name: "Household Products Stocks",
    about: "Makers of detergents, cleaners, home care and other household consumables.",
  },
  {
    value: "Personal Products",
    sector: "Fast Moving Consumer Goods",
    slug: "personal-care",
    name: "Personal Care Stocks",
    about: "Makers of skin care, hair care, oral care, cosmetics and other personal care products.",
  },
  // Financial Services
  {
    value: "Banks",
    sector: "Financial Services",
    slug: "banks",
    name: "Banking Stocks",
    about:
      "Banking stocks include India's public sector banks, private sector banks and small finance banks. Loan growth, net interest margins and asset quality are the numbers investors follow most.",
  },
  {
    value: "Capital Markets",
    sector: "Financial Services",
    slug: "capital-markets",
    name: "Capital Market Stocks",
    about:
      "Stock brokers, asset management companies, stock exchanges, depositories, registrars and wealth managers - businesses that grow with market participation.",
  },
  {
    value: "Finance",
    sector: "Financial Services",
    slug: "nbfc",
    name: "NBFC Stocks",
    about:
      "Non-banking financial companies (NBFCs) and housing finance companies lend to individuals and businesses - vehicle loans, home loans, gold loans, microfinance and more.",
  },
  {
    value: "Financial Technology (Fintech)",
    sector: "Financial Services",
    slug: "fintech",
    name: "Fintech Stocks",
    about:
      "Technology-led financial companies in digital payments, online lending, insurance distribution and investing.",
  },
  {
    value: "Insurance",
    sector: "Financial Services",
    slug: "insurance",
    name: "Insurance Stocks",
    about: "Life insurers, general and health insurers, and reinsurers.",
  },
  // Healthcare
  {
    value: "Healthcare Equipment & Supplies",
    sector: "Healthcare",
    slug: "medical-equipment",
    name: "Medical Equipment Stocks",
    about: "Makers of medical devices, diagnostic equipment and healthcare supplies.",
  },
  {
    value: "Healthcare Services",
    sector: "Healthcare",
    slug: "hospitals",
    name: "Hospital & Healthcare Services Stocks",
    about: "Hospital chains, diagnostic laboratories and other healthcare service providers.",
  },
  {
    value: "Pharmaceuticals & Biotechnology",
    sector: "Healthcare",
    slug: "pharma",
    name: "Pharma Stocks",
    about:
      "Pharma stocks are drug makers - generics for India and export markets, active pharmaceutical ingredients (APIs), contract manufacturing and biotechnology.",
  },
  // Information Technology
  {
    value: "IT - Hardware",
    sector: "Information Technology",
    slug: "it-hardware",
    name: "IT Hardware Stocks",
    about: "Makers and distributors of computers, electronics and IT hardware.",
  },
  {
    value: "IT - Services",
    sector: "Information Technology",
    slug: "it-services",
    name: "IT Services Stocks",
    about: "IT services, consulting and outsourcing companies that build and run technology for clients.",
  },
  {
    value: "IT - Software",
    sector: "Information Technology",
    slug: "software",
    name: "Software Stocks",
    about: "Software companies - from India's largest IT exporters to product and platform businesses.",
  },
  // Media, Entertainment & Publication
  {
    value: "Entertainment",
    sector: "Media, Entertainment & Publication",
    slug: "entertainment",
    name: "Entertainment Stocks",
    about: "Film studios, cinema chains, broadcasters and music companies.",
  },
  {
    value: "Media",
    sector: "Media, Entertainment & Publication",
    slug: "media",
    name: "Media Stocks",
    about: "Television, digital and print media companies.",
  },
  {
    value: "Printing & Publication",
    sector: "Media, Entertainment & Publication",
    slug: "publishing",
    name: "Printing & Publishing Stocks",
    about: "Publishers and printing businesses.",
  },
  // Metals & Mining
  {
    value: "Diversified Metals",
    sector: "Metals & Mining",
    slug: "diversified-metals",
    name: "Diversified Metal Stocks",
    about: "Companies producing several metals - such as zinc, lead, aluminium, copper and silver - under one roof.",
  },
  {
    value: "Ferrous Metals",
    sector: "Metals & Mining",
    slug: "steel",
    name: "Steel Stocks",
    about:
      "Steel stocks are the iron and steel makers and ferro-alloy producers. Steel prices, iron ore and coking coal costs, and construction demand drive their earnings.",
  },
  {
    value: "Metals & Minerals Trading",
    sector: "Metals & Mining",
    slug: "metal-trading",
    name: "Metal Trading Stocks",
    about: "Companies that trade metals and minerals.",
  },
  {
    value: "Minerals & Mining",
    sector: "Metals & Mining",
    slug: "mining",
    name: "Mining Stocks",
    about: "Miners of iron ore, coal and other minerals.",
  },
  {
    value: "Non - Ferrous Metals",
    sector: "Metals & Mining",
    slug: "non-ferrous-metals",
    name: "Non-Ferrous Metal Stocks",
    about: "Aluminium, copper, zinc and other non-ferrous metal producers.",
  },
  // Oil, Gas & Consumable Fuels
  {
    value: "Consumable Fuels",
    sector: "Oil, Gas & Consumable Fuels",
    slug: "coal",
    name: "Coal Stocks",
    about: "Coal miners and suppliers of other consumable fuels.",
  },
  {
    value: "Gas",
    sector: "Oil, Gas & Consumable Fuels",
    slug: "gas",
    name: "Gas Stocks",
    about:
      "Gas transmission companies, LNG importers and city gas distributors supplying homes, vehicles and industry.",
  },
  {
    value: "Oil",
    sector: "Oil, Gas & Consumable Fuels",
    slug: "oil",
    name: "Oil Stocks",
    about: "Oil exploration and production companies and oilfield service providers.",
  },
  {
    value: "Petroleum Products",
    sector: "Oil, Gas & Consumable Fuels",
    slug: "refinery",
    name: "Refinery & Petroleum Stocks",
    about: "Oil refiners and fuel marketing companies, and makers of lubricants and other petroleum products.",
  },
  // Services
  {
    value: "Commercial Services & Supplies",
    sector: "Services",
    slug: "commercial-services",
    name: "Commercial Services Stocks",
    about: "Business services such as staffing, facility management, security and printing and stationery supplies.",
  },
  {
    value: "Engineering Services",
    sector: "Services",
    slug: "engineering-services",
    name: "Engineering Services Stocks",
    about: "Engineering design, consulting and technical service companies.",
  },
  {
    value: "Transport Infrastructure",
    sector: "Services",
    slug: "transport-infrastructure",
    name: "Transport Infrastructure Stocks",
    about: "Port, airport, road and toll operators - the owners of transport infrastructure.",
  },
  {
    value: "Transport Services",
    sector: "Services",
    slug: "logistics",
    name: "Logistics Stocks",
    about: "Logistics, shipping, airline, courier and freight companies that move goods and people.",
  },
  // Telecommunication
  {
    value: "Telecom -  Equipment & Accessories",
    sector: "Telecommunication",
    slug: "telecom-equipment",
    name: "Telecom Equipment Stocks",
    about: "Makers of telecom equipment, optical fibre, cables and network accessories.",
  },
  {
    value: "Telecom - Services",
    sector: "Telecommunication",
    slug: "telecom-services",
    name: "Telecom Services Stocks",
    about: "Mobile, broadband and enterprise telecom operators, and tower infrastructure companies.",
  },
  // Sole industries of their sector: listed so a stock's industry can be linked,
  // but served by the sector page (see categoryForIndustry).
  { value: "Construction", sector: "Construction", slug: "", name: "", about: "" },
  { value: "Consumer Durables", sector: "Consumer Durables", slug: "", name: "", about: "" },
  { value: "Diversified", sector: "Diversified", slug: "", name: "", about: "" },
  { value: "Paper, Forest & Jute Products", sector: "Forest Materials", slug: "", name: "", about: "" },
  { value: "Power", sector: "Power", slug: "", name: "", about: "" },
  { value: "Realty", sector: "Realty", slug: "", name: "", about: "" },
  { value: "Textiles & Apparels", sector: "Textiles", slug: "", name: "", about: "" },
  { value: "Other Utilities", sector: "Utilities", slug: "", name: "", about: "" },
];

const MARKET_CAPS: Entry[] = [
  {
    value: "Large cap",
    slug: "large-cap",
    name: "Large Cap Stocks",
    about:
      "Large cap stocks are India's biggest listed companies by market capitalisation - usually market leaders with established businesses, and less volatile than smaller companies. SEBI's mutual fund classification counts the 100 largest companies as large caps; the band here is assigned from market-cap data and reviewed periodically, so the count can differ a little.",
  },
  {
    value: "Mid cap",
    slug: "mid-cap",
    name: "Mid Cap Stocks",
    about:
      "Mid cap stocks sit between the large and small caps - in SEBI's mutual fund classification, the 101st to 250th companies by market capitalisation. Many are growing businesses that can offer more growth than large caps, with more ups and downs along the way. The band here is assigned from market-cap data, so the count can differ a little from SEBI's.",
  },
  {
    value: "Small cap",
    slug: "small-cap",
    name: "Small Cap Stocks",
    about:
      "Small cap stocks are companies ranked below the top 250 by market capitalisation. They include many young and niche businesses; their prices can rise and fall sharply, and trading volumes are often thinner.",
  },
  {
    value: "Micro cap",
    slug: "micro-cap",
    name: "Micro Cap Stocks",
    about:
      "Micro cap stocks are the smallest listed companies by market capitalisation. They carry the highest risk: prices can swing widely and some trade only in small volumes.",
  },
];

const withKind =
  (kind: CategoryKind) =>
  (entry: Entry): StockCategory => ({ kind, ...entry });

export const SECTOR_CATEGORIES = SECTORS.map(withKind("sector"));
/** Industries that have a page of their own; the sole industries of a sector are left out. */
export const INDUSTRY_CATEGORIES = INDUSTRIES.filter((entry) => entry.slug).map(withKind("industry"));
export const MARKET_CAP_CATEGORIES = MARKET_CAPS.map(withKind("market-cap"));

export const categoryHref = (category: StockCategory) => `/stocks/${category.kind}/${category.slug}`;

export function findCategory(kind: CategoryKind, slug: string): StockCategory | null {
  const list =
    kind === "sector" ? SECTOR_CATEGORIES : kind === "industry" ? INDUSTRY_CATEGORIES : MARKET_CAP_CATEGORIES;
  return list.find((category) => category.slug === slug) ?? null;
}

export const sectorCategory = (value: string) => SECTOR_CATEGORIES.find((category) => category.value === value) ?? null;

/** An industry's landing page - or, for a sector's only industry, the sector's. */
export function categoryForIndustry(value: string): StockCategory | null {
  const entry = INDUSTRIES.find((industry) => industry.value === value);
  if (!entry) return null;
  return entry.slug ? withKind("industry")(entry) : sectorCategory(entry.sector ?? "");
}

/** The industries of a sector that have pages of their own. */
export const industriesOf = (sector: string) => INDUSTRY_CATEGORIES.filter((category) => category.sector === sector);

/** The filters that list a category's stocks: NSE, largest first. */
export function filtersFor(category: StockCategory): StockFilters {
  return {
    exchange: "NSE",
    query: "",
    letter: "",
    sectors: category.kind === "sector" ? [category.value] : [],
    industries: category.kind === "industry" ? [category.value] : [],
    capBands: category.kind === "market-cap" ? [category.value] : [],
    sort: "mcap-desc",
  };
}

/** Every landing page's path, for the sitemap. */
export const allCategoryHrefs = () =>
  [...SECTOR_CATEGORIES, ...INDUSTRY_CATEGORIES, ...MARKET_CAP_CATEGORIES].map(categoryHref);
