/**
 * Long-form guides for the sector and market-cap landing pages, shown below the
 * stock table (StockGuide.astro). Written for someone new to the market: what
 * the companies do, what moves their shares, which numbers to read and what can
 * go wrong - each term explained where it first appears.
 *
 * Kept evergreen on purpose: no prices, targets, rankings or dated figures,
 * which go stale and would contradict the live numbers above the table. And no
 * recommendations - GoPocket is a SEBI-registered stock broker, not a research
 * analyst, so nothing here says which stock to buy. "Top" on these pages only
 * ever means largest by market capitalisation.
 *
 * Keyed by the landing page's path segment, `${kind}/${slug}` (see
 * stock-categories.ts). A page with no entry simply shows no guide.
 */

export interface GuidePoint {
  term: string;
  detail: string;
}

export interface GuideSection {
  heading: string;
  paragraphs?: string[];
  points?: GuidePoint[];
}

export interface StockGuide {
  sections: GuideSection[];
  faqs: { question: string; answer: string }[];
}

export const STOCK_GUIDES: Record<string, StockGuide> = {
  /* ======================================================================
     Sectors
     ====================================================================== */

  "sector/automobile": {
    sections: [
      {
        heading: "What are auto stocks?",
        paragraphs: [
          "Auto stocks are listed companies that make vehicles or the parts that go into them. The sector has two halves: the automobile makers (OEMs, or original equipment manufacturers) that build passenger cars, two-wheelers, three-wheelers, tractors and commercial vehicles, and the auto ancillary or auto component companies that supply them with engines, gears, tyres, batteries, lighting, seats and electronics.",
          "India is one of the world's largest markets for two-wheelers and passenger vehicles, so the sector is a direct window into how much households and businesses are spending. Component makers also sell to the replacement market and export to global carmakers, which gives many of them a steadier stream of revenue than the vehicle makers.",
        ],
      },
      {
        heading: "What moves auto stocks",
        points: [
          {
            term: "Monthly sales",
            detail:
              "Vehicle makers report the number of units they sold every month, usually on the first day of the next month. These numbers move the shares more than almost anything else between quarterly results.",
          },
          {
            term: "Consumer demand and rural incomes",
            detail:
              "Two-wheeler and tractor sales depend heavily on rural India, so a good monsoon and higher farm incomes tend to lift them. Car sales follow urban incomes, consumer confidence and new model launches.",
          },
          {
            term: "Interest rates",
            detail:
              "Most vehicles are bought on loans. When interest rates fall, EMIs get cheaper and demand usually improves; when they rise, the opposite happens.",
          },
          {
            term: "Raw material costs",
            detail:
              "Steel, aluminium, rubber and precious metals are big costs. When commodity prices rise faster than companies can raise vehicle prices, profit margins shrink.",
          },
          {
            term: "Electric vehicles and regulation",
            detail:
              "Emission norms such as BS-VI, safety rules and the shift to electric vehicles change what companies have to spend on and which products sell. Government incentives, including production-linked incentive (PLI) schemes, also shape the sector.",
          },
        ],
      },
      {
        heading: "What to check before investing in auto stocks",
        points: [
          {
            term: "Volume growth and market share",
            detail:
              "Is the company selling more units than last year, and is it gaining or losing share against rivals in its segments?",
          },
          {
            term: "EBITDA margin",
            detail:
              "EBITDA is earnings before interest, tax, depreciation and amortisation - a measure of operating profit. The margin (EBITDA divided by revenue) shows how well the company handles cost pressure.",
          },
          {
            term: "Product mix",
            detail:
              "Premium models, SUVs and exports usually earn more per vehicle than entry-level models. A shift in mix can raise profits even when volumes are flat.",
          },
          {
            term: "Customer concentration (for component makers)",
            detail:
              "A component maker that depends on one or two vehicle makers for most of its sales is exposed to their fortunes. A broad customer base, replacement sales and exports spread that risk.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "The auto sector is cyclical: sales rise and fall with the economy, so earnings can swing sharply from one year to the next. A company that is slow to adapt to electric vehicles can lose share, while one that invests heavily too early can burn cash. Supply problems - such as the semiconductor shortage that held back vehicle production after 2020 - can hit output even when demand is strong.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the difference between auto and auto ancillary stocks?",
        answer:
          "Auto stocks usually refers to the vehicle makers themselves - companies that sell cars, two-wheelers, tractors and commercial vehicles. Auto ancillary (or auto component) stocks are the suppliers that make parts for those vehicles, and often also sell to the replacement market and export.",
      },
      {
        question: "Why do auto stocks move at the start of every month?",
        answer:
          "Vehicle makers publish their unit sales for the previous month at the start of each month. Because these figures are the most frequent signal of demand, the market reacts to them between quarterly results.",
      },
    ],
  },

  "sector/capital-goods": {
    sections: [
      {
        heading: "What are capital goods stocks?",
        paragraphs: [
          "Capital goods are the machines and equipment that businesses and governments buy to produce other goods and services - power equipment, transformers, cables, pumps, compressors, bearings, railway equipment, defence hardware and heavy machinery. Capital goods stocks are the listed companies that make them.",
          "Because their customers are building factories, power plants, railways and defence capability, these companies are a play on investment in the economy - what economists call capital expenditure, or capex. When the government and private companies spend on new capacity, capital goods makers win orders.",
        ],
      },
      {
        heading: "What moves capital goods stocks",
        points: [
          {
            term: "Government capex",
            detail:
              "Spending on railways, roads, power transmission, defence and urban infrastructure is announced in the Union Budget and flows into orders for these companies.",
          },
          {
            term: "Private capex cycle",
            detail:
              "When industries run close to full capacity, they build new plants and buy equipment. That cycle can take years to turn, and capital goods stocks tend to move ahead of it.",
          },
          {
            term: "Order inflow",
            detail:
              "New orders won in a quarter are a leading indicator of future revenue. Large order announcements often move these shares on the day they are disclosed.",
          },
          {
            term: "Defence indigenisation",
            detail:
              "The government's push to make defence equipment in India, including lists of items that can only be bought from domestic suppliers, has become a major source of orders for defence manufacturers.",
          },
        ],
      },
      {
        heading: "What to check before investing in capital goods stocks",
        points: [
          {
            term: "Order book",
            detail:
              "The value of orders won but not yet delivered. Divide it by annual revenue to get the book-to-bill ratio: a ratio of 3 means roughly three years of work already in hand.",
          },
          {
            term: "Execution",
            detail:
              "A large order book only turns into profit if the company delivers on time. Compare revenue growth with the order book to see whether execution is keeping up.",
          },
          {
            term: "Working capital",
            detail:
              "Capital goods companies often wait months to be paid, especially by government customers. Rising receivables and inventory tie up cash; watch operating cash flow, not just profit.",
          },
          {
            term: "Margins on fixed-price orders",
            detail:
              "When an order's price is fixed but the cost of steel, copper or components rises during execution, margins fall. Price-variation clauses protect some contracts but not all.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Capital goods is a cyclical sector. When investment slows, order inflow dries up and the stocks can fall sharply - and because these shares often trade at high valuations when the cycle is strong, the fall can be steep. Delays in government payments, cost overruns and project cancellations are the other common risks.",
        ],
      },
    ],
    faqs: [
      {
        question: "What does order book mean for capital goods stocks?",
        answer:
          "The order book is the total value of orders a company has won but not yet delivered. It shows how much revenue is already lined up; dividing it by annual revenue tells you roughly how many years of work the company has in hand.",
      },
      {
        question: "Are defence stocks part of the capital goods sector?",
        answer:
          "Yes. In the NSE classification used on this page, aerospace and defence companies sit within the capital goods sector, alongside electrical equipment, industrial products and industrial manufacturing companies.",
      },
    ],
  },

  "sector/chemicals": {
    sections: [
      {
        heading: "What are chemical stocks?",
        paragraphs: [
          "Chemical stocks are companies that make the chemicals other industries depend on. The sector ranges from commodity chemicals - soda ash, caustic soda, basic petrochemicals, made in large volumes and sold mainly on price - to specialty chemicals, which are made for a specific use such as pharmaceutical intermediates, agrochemicals, dyes, flavours, fragrances or polymer additives.",
          "The sector also includes fertiliser and agrochemical companies, which make urea, phosphatic fertilisers, pesticides and other crop protection products. Their fortunes follow Indian agriculture rather than industry.",
        ],
      },
      {
        heading: "What moves chemical stocks",
        points: [
          {
            term: "Global demand and China",
            detail:
              "China is the world's largest chemical producer. When Chinese supply is disrupted or buyers look for alternatives - the 'China plus one' trend - Indian manufacturers win business; when Chinese producers cut prices, Indian margins suffer.",
          },
          {
            term: "Raw material prices",
            detail:
              "Many chemicals are made from crude oil derivatives. Swings in crude and feedstock prices change costs quickly, and not every company can pass them on.",
          },
          {
            term: "Export markets",
            detail:
              "A large share of specialty chemical revenue comes from exports to the US, Europe and Japan, so global inventory cycles and the rupee both matter.",
          },
          {
            term: "The monsoon (for agrochemicals and fertilisers)",
            detail:
              "Crop protection and fertiliser demand follow the sowing season. A weak or late monsoon lowers demand; government fertiliser subsidies affect how and when fertiliser companies are paid.",
          },
        ],
      },
      {
        heading: "What to check before investing in chemical stocks",
        points: [
          {
            term: "Specialty vs commodity mix",
            detail:
              "Specialty products usually earn higher and steadier margins than commodities because customers value quality and approvals over price.",
          },
          {
            term: "Capacity utilisation",
            detail:
              "How much of its plant capacity a company is actually using. New plants only add to profit once they run near full capacity.",
          },
          {
            term: "Customer approvals and contracts",
            detail:
              "In specialty chemicals, getting approved by a global customer takes years. Long-term supply contracts make revenue more predictable.",
          },
          {
            term: "Return on capital employed (ROCE)",
            detail:
              "Profit before interest and tax divided by the capital used in the business. It shows how efficiently a capital-heavy chemical company turns investment into profit.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Chemical prices can fall quickly when global supply outruns demand, and heavy expansion across the industry can lead to years of weak pricing. Plants face strict environmental rules - a pollution-related shutdown or a fire can halt production. Heavy reliance on a single product or customer is another risk to look for.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the difference between specialty and commodity chemicals?",
        answer:
          "Commodity chemicals are made in large volumes to a standard specification and sold mainly on price. Specialty chemicals are made for a particular use and customer, sell in smaller volumes, and usually earn higher margins because customers value performance, quality and approvals.",
      },
      {
        question: "What is China plus one in chemicals?",
        answer:
          "It refers to global buyers adding suppliers outside China to reduce their dependence on a single country. Indian chemical manufacturers have been among the beneficiaries.",
      },
    ],
  },

  "sector/construction": {
    sections: [
      {
        heading: "What are construction stocks?",
        paragraphs: [
          "Construction stocks are companies that build infrastructure and buildings - roads and highways, railways and metros, bridges, airports, water supply and irrigation projects, power transmission lines, and commercial and industrial buildings. Most are EPC companies: they handle the engineering, procurement and construction of a project for a client, who is very often a government body.",
          "Some construction companies also own and operate the assets they build, such as toll roads, under public-private partnership models like BOT (build-operate-transfer) and HAM (hybrid annuity model). These bring steady income later but need more money up front.",
          "Because most of the work comes from public spending, construction stocks are one of the most direct ways to track India's infrastructure build-out.",
        ],
      },
      {
        heading: "What moves construction stocks",
        points: [
          {
            term: "Government infrastructure spending",
            detail:
              "The capital expenditure set out in the Union Budget and state budgets decides how many projects are tendered. Higher allocations to roads, railways and water translate into orders.",
          },
          {
            term: "Order wins",
            detail:
              "Winning a large project is announced to the exchanges and can move the share price on the day. A steady flow of new orders keeps revenue growing.",
          },
          {
            term: "Interest rates and commodity prices",
            detail:
              "Construction companies borrow to fund working capital and pay for steel, cement and bitumen. Higher rates and material costs squeeze margins, especially on fixed-price contracts.",
          },
          {
            term: "Elections and approvals",
            detail:
              "Project awards often slow in the months around general and state elections, and land acquisition or environmental clearances can delay execution.",
          },
        ],
      },
      {
        heading: "What to check before investing in construction stocks",
        points: [
          {
            term: "Order book to revenue ratio",
            detail:
              "The order book is the value of contracts won but not yet executed. Divided by last year's revenue, it shows how many years of work are already secured - a ratio of 3 means about three years.",
          },
          {
            term: "Execution track record",
            detail:
              "Is revenue growing in line with the order book? Companies that finish projects on time get paid sooner and win bonuses; delays lead to penalties and cost overruns.",
          },
          {
            term: "Working capital and receivables",
            detail:
              "Government clients can take a long time to pay. Check how many days of revenue are stuck in receivables and whether operating cash flow is positive.",
          },
          {
            term: "Debt",
            detail:
              "High debt makes a construction company vulnerable if payments are delayed. The debt-to-equity ratio and interest cover (operating profit divided by interest cost) are simple checks.",
          },
          {
            term: "Client and segment mix",
            detail:
              "A company spread across roads, railways, water and buildings is less exposed to a slowdown in any one segment than a pure highway contractor.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Construction earnings are lumpy and depend on a few large projects. A slowdown in government ordering, delayed payments, disputes with clients, or a sharp rise in steel and cement prices can all hurt profits. Smaller construction companies in particular can run into cash-flow trouble when several projects are delayed at once.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is an EPC company?",
        answer:
          "EPC stands for engineering, procurement and construction. An EPC company designs a project, buys the materials and equipment, and builds it for a client - typically for a fixed price and deadline.",
      },
      {
        question: "Why does the order book matter for construction stocks?",
        answer:
          "It is the value of work the company has already won. A healthy order book - often two to four times annual revenue - gives visibility of future revenue, but only if the company can execute it profitably and get paid on time.",
      },
      {
        question: "Are construction and infrastructure stocks the same?",
        answer:
          "They overlap. Construction stocks build infrastructure, while the term infrastructure stocks is often used more widely to include companies that own or operate assets such as ports, airports, power grids and toll roads, and the suppliers of cement, steel and equipment.",
      },
    ],
  },

  "sector/construction-materials": {
    sections: [
      {
        heading: "What are construction material stocks?",
        paragraphs: [
          "Construction material stocks are the companies that make what buildings and infrastructure are built from. Cement makers are by far the largest group; the sector also includes producers of other building materials such as tiles, glass, boards and roofing products.",
          "India is the world's second-largest cement producer, and demand comes from housing, roads, railways, urban infrastructure and commercial buildings. Because cement is heavy and cheap relative to its weight, it is usually sold within a few hundred kilometres of the plant - so companies compete region by region.",
        ],
      },
      {
        heading: "What moves construction material stocks",
        points: [
          {
            term: "Construction activity",
            detail:
              "Government infrastructure spending and housing demand drive cement volumes. Volumes typically dip during the monsoon, when construction slows.",
          },
          {
            term: "Cement prices",
            detail:
              "Prices vary by region and season. When demand is strong or companies hold back supply, prices rise; when new capacity floods a region, they fall.",
          },
          {
            term: "Fuel and freight costs",
            detail:
              "Coal and pet coke fuel the kilns, and diesel and rail freight carry the product. Energy and logistics are the largest costs, so swings in fuel prices hit margins directly.",
          },
          {
            term: "Consolidation",
            detail:
              "Large cement groups have been acquiring smaller players. Mergers change the competitive balance in a region and can support prices.",
          },
        ],
      },
      {
        heading: "What to check before investing in cement stocks",
        points: [
          {
            term: "EBITDA per tonne",
            detail:
              "The industry's favourite profitability measure: operating profit divided by tonnes sold. It lets you compare companies of different sizes.",
          },
          {
            term: "Capacity and utilisation",
            detail:
              "Installed capacity in million tonnes per annum (MTPA) and how much of it is used. Higher utilisation spreads fixed costs and lifts profit.",
          },
          {
            term: "Regional presence",
            detail:
              "A company concentrated in one region is exposed to price wars there; a national footprint spreads that risk.",
          },
          {
            term: "Cost efficiency",
            detail:
              "Plants close to limestone and coal, captive power and waste-heat recovery, and a higher share of green energy all lower the cost per tonne.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "When the industry adds capacity faster than demand grows, cement prices fall and margins shrink. A spike in coal or pet coke prices, a weak monsoon year or a slowdown in government projects can also hurt. Expansion is capital-intensive, so check that growth is not being funded by too much debt.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why is EBITDA per tonne used for cement stocks?",
        answer:
          "Cement is a volume business, so dividing operating profit (EBITDA) by the tonnes sold makes companies of very different sizes comparable and shows how efficiently each produces and sells.",
      },
      {
        question: "Why do cement volumes fall during the monsoon?",
        answer:
          "Heavy rain slows construction work across much of India, so demand for cement usually dips between June and September and picks up after the monsoon.",
      },
    ],
  },

  "sector/consumer-durables": {
    sections: [
      {
        heading: "What are consumer durables stocks?",
        paragraphs: [
          "Consumer durables are products households buy to use for years rather than days: air conditioners, refrigerators, washing machines, televisions, fans, lights, wires and switches, kitchen appliances, furniture, footwear, watches, jewellery and paints. Consumer durables stocks are the companies that make or sell them.",
          "The sector is a bet on rising incomes and aspirations. As more homes are built and incomes grow, families buy their first appliances and later upgrade to better ones - a trend the industry calls premiumisation.",
        ],
      },
      {
        heading: "What moves consumer durables stocks",
        points: [
          {
            term: "Seasons",
            detail:
              "Cooling products sell mostly in summer, and many categories peak during the festive and wedding seasons. A mild summer can hurt an air-conditioner maker's whole year.",
          },
          {
            term: "Disposable income and credit",
            detail:
              "Purchases are often financed with easy EMIs. Income growth, job security and consumer credit availability drive demand.",
          },
          {
            term: "Housing",
            detail:
              "New homes need wires, switches, fans, lights, paint and appliances, so real estate activity feeds demand.",
          },
          {
            term: "Input costs and imports",
            detail:
              "Copper, aluminium, steel and plastics are major costs, and many components are imported. Commodity prices and the rupee affect margins; production-linked incentives aim to make more of these components in India.",
          },
        ],
      },
      {
        heading: "What to check before investing in consumer durables stocks",
        points: [
          {
            term: "Brand strength and pricing power",
            detail: "Can the company raise prices when costs rise without losing customers? Strong brands usually can.",
          },
          {
            term: "Distribution reach",
            detail:
              "The number of dealers and outlets, and the company's presence in smaller towns, where much of future growth lies.",
          },
          {
            term: "Gross margin",
            detail:
              "Revenue minus the cost of materials, as a share of revenue. It shows how well the company absorbs commodity swings.",
          },
          {
            term: "Inventory",
            detail:
              "Seasonal businesses build stock ahead of peak demand. If the season disappoints, unsold inventory leads to discounting.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Consumer durables are discretionary purchases - people postpone them when times are tight - so sales slow in a weak economy. Competition is intense, including from imported and online-only brands, and a sharp rise in copper or aluminium prices can squeeze margins before price increases catch up.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the difference between FMCG and consumer durables?",
        answer:
          "FMCG products - food, soap, toothpaste - are used up quickly and bought again and again. Consumer durables - appliances, electronics, furniture - last for years, so they are bought less often and demand is more sensitive to the economy.",
      },
      {
        question: "What does premiumisation mean?",
        answer:
          "It is the shift of customers towards more expensive, feature-rich versions of a product as their incomes rise - for example, from a basic fan to a designer or energy-efficient one. It usually improves a company's margins.",
      },
    ],
  },

  "sector/consumer-services": {
    sections: [
      {
        heading: "What are consumer services stocks?",
        paragraphs: [
          "Consumer services stocks sell services and experiences directly to consumers: retail chains and e-commerce platforms, hotels and resorts, restaurant chains and quick-service restaurants, travel companies, and education and other personal services.",
          "These businesses grow as more people move to cities, earn more and spend on convenience, travel and eating out. Many are relatively young listed companies, some still investing heavily for growth.",
        ],
      },
      {
        heading: "What moves consumer services stocks",
        points: [
          {
            term: "Discretionary spending",
            detail:
              "Travel, eating out and shopping are among the first things people cut back on in a downturn and the first they spend more on when incomes rise.",
          },
          {
            term: "Store and room additions",
            detail:
              "Retailers and restaurant chains grow by opening new outlets; hotel companies by adding rooms, often through management contracts that need little capital.",
          },
          {
            term: "Travel demand",
            detail: "Business travel, tourism, weddings and events drive hotel occupancy and room rates.",
          },
          {
            term: "Competition from online and quick commerce",
            detail:
              "E-commerce and fast-delivery apps are changing how people shop and order food, helping some companies and pressuring others.",
          },
        ],
      },
      {
        heading: "What to check before investing in consumer services stocks",
        points: [
          {
            term: "Same-store sales growth (SSSG)",
            detail:
              "Sales growth from outlets that have been open for more than a year. It separates real demand growth from growth that comes only from opening new stores.",
          },
          {
            term: "Occupancy, ARR and RevPAR (for hotels)",
            detail:
              "Occupancy is the share of rooms filled; ARR is the average room rate; RevPAR (revenue per available room) combines the two.",
          },
          {
            term: "Unit economics",
            detail:
              "How long a new store or restaurant takes to break even and pay back its investment. Fast payback allows faster, self-funded expansion.",
          },
          {
            term: "Profitability and cash burn",
            detail:
              "Some newer consumer companies are still loss-making. Check whether losses are narrowing and how much cash they have left.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Consumer services depend on people choosing to spend, so they are hit hard by economic slowdowns and, as the pandemic showed, by anything that stops people travelling or going out. High valuations are common for fast-growing consumer companies, which can make the shares volatile if growth slows.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is same-store sales growth?",
        answer:
          "It measures the sales growth of stores or restaurants that were already open a year earlier, leaving out new openings. It shows whether existing outlets are attracting more customers and spending.",
      },
      {
        question: "What is RevPAR in hotel stocks?",
        answer:
          "RevPAR is revenue per available room: the average room rate multiplied by the occupancy rate. It is the standard measure of how well a hotel is performing.",
      },
    ],
  },

  "sector/diversified": {
    sections: [
      {
        heading: "What are diversified stocks?",
        paragraphs: [
          "Diversified companies - often called conglomerates - run several unrelated businesses inside one listed company. One company might, for example, make textiles, chemicals and cement, or combine manufacturing with financial services. Because no single industry describes them, the NSE classifies them as diversified.",
          "Many of India's oldest business groups started this way, although several have since separated their businesses into individually listed companies.",
        ],
      },
      {
        heading: "How to look at a diversified company",
        points: [
          {
            term: "Sum of the parts (SOTP)",
            detail:
              "Analysts value each business separately - as if it were a standalone company in its own industry - and add the values together.",
          },
          {
            term: "Conglomerate discount",
            detail:
              "The market often values a diversified company at less than the sum of its parts, because investors cannot choose which businesses to own and capital can flow from strong divisions to weak ones.",
          },
          {
            term: "Segment reporting",
            detail:
              "Listed companies report revenue and profit by business segment. Reading these shows which divisions are growing and which are dragging.",
          },
          {
            term: "Demergers",
            detail:
              "When a conglomerate splits a division into a separately listed company, shareholders receive shares of the new company. Demergers can unlock value that the conglomerate discount was hiding.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "A diversified company can be harder to understand and value, and weak divisions can hide inside strong ones. Check how capital is allocated between businesses and how the group treats minority shareholders when it moves money between divisions.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is a conglomerate discount?",
        answer:
          "It is the gap between a diversified company's market value and the combined value its separate businesses would have if they were listed individually. Investors often apply it because they cannot pick the businesses they want and worry about capital being moved between them.",
      },
    ],
  },

  "sector/fmcg": {
    sections: [
      {
        heading: "What are FMCG stocks?",
        paragraphs: [
          "FMCG stands for fast moving consumer goods - everyday products that are used up quickly and bought again and again: packaged food, biscuits, dairy, beverages, soaps, shampoos, toothpaste, detergents, cooking oil, tea and tobacco. FMCG stocks are the companies that make and sell them.",
          "Because people keep buying these products whether the economy is booming or slowing, FMCG has traditionally been seen as a defensive sector - one that holds up better than most in a downturn. The largest FMCG companies own brands found in almost every Indian household and sell through millions of small shops.",
        ],
      },
      {
        heading: "What moves FMCG stocks",
        points: [
          {
            term: "Volume growth",
            detail:
              "How many more units the company sold, as distinct from growth that comes only from raising prices. The market watches volume growth closely because it shows real demand.",
          },
          {
            term: "Rural demand",
            detail:
              "A large share of FMCG sales comes from rural India, so the monsoon, crop prices and rural wages matter.",
          },
          {
            term: "Input costs",
            detail:
              "Palm oil, wheat, milk, sugar, cocoa and crude-linked packaging are major costs. When they rise, companies either raise prices or reduce pack sizes, and margins can dip in between.",
          },
          {
            term: "Competition",
            detail:
              "Regional brands, direct-to-consumer brands and quick-commerce apps compete for shelf space and shoppers.",
          },
        ],
      },
      {
        heading: "What to check before investing in FMCG stocks",
        points: [
          {
            term: "Brand strength",
            detail: "Leading brands can raise prices without losing customers - a sign of pricing power.",
          },
          {
            term: "Distribution reach",
            detail:
              "The number of outlets that stock the company's products, directly or through distributors, especially in villages and small towns.",
          },
          {
            term: "Gross and EBITDA margins",
            detail:
              "Gross margin shows how well the company handles raw material costs; EBITDA margin shows overall operating efficiency after advertising and overheads.",
          },
          {
            term: "Valuation",
            detail:
              "FMCG leaders often trade at a high price-to-earnings (P/E) ratio - the share price divided by earnings per share - because their earnings are steady. A high P/E means much good news is already in the price.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "FMCG growth is steady rather than fast, and high valuations can leave little room for disappointment. A sharp rise in commodity prices, a weak monsoon, slower rural demand or tough competition can hold back earnings. Tobacco companies also face regulatory and tax risk.",
        ],
      },
    ],
    faqs: [
      {
        question: "What does FMCG mean?",
        answer:
          "FMCG stands for fast moving consumer goods: everyday products that sell quickly at relatively low prices, such as packaged food, beverages, toiletries and household products.",
      },
      {
        question: "Why are FMCG stocks called defensive?",
        answer:
          "People keep buying essentials like food and soap even in a slowdown, so FMCG companies' sales and profits tend to be more stable than those of cyclical sectors such as autos or metals.",
      },
    ],
  },

  "sector/financial-services": {
    sections: [
      {
        heading: "What are financial services stocks?",
        paragraphs: [
          "Financial services is one of the largest sectors on the Indian stock market. It covers banks (public sector, private sector and small finance banks), non-banking financial companies (NBFCs) and housing finance companies, life, general and health insurers, and capital market businesses - stock brokers, asset management companies, stock exchanges and depositories - along with fintech companies.",
          "These businesses make money in different ways: banks and NBFCs earn the gap between the interest they charge on loans and the interest they pay on deposits and borrowings; insurers earn from premiums and from investing them; brokers and exchanges earn fees that grow with market activity. What they share is that they grow with the economy, credit and savings.",
        ],
      },
      {
        heading: "What moves financial services stocks",
        points: [
          {
            term: "Interest rates",
            detail:
              "The Reserve Bank of India's policy rate decisions change what lenders earn and pay, and how much people borrow.",
          },
          {
            term: "Credit growth",
            detail: "How fast loans are growing across the economy - to households, small businesses and companies.",
          },
          {
            term: "Asset quality",
            detail:
              "When borrowers stop repaying, lenders have to set money aside as provisions, which hits profit. The level of bad loans is watched closely.",
          },
          {
            term: "Regulation",
            detail:
              "Banks and NBFCs are regulated by the RBI, insurers by IRDAI, and brokers, exchanges and fund houses by SEBI. Rule changes can reshape profitability overnight.",
          },
          {
            term: "Market activity",
            detail:
              "For brokers, exchanges and asset managers, trading volumes and the flow of money into mutual funds drive revenue.",
          },
        ],
      },
      {
        heading: "What to check before investing in financial stocks",
        points: [
          {
            term: "Net interest margin (NIM)",
            detail:
              "The difference between interest earned on loans and interest paid on deposits and borrowings, as a percentage of assets. Higher NIM means more profitable lending.",
          },
          {
            term: "Gross and net NPA",
            detail:
              "Non-performing assets are loans on which repayments have stopped for 90 days or more. GNPA is the total; NNPA is what remains after provisions. Lower is better.",
          },
          {
            term: "CASA ratio (for banks)",
            detail:
              "The share of deposits held in current and savings accounts, which pay little or no interest. A high CASA ratio gives a bank cheaper funds.",
          },
          {
            term: "Return on assets (ROA) and return on equity (ROE)",
            detail:
              "Profit as a percentage of total assets and of shareholders' equity. Together they show how profitably a lender uses its balance sheet.",
          },
          {
            term: "Capital adequacy",
            detail:
              "The capital a lender holds against its risk-weighted loans. Adequate capital lets it keep growing without raising fresh money that would dilute shareholders.",
          },
          {
            term: "Price-to-book (P/B)",
            detail:
              "Lenders are usually valued on their book value (net worth) rather than earnings alone. P/B is the share price divided by book value per share.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "A lender's biggest risk is borrowers who don't repay - a wave of bad loans can wipe out years of profit, as India's banks experienced in the late 2010s. Rapid loan growth in risky segments, dependence on short-term borrowing (for NBFCs), and regulatory changes are other risks. Capital market businesses are exposed to falls in trading activity when markets turn quiet.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the difference between a bank and an NBFC?",
        answer:
          "Both lend money, but banks can accept current and savings account deposits from the public, which gives them cheaper funding. Most NBFCs cannot take such deposits and fund themselves through borrowings, so their cost of funds is usually higher. Both are regulated by the Reserve Bank of India.",
      },
      {
        question: "What are NPAs?",
        answer:
          "Non-performing assets are loans on which the borrower has not paid interest or principal for 90 days or more. They are the main measure of a lender's asset quality.",
      },
    ],
  },

  "sector/forest-materials": {
    sections: [
      {
        heading: "What are paper and forest product stocks?",
        paragraphs: [
          "Paper and forest product stocks are the companies that turn wood, bamboo, agricultural residue, recycled paper and jute into writing and printing paper, paperboard, packaging material, tissue and jute products.",
          "Demand has been shifting: writing and printing paper faces competition from digital media, while packaging - for FMCG, pharmaceuticals and e-commerce deliveries - has been growing, helped by moves away from single-use plastic.",
        ],
      },
      {
        heading: "What moves paper stocks",
        points: [
          {
            term: "Pulp and raw material prices",
            detail: "The cost of wood, pulp and recycled fibre - partly imported - is the largest expense.",
          },
          {
            term: "Paper prices and imports",
            detail: "Cheaper imports can pull down domestic prices, while supply disruptions elsewhere can lift them.",
          },
          {
            term: "Packaging demand",
            detail: "Growth in packaged goods and online shopping supports paperboard makers.",
          },
          {
            term: "Energy and environmental rules",
            detail: "Paper making uses a lot of energy and water, and mills must meet pollution control norms.",
          },
        ],
      },
      {
        heading: "What to check before investing in paper stocks",
        points: [
          {
            term: "Product mix",
            detail:
              "Packaging board and specialty papers have different growth prospects from writing and printing paper.",
          },
          {
            term: "Raw material security",
            detail:
              "Companies with their own plantation programmes or secured fibre supply are less exposed to price spikes.",
          },
          {
            term: "Capacity utilisation and margins",
            detail:
              "Paper is a commodity business; profit swings with how full the mills run and the spread between paper and pulp prices.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Paper is cyclical: prices and profits can fall sharply when new capacity or imports increase supply. Rising wood and energy costs, and environmental compliance costs, are other risks.",
        ],
      },
    ],
    faqs: [
      {
        question: "Are paper stocks affected by the move away from plastic?",
        answer:
          "Restrictions on single-use plastic have increased demand for paper-based packaging, which supports paperboard makers, although writing and printing paper faces the opposite pressure from digital media.",
      },
    ],
  },

  "sector/healthcare": {
    sections: [
      {
        heading: "What are healthcare stocks?",
        paragraphs: [
          "Healthcare stocks include pharmaceutical and biotechnology companies, hospital chains, diagnostic laboratories and makers of medical equipment and supplies. India is often called the pharmacy of the world because it supplies a large share of the world's generic medicines - copies of drugs whose patents have expired - including to the United States.",
          "Within the sector, business models differ widely. Some pharma companies earn most of their revenue from the US generics market, others from branded medicines sold in India, and others from contract manufacturing or research services (CDMO and CRO). Hospital and diagnostic companies depend on patients in India and grow as more people can afford private care and as health insurance spreads.",
        ],
      },
      {
        heading: "What moves healthcare stocks",
        points: [
          {
            term: "US FDA inspections",
            detail:
              "Plants that sell to the US are inspected by the US Food and Drug Administration. An observation (Form 483), a warning letter or an import alert can stop shipments from a plant and hit the share price.",
          },
          {
            term: "New drug approvals and launches",
            detail:
              "Approvals for new generics - especially complex or first-to-market ones - drive growth in the US business.",
          },
          {
            term: "US price erosion",
            detail: "Prices of generic drugs in the US tend to fall over time as more competitors enter.",
          },
          {
            term: "Domestic price controls",
            detail:
              "In India, prices of essential medicines are regulated, which limits how much companies can raise them.",
          },
          {
            term: "Healthcare demand in India",
            detail:
              "Rising incomes, insurance coverage and chronic conditions such as diabetes and heart disease drive growth for hospitals and domestic pharma.",
          },
        ],
      },
      {
        heading: "What to check before investing in healthcare stocks",
        points: [
          {
            term: "Revenue mix",
            detail:
              "How much comes from the US, India, other export markets and contract manufacturing - each has different risks.",
          },
          {
            term: "Regulatory track record",
            detail: "A history of clean FDA inspections is valuable; repeated warning letters are a red flag.",
          },
          {
            term: "R&D pipeline",
            detail:
              "The drugs a company is developing or has filed for approval, and what it spends on research as a share of revenue.",
          },
          {
            term: "ARPOB and occupancy (for hospitals)",
            detail:
              "Average revenue per occupied bed and the share of beds filled - the key measures of a hospital's performance.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "For pharma companies the biggest single risk is regulatory: an adverse FDA action on a major plant can remove a large part of revenue for years. Price erosion in the US, patent litigation and price controls in India are others. Hospitals need heavy investment in new beds, which takes years to become profitable.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why do US FDA inspections affect Indian pharma stocks?",
        answer:
          "Many Indian drug makers earn a large share of revenue in the US, and every plant that supplies the US must pass US FDA inspections. Observations, warning letters or import alerts can stop products from a plant being sold in the US.",
      },
      {
        question: "What is a generic drug?",
        answer:
          "A generic drug is a copy of a branded medicine whose patent has expired, with the same active ingredient, strength and effect. Generics are much cheaper than the original brand.",
      },
    ],
  },

  "sector/it": {
    sections: [
      {
        heading: "What are IT stocks?",
        paragraphs: [
          "IT stocks are India's information technology companies: IT services and consulting firms that build and run software and systems for clients around the world, software product companies, and IT hardware makers and distributors. The largest are among the most valuable companies on the Indian stock market.",
          "Most large IT services companies earn the bulk of their revenue from clients in North America and Europe - banks, insurers, retailers, manufacturers and telecom companies - who pay them to modernise systems, move to the cloud, manage data and adopt new technology such as artificial intelligence. That makes the sector unusually sensitive to what happens outside India.",
        ],
      },
      {
        heading: "What moves IT stocks",
        points: [
          {
            term: "Global technology spending",
            detail:
              "When clients in the US and Europe are confident, they spend on new projects; when their economies slow, they cut discretionary IT budgets.",
          },
          {
            term: "The rupee",
            detail:
              "Revenue is earned in dollars, euros and pounds but most costs are in rupees, so a weaker rupee usually helps margins.",
          },
          {
            term: "Deal wins",
            detail:
              "Large multi-year contracts are reported as total contract value (TCV), a leading indicator of future revenue.",
          },
          {
            term: "Quarterly results and guidance",
            detail:
              "Many IT companies give a revenue growth forecast for the year. Changes to that guidance move the shares.",
          },
          {
            term: "Technology shifts",
            detail:
              "New technologies such as generative AI create new work but can also shrink traditional services, and the market reprices companies on how well they adapt.",
          },
        ],
      },
      {
        heading: "What to check before investing in IT stocks",
        points: [
          {
            term: "Revenue growth in constant currency",
            detail:
              "Growth with currency movements stripped out - the cleanest measure of how much more business the company is doing.",
          },
          {
            term: "Operating (EBIT) margin",
            detail:
              "How much of each rupee of revenue is left as operating profit. Salaries are the biggest cost, so wage hikes and employee utilisation matter.",
          },
          {
            term: "Attrition",
            detail: "The share of employees who leave in a year. High attrition raises hiring and training costs.",
          },
          {
            term: "Client concentration",
            detail: "How much revenue comes from the largest clients and from one industry or geography.",
          },
          {
            term: "Dividends and buybacks",
            detail: "Large IT companies generate a lot of cash and return much of it to shareholders.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "IT stocks can fall sharply when the US or European economy weakens or when clients cut technology budgets. A strengthening rupee, visa restrictions, rising wage costs and the risk that automation reduces demand for traditional services are other risks. Smaller IT companies can depend heavily on a few clients.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why do IT stocks depend on the US economy?",
        answer:
          "Most large Indian IT services companies earn the majority of their revenue from clients in North America and Europe. When those economies slow, clients cut technology spending, which slows the IT companies' growth.",
      },
      {
        question: "How does the rupee affect IT stocks?",
        answer:
          "IT companies earn mainly in foreign currencies but pay most of their costs, especially salaries, in rupees. A weaker rupee therefore tends to raise their profits in rupee terms, and a stronger rupee to reduce them.",
      },
    ],
  },

  "sector/media-entertainment": {
    sections: [
      {
        heading: "What are media and entertainment stocks?",
        paragraphs: [
          "Media and entertainment stocks include television broadcasters, film producers and distributors, cinema chains, music labels, digital and streaming platforms, radio, newspapers and publishers.",
          "The industry earns money in two main ways: advertising, which follows the economy and company marketing budgets, and subscriptions and ticket sales paid by audiences. Viewing is moving from television and print to digital and streaming, which is reshaping the sector.",
        ],
      },
      {
        heading: "What moves media stocks",
        points: [
          {
            term: "Advertising spending",
            detail:
              "Companies spend more on advertising when the economy is strong and during festive seasons and big sporting events.",
          },
          {
            term: "Content hits",
            detail:
              "Box office success, popular shows and music hits drive revenue for studios, cinema chains and music companies.",
          },
          {
            term: "Shift to digital",
            detail:
              "Audiences moving to streaming and social platforms create new revenue for some companies and erode it for others.",
          },
          {
            term: "Sports and content rights",
            detail:
              "Bidding for cricket and other rights can be very expensive, and winning or losing them changes a broadcaster's prospects.",
          },
        ],
      },
      {
        heading: "What to check before investing in media stocks",
        points: [
          {
            term: "Revenue mix",
            detail:
              "The balance between advertising and subscription revenue. Subscription income is usually steadier.",
          },
          {
            term: "Content costs",
            detail: "Spending on programming, films and rights, and whether it is earning enough back.",
          },
          {
            term: "Occupancy and spend per head (for cinemas)",
            detail: "How full screens are and how much each visitor spends on tickets and food and beverages.",
          },
          {
            term: "Library value",
            detail: "A large catalogue of films, shows or music can earn licensing income for years.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Media earnings can be volatile because they depend on hits, advertising cycles and costly content bets. Structural decline in traditional TV and print, regulation of broadcasting and tariffs, and intense competition from global streaming platforms are key risks.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do media companies make money?",
        answer:
          "Mainly through advertising and through what audiences pay - subscriptions, cinema tickets and content purchases. Many also earn from licensing their content and music catalogues.",
      },
    ],
  },

  "sector/metals-mining": {
    sections: [
      {
        heading: "What are metal stocks?",
        paragraphs: [
          "Metal and mining stocks include steel makers, producers of aluminium, copper, zinc and other non-ferrous metals, ferro-alloy makers, and companies that mine iron ore, coal and other minerals. Ferrous metals are iron and steel; non-ferrous metals are everything else, such as aluminium, copper and zinc.",
          "Metals are commodities: their prices are set largely by global supply and demand and quoted on international markets such as the London Metal Exchange (LME). Indian metal companies therefore follow global cycles - and China, which produces and consumes about half of the world's steel and many other metals, has an outsized influence.",
        ],
      },
      {
        heading: "What moves metal stocks",
        points: [
          {
            term: "Global metal prices",
            detail:
              "Steel, aluminium, copper and zinc prices can move sharply, and metal company profits move with them.",
          },
          {
            term: "China",
            detail:
              "When China's economy or construction sector slows, it exports more metal and prices fall worldwide; stimulus in China tends to lift prices.",
          },
          {
            term: "Raw material costs",
            detail:
              "Iron ore and coking coal for steel, alumina and power for aluminium. The spread between metal prices and raw material costs decides margins.",
          },
          {
            term: "Domestic demand and trade policy",
            detail:
              "Infrastructure, housing, autos and manufacturing drive demand in India, and import duties or safeguard measures can protect domestic prices.",
          },
        ],
      },
      {
        heading: "What to check before investing in metal stocks",
        points: [
          {
            term: "EBITDA per tonne",
            detail: "Operating profit per tonne of metal sold - the standard way to compare metal producers.",
          },
          {
            term: "Raw material integration",
            detail:
              "Companies with their own iron ore mines, coal or captive power are less exposed to raw material price spikes.",
          },
          {
            term: "Debt",
            detail:
              "Metal plants are expensive to build. High debt is dangerous in a business whose profits swing with the cycle; net debt to EBITDA is a common check.",
          },
          {
            term: "Valuation through the cycle",
            detail:
              "Metal stocks often look cheapest on a price-to-earnings basis at the peak of the cycle, when profits are highest - and most expensive at the bottom. Many investors look at EV/EBITDA and price-to-book instead.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Metal stocks are among the most cyclical on the market: a fall in global prices can cut profits sharply within a few quarters. Cheap imports, rising raw material costs, heavy debt taken on for expansion, and environmental and mining regulations are further risks.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the difference between ferrous and non-ferrous metals?",
        answer:
          "Ferrous metals contain iron - mainly iron and steel. Non-ferrous metals do not, and include aluminium, copper, zinc, lead and nickel.",
      },
      {
        question: "Why are metal stocks called cyclical?",
        answer:
          "Their profits depend on metal prices, which rise and fall with global economic cycles and supply. Earnings can swing from very high to very low within a few years, and share prices follow.",
      },
    ],
  },

  "sector/oil-gas": {
    sections: [
      {
        heading: "What are oil and gas stocks?",
        paragraphs: [
          "Oil and gas stocks span the whole energy chain: upstream companies that explore for and produce crude oil and natural gas; downstream refiners and oil marketing companies that turn crude into petrol, diesel and other fuels and sell them; gas transmission companies and city gas distributors that pipe gas to homes, vehicles and industry; and coal producers, grouped here as consumable fuels.",
          "Several of the largest companies in the sector are government-owned public sector undertakings (PSUs), and government policy on fuel prices, gas pricing and taxes plays a large role in their profits. Many of them pay regular dividends.",
        ],
      },
      {
        heading: "What moves oil and gas stocks",
        points: [
          {
            term: "Crude oil prices",
            detail:
              "Higher crude prices help producers but raise costs for refiners and marketers, who may not be able to pass them on to consumers immediately.",
          },
          {
            term: "Refining margins",
            detail:
              "The gross refining margin (GRM) is the difference between the value of fuels a refinery produces and the cost of the crude it processes, usually quoted in dollars per barrel.",
          },
          {
            term: "Marketing margins",
            detail:
              "The margin oil marketing companies earn on each litre of petrol and diesel sold, which depends on how retail prices track crude prices.",
          },
          {
            term: "Gas pricing and policy",
            detail:
              "Government formulas set the price of much of the gas produced in India, and policy on gas allocation, taxes and duties shapes profits across the chain.",
          },
        ],
      },
      {
        heading: "What to check before investing in oil and gas stocks",
        points: [
          {
            term: "Where the company sits in the chain",
            detail:
              "Producers, refiners, marketers and gas distributors react to crude prices in different, often opposite, ways.",
          },
          {
            term: "Dividend yield",
            detail:
              "Annual dividend per share divided by the share price. Many oil and gas PSUs are known for high dividend payouts.",
          },
          {
            term: "Volume growth (for city gas)",
            detail:
              "City gas distributors grow by connecting more homes and CNG vehicles and adding industrial customers; watch volume growth and the spread between gas cost and selling price.",
          },
          {
            term: "Energy transition",
            detail:
              "How the company is preparing for lower fossil-fuel demand over time - investments in renewables, green hydrogen, biofuels and petrochemicals.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Oil and gas profits swing with volatile global energy prices. For government-owned companies, policy decisions - such as holding fuel prices steady when crude rises - can override commercial logic. Over the long term, the shift to electric vehicles and cleaner energy is a structural risk to fossil-fuel demand.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is GRM in oil stocks?",
        answer:
          "GRM, or gross refining margin, is the difference between the value of the products a refinery makes and the cost of the crude oil it processes, per barrel. It is the main measure of a refinery's profitability.",
      },
      {
        question: "Do rising crude oil prices help or hurt oil stocks?",
        answer:
          "It depends on the business. Oil producers usually benefit from higher crude prices, while refiners and oil marketing companies can be hurt if they cannot pass the higher cost on to consumers quickly.",
      },
    ],
  },

  "sector/power": {
    sections: [
      {
        heading: "What are power stocks?",
        paragraphs: [
          "Power stocks are companies that generate, transmit, distribute and trade electricity. Generation includes thermal (coal and gas), hydro, nuclear and renewable energy - solar and wind. Transmission companies build and run the high-voltage lines that carry power across the country, and distribution companies (discoms) deliver it to homes and businesses. The sector also includes power traders and exchanges.",
          "India's electricity demand has been growing steadily with the economy, and the country has set a target of reaching 500 GW of non-fossil power capacity by 2030. That has brought a wave of investment - and new listings - in renewable energy, transmission and storage.",
        ],
      },
      {
        heading: "What moves power stocks",
        points: [
          {
            term: "Electricity demand",
            detail:
              "Economic growth, hot summers and the spread of air conditioning, electric vehicles and industrial activity all lift demand.",
          },
          {
            term: "Capacity additions",
            detail:
              "New plants and transmission lines commissioned on time raise earnings, particularly for companies with regulated returns.",
          },
          {
            term: "Fuel supply and costs",
            detail:
              "Coal availability and prices matter for thermal generators, and imported coal and gas prices can raise costs.",
          },
          {
            term: "Policy and tariffs",
            detail:
              "Tariffs set by electricity regulators, renewable energy auctions and rules on paying generators on time shape the sector's returns.",
          },
        ],
      },
      {
        heading: "What to check before investing in power stocks",
        points: [
          {
            term: "Regulated vs merchant business",
            detail:
              "Many power assets earn a regulated return fixed by the regulator, which is steady. Merchant power is sold at market prices, which is more profitable when prices are high but less predictable.",
          },
          {
            term: "Plant load factor (PLF)",
            detail:
              "How much electricity a plant actually produces compared with the maximum it could. Higher PLF means better use of capacity.",
          },
          {
            term: "Power purchase agreements (PPAs)",
            detail:
              "Long-term contracts to sell power at a set tariff give visibility of revenue; check who the buyer is and how reliably they pay.",
          },
          {
            term: "Debt and receivables",
            detail:
              "Power projects are funded with a lot of debt, and some state distribution companies pay late. High debt combined with delayed payments is a risk.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Power companies carry heavy debt and depend on regulators and state-owned distribution companies for their tariffs and payments. Delays in building projects, fuel shortages and falling renewable tariffs in auctions can hurt returns. Rapid growth has also pushed some power stocks to high valuations.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is PLF in power stocks?",
        answer:
          "PLF, or plant load factor, is the electricity a power plant actually generates as a percentage of the maximum it could generate running at full capacity all the time. It shows how intensively the plant is being used.",
      },
      {
        question: "What is a PPA?",
        answer:
          "A power purchase agreement is a long-term contract under which a buyer - often a state distribution company - agrees to buy electricity from a generator at an agreed tariff, typically for 25 years for renewable projects.",
      },
    ],
  },

  "sector/realty": {
    sections: [
      {
        heading: "What are real estate stocks?",
        paragraphs: [
          "Real estate (realty) stocks are property developers that build and sell homes, and companies that build and lease offices, shopping malls, warehouses and data centres. Residential developers earn money when they sell homes; commercial developers earn rent over many years.",
          "Real estate has had long cycles in India. Rules introduced under the Real Estate (Regulation and Development) Act, 2016 (RERA), which require projects to be registered and buyers' money to be protected, have pushed the sector towards larger, better-governed developers.",
          "Separately from these stocks, investors can also buy listed REITs (real estate investment trusts), which own rent-earning commercial property and distribute most of their income.",
        ],
      },
      {
        heading: "What moves real estate stocks",
        points: [
          {
            term: "Home loan rates",
            detail:
              "Most homes are bought with a loan, so falling interest rates make homes more affordable and lift demand.",
          },
          {
            term: "Sales bookings",
            detail:
              "Developers report pre-sales - the value of homes booked in a quarter - which leads revenue by several years because revenue is recognised as projects are completed.",
          },
          {
            term: "New launches and approvals",
            detail: "A strong pipeline of projects, and approvals to start them, drives future bookings.",
          },
          {
            term: "Office demand",
            detail:
              "For commercial developers, leasing by IT companies and global capability centres drives occupancy and rents.",
          },
        ],
      },
      {
        heading: "What to check before investing in real estate stocks",
        points: [
          {
            term: "Pre-sales and collections",
            detail:
              "Pre-sales show demand; collections - cash actually received from buyers - show whether it is turning into money.",
          },
          {
            term: "Net debt",
            detail: "Borrowings minus cash. The sector's past troubles were largely caused by excessive debt.",
          },
          {
            term: "Land bank and project pipeline",
            detail: "The land a developer owns or controls and the projects planned on it indicate future growth.",
          },
          {
            term: "Execution and delivery record",
            detail:
              "A developer that delivers on time wins buyers' trust, and brand matters a great deal in residential property.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Real estate is highly cyclical and sensitive to interest rates. Delays in approvals or construction, heavy debt, and unsold inventory in a downturn are the main risks. Because revenue is recognised as projects are completed, reported profits can look very different from the actual pace of sales.",
        ],
      },
    ],
    faqs: [
      {
        question: "What are pre-sales in real estate stocks?",
        answer:
          "Pre-sales, or sales bookings, are the value of homes booked by buyers in a period. Because developers recognise revenue only as projects are completed, pre-sales are a better real-time indicator of demand than reported revenue.",
      },
      {
        question: "What is the difference between realty stocks and REITs?",
        answer:
          "Realty stocks are shares of developers, whose profits come mainly from selling property. REITs own completed, rent-earning commercial property and must distribute most of their income to unitholders, so they behave more like income-generating investments.",
      },
    ],
  },

  "sector/services": {
    sections: [
      {
        heading: "What are services stocks?",
        paragraphs: [
          "The services sector, in the NSE classification, groups together businesses that move goods and people and that support other businesses: logistics and courier companies, shipping and airlines, port, airport and toll-road operators, engineering services firms, and commercial services such as staffing, facility management and security.",
          "Many of these companies grow with trade and consumption - more goods manufactured and bought means more freight to move - and with investment in transport infrastructure.",
        ],
      },
      {
        heading: "What moves services stocks",
        points: [
          {
            term: "Trade and freight volumes",
            detail:
              "Manufacturing output, e-commerce deliveries and exports and imports drive volumes for logistics companies and ports.",
          },
          {
            term: "Fuel costs",
            detail: "Diesel and aviation fuel are major costs for transport companies.",
          },
          {
            term: "Infrastructure build-out",
            detail:
              "New highways, dedicated freight corridors, ports and airports change how goods move and create opportunities for operators.",
          },
          {
            term: "Employment and outsourcing",
            detail:
              "Staffing and facility management companies grow as businesses outsource non-core work and formal employment rises.",
          },
        ],
      },
      {
        heading: "What to check before investing in services stocks",
        points: [
          {
            term: "Volume growth",
            detail: "Tonnes, containers, shipments or passengers handled - the basic measure of a transport business.",
          },
          {
            term: "Asset-light vs asset-heavy",
            detail:
              "Some companies own trucks, ships or ports; others coordinate without owning assets. Asset-light businesses usually earn higher returns on capital but have less control.",
          },
          {
            term: "Margins and pricing",
            detail: "Whether the company can pass on fuel and wage increases to customers.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Transport and logistics are cyclical and fuel-sensitive; airlines in particular can swing between profit and loss quickly. Staffing and services companies depend on the job market and operate on thin margins.",
        ],
      },
    ],
    faqs: [
      {
        question: "Which businesses are included in the services sector?",
        answer:
          "In the NSE classification used here, the services sector includes transport services (logistics, shipping, airlines), transport infrastructure (ports, airports, roads), engineering services, and commercial services and supplies such as staffing and facility management.",
      },
    ],
  },

  "sector/telecom": {
    sections: [
      {
        heading: "What are telecom stocks?",
        paragraphs: [
          "Telecom stocks include mobile and broadband operators, companies that own and lease telecom towers, and makers of telecom equipment such as optical fibre, cables and network gear.",
          "India has one of the world's largest mobile subscriber bases and some of the lowest data prices. After years of intense price competition, the industry consolidated into a small number of large private operators and a government-owned one, and has been rolling out 5G networks.",
        ],
      },
      {
        heading: "What moves telecom stocks",
        points: [
          {
            term: "Tariff increases",
            detail:
              "When operators raise prepaid and postpaid tariffs, revenue per user rises quickly - tariff hikes are among the biggest drivers of the sector.",
          },
          {
            term: "Subscriber additions",
            detail: "Growth in subscribers, and in customers moving to 4G, 5G and home broadband.",
          },
          {
            term: "Spectrum and capex",
            detail:
              "Operators must buy spectrum in government auctions and spend heavily on networks, which weighs on cash flow.",
          },
          {
            term: "Government dues and regulation",
            detail:
              "Licence fees, spectrum payments and past disputes over adjusted gross revenue (AGR) dues have shaped the finances of operators.",
          },
        ],
      },
      {
        heading: "What to check before investing in telecom stocks",
        points: [
          {
            term: "ARPU",
            detail: "Average revenue per user per month - the single most watched number in telecom.",
          },
          {
            term: "Subscriber market share",
            detail: "Whether the operator is gaining or losing customers, especially high-paying ones.",
          },
          {
            term: "Net debt",
            detail:
              "Telecom operators carry large debt and deferred spectrum liabilities; how comfortably they can service them matters.",
          },
          {
            term: "Tenancy (for tower companies)",
            detail: "The number of operators renting space on each tower. More tenants per tower means higher returns.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Telecom needs continuous heavy investment in spectrum and networks, and a price war can quickly erode revenue across the industry. High debt, regulatory decisions and dependence on a few large customers (for tower and equipment companies) are the main risks.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is ARPU in telecom?",
        answer:
          "ARPU, or average revenue per user, is the average monthly revenue an operator earns from each subscriber. It rises with tariff increases and as customers use more data or move to higher plans.",
      },
    ],
  },

  "sector/textiles": {
    sections: [
      {
        heading: "What are textile stocks?",
        paragraphs: [
          "Textile stocks cover the whole chain from fibre to fashion: cotton and synthetic yarn spinners, fabric weavers and processors, home textile makers (bed linen, towels), technical textiles, and garment and apparel manufacturers and brands.",
          "India is one of the world's largest producers of cotton and textiles, and the sector is a major exporter and one of the country's largest employers. Government support through production-linked incentives for man-made fibre and technical textiles, and large integrated textile parks, aims to expand it further.",
        ],
      },
      {
        heading: "What moves textile stocks",
        points: [
          {
            term: "Cotton and fibre prices",
            detail:
              "Cotton is the key raw material; sharp swings in its price change margins for spinners and fabric makers.",
          },
          {
            term: "Export demand",
            detail:
              "Orders from retailers in the US and Europe, and how much stock those retailers are holding, drive export volumes.",
          },
          {
            term: "Trade agreements and competition",
            detail:
              "Free trade agreements, and competition from Bangladesh, Vietnam and China, affect how competitive Indian exports are.",
          },
          {
            term: "Domestic consumption",
            detail: "Apparel brands and retailers depend on consumer spending in India.",
          },
        ],
      },
      {
        heading: "What to check before investing in textile stocks",
        points: [
          {
            term: "Position in the value chain",
            detail:
              "Spinning is a commodity business with thin margins; branded apparel and home textiles earn more but need marketing and design.",
          },
          {
            term: "Export share and key customers",
            detail: "Dependence on a few large overseas retailers can make revenue volatile.",
          },
          {
            term: "Working capital",
            detail:
              "Textile companies hold large inventories of cotton and finished goods; efficient working capital management matters.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Textiles are cyclical and low-margin in many segments, exposed to cotton prices, currency movements and global demand. Competition from lower-cost countries and changes in trade policy can shift orders quickly.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do cotton prices affect textile stocks?",
        answer:
          "Cotton is the main raw material for much of the industry. A sharp rise in cotton prices raises costs for spinners and fabric makers, and if they cannot pass it on, their margins fall.",
      },
    ],
  },

  "sector/utilities": {
    sections: [
      {
        heading: "What are utility stocks?",
        paragraphs: [
          "Utility stocks, in the NSE classification used here, are companies providing essential services other than electricity - such as water supply and treatment, and waste management. Electricity companies have their own power sector.",
          "Utilities typically work under long-term contracts with municipalities, state governments or industrial clients, so their revenue can be steady, but they depend on those clients paying on time.",
        ],
      },
      {
        heading: "What to check before investing in utility stocks",
        points: [
          {
            term: "Contract visibility",
            detail: "The length and value of long-term contracts in hand.",
          },
          {
            term: "Receivables",
            detail: "How quickly government and municipal clients pay.",
          },
          {
            term: "Regulatory framework",
            detail: "Tariffs and service standards set by authorities affect returns.",
          },
        ],
      },
      {
        heading: "Risks to know",
        paragraphs: [
          "Payment delays from public-sector clients, regulatory changes and the capital needed to build and maintain infrastructure are the main risks for utility companies.",
        ],
      },
    ],
    faqs: [
      {
        question: "Are power companies part of the utilities sector?",
        answer:
          "Not in the NSE classification used on this page. Power generation, transmission and distribution companies form their own power sector; the utilities sector covers other essential services such as water and waste management.",
      },
    ],
  },

  /* ======================================================================
     Market-cap bands
     ====================================================================== */

  "market-cap/large-cap": {
    sections: [
      {
        heading: "What is market capitalisation?",
        paragraphs: [
          "Market capitalisation, or market cap, is the total value the stock market places on a company. It is calculated by multiplying the current share price by the total number of shares the company has issued. A company with 100 crore shares trading at ₹500 has a market cap of ₹50,000 crore.",
          "Market cap tells you the size of a company in the eyes of the market - not how much revenue or profit it makes. It changes every day with the share price.",
        ],
      },
      {
        heading: "What are large cap stocks?",
        paragraphs: [
          "Large cap stocks are the biggest listed companies by market cap. In 2017 SEBI, India's market regulator, standardised how mutual funds classify stocks: the 100 largest companies by full market capitalisation are large caps, the next 150 are mid caps, and everything from the 251st company onward is a small cap. AMFI, the mutual fund industry body, publishes the updated list every six months.",
          "Large caps are typically established market leaders - the biggest banks, IT companies, FMCG makers, energy companies and conglomerates - and make up most of the value of indices such as the Nifty 50 and the Sensex.",
        ],
      },
      {
        heading: "Why investors hold large cap stocks",
        points: [
          {
            term: "Stability",
            detail:
              "Large companies usually have diversified businesses, strong balance sheets and experienced management, so their earnings tend to be more predictable and their share prices less volatile than smaller companies'.",
          },
          {
            term: "Liquidity",
            detail:
              "Large caps trade in high volumes, so you can buy or sell them quickly at close to the quoted price. The gap between buying and selling prices (the bid-ask spread) is small.",
          },
          {
            term: "Dividends",
            detail: "Many mature large companies return a share of their profits to shareholders as regular dividends.",
          },
          {
            term: "Information",
            detail: "Large caps are widely tracked by analysts and the media, so information about them is plentiful.",
          },
        ],
      },
      {
        heading: "What to keep in mind",
        paragraphs: [
          "Large caps are less risky than smaller companies, not risk-free: they can still fall sharply in a market downturn or when their own business disappoints. Their size also means they usually grow more slowly than smaller companies. Many investors build the core of a long-term portfolio with large caps and add mid and small caps for extra growth.",
          "If you are new to investing, large caps are often a sensible place to start learning - their businesses are easier to understand and follow. You can also get large cap exposure through a large cap mutual fund, which SEBI requires to invest at least 80% of its money in large cap stocks, or through an index fund that tracks the Nifty 50.",
        ],
      },
    ],
    faqs: [
      {
        question: "How is market cap calculated?",
        answer:
          "Market capitalisation = current share price × total number of shares outstanding. For example, a company with 100 crore shares priced at ₹500 each has a market cap of ₹50,000 crore.",
      },
      {
        question: "Are large cap stocks safe?",
        answer:
          "They are generally less volatile than mid and small cap stocks because the companies are bigger and more established, but no stock is completely safe. Large caps can and do fall, especially in market-wide downturns.",
      },
      {
        question: "Who decides which stocks are large cap?",
        answer:
          "SEBI's 2017 framework for mutual funds defines the top 100 companies by full market capitalisation as large caps. AMFI publishes the updated list every six months, based on average market capitalisation.",
      },
    ],
  },

  "market-cap/mid-cap": {
    sections: [
      {
        heading: "What are mid cap stocks?",
        paragraphs: [
          "Mid cap stocks are companies in the middle of the market by size. Under SEBI's classification for mutual funds, they are the 101st to 250th largest listed companies by full market capitalisation (market cap is the share price multiplied by the number of shares). AMFI updates the list every six months.",
          "Mid caps are often companies that have moved past the start-up stage and proved their business model, but still have plenty of room to grow - some become the large caps of the future. Others are established companies in smaller or niche industries.",
        ],
      },
      {
        heading: "Why investors look at mid cap stocks",
        points: [
          {
            term: "Growth potential",
            detail:
              "Smaller companies can grow revenue and profit faster than giants that already dominate their markets.",
          },
          {
            term: "Room to be discovered",
            detail:
              "Mid caps are covered by fewer analysts than large caps, so businesses that are improving can be overlooked for a while.",
          },
          {
            term: "Balance of risk and reward",
            detail: "Mid caps usually sit between large caps and small caps on both potential return and risk.",
          },
        ],
      },
      {
        heading: "What to keep in mind",
        paragraphs: [
          "Mid cap stocks are more volatile than large caps. In market corrections they often fall further and faster, and it can take longer for them to recover. Their liquidity - how easily you can buy and sell without moving the price - is lower than for large caps, though generally much better than for small caps.",
          "Before investing in a mid cap company, look closely at its balance sheet (especially debt), whether its growth is turning into cash flow, the quality and track record of its management, and its valuation compared with its growth. Diversifying across several companies reduces the impact of any one going wrong. Mid cap mutual funds, which SEBI requires to invest at least 65% in mid cap stocks, are another way in.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the difference between large cap and mid cap stocks?",
        answer:
          "Large caps are the 100 biggest listed companies by market capitalisation; mid caps are the 101st to 250th. Mid caps generally offer more room to grow but are more volatile and less liquid than large caps.",
      },
      {
        question: "Are mid cap stocks riskier than large caps?",
        answer:
          "Generally, yes. Mid cap share prices tend to move more sharply in both directions, and the companies are usually less diversified and have smaller financial cushions than large caps.",
      },
    ],
  },

  "market-cap/small-cap": {
    sections: [
      {
        heading: "What are small cap stocks?",
        paragraphs: [
          "Small cap stocks are listed companies ranked 251st and below by full market capitalisation under SEBI's classification. That covers the large majority of listed companies in India - from well-run niche businesses to young, unproven ones.",
          "Market cap is the share price multiplied by the number of shares, so a small cap is simply a company the market currently values at a smaller amount. Some small caps grow into mid and large caps over time; many don't.",
        ],
      },
      {
        heading: "Why investors look at small cap stocks",
        points: [
          {
            term: "High growth potential",
            detail:
              "A small company that executes well can multiply its revenue and profit, and its share price can rise much more than a large company's.",
          },
          {
            term: "Less analyst coverage",
            detail:
              "Few analysts follow most small caps, so careful research can uncover businesses the market has not yet noticed.",
          },
          {
            term: "Exposure to niche industries",
            detail:
              "Many specialised businesses - in chemicals, engineering, consumer brands and more - are only available as small caps.",
          },
        ],
      },
      {
        heading: "Risks every beginner should understand",
        points: [
          {
            term: "Volatility",
            detail:
              "Small cap prices can rise and fall very sharply. Falls of 30-50% or more in a market downturn are not unusual.",
          },
          {
            term: "Liquidity",
            detail:
              "Many small caps trade in low volumes. When you want to sell, there may not be enough buyers at the current price, and the gap between buying and selling prices can be wide.",
          },
          {
            term: "Business and governance risk",
            detail:
              "Smaller companies often depend on a few products, customers or people, and have thinner financial buffers. Governance standards vary more widely.",
          },
          {
            term: "Price bands",
            detail:
              "Many smaller stocks have daily price limits (circuits) of 2%, 5%, 10% or 20%. When a stock hits its limit, trading in that direction can freeze, making it hard to buy or sell.",
          },
        ],
      },
      {
        heading: "How to approach small cap investing",
        paragraphs: [
          "Treat small caps as a smaller part of a diversified portfolio rather than its core, and invest money you won't need for several years. Before buying, read the company's annual report and quarterly results, check debt and cash flow, and look at who the promoters are and how much of their holding is pledged (the shareholding pattern on each stock's page shows this). Small cap mutual funds, which SEBI requires to invest at least 65% in small cap stocks, spread the risk across many companies.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is a small cap stock?",
        answer:
          "Under SEBI's classification, a small cap is any listed company ranked 251st or lower by full market capitalisation. They are smaller, often younger companies with higher growth potential and higher risk.",
      },
      {
        question: "Why are small cap stocks risky?",
        answer:
          "Their prices are much more volatile, many trade in low volumes (making them hard to sell quickly), and the businesses are usually smaller and less diversified, so a single setback can hurt them badly.",
      },
    ],
  },

  "market-cap/micro-cap": {
    sections: [
      {
        heading: "What are micro cap stocks?",
        paragraphs: [
          "Micro cap stocks are the smallest listed companies by market capitalisation. SEBI's classification stops at small caps - everything below the top 250 - but investors commonly use 'micro cap' for the very smallest companies within that group. On this site, the micro cap band groups those smallest companies.",
          "Micro caps make up a large number of listed companies but only a tiny share of the market's total value. Some are early-stage businesses with real potential; many are thinly traded, little-known companies.",
        ],
      },
      {
        heading: "Why micro caps need extra care",
        points: [
          {
            term: "Very low liquidity",
            detail:
              "Many micro caps see only a few trades a day. You may not be able to sell when you want to, or at the price you expect.",
          },
          {
            term: "Extreme volatility",
            detail: "Prices can double or halve in weeks, often without any change in the business.",
          },
          {
            term: "Exchange surveillance",
            detail:
              "The exchanges place stocks with unusual price moves under surveillance frameworks such as ASM (Additional Surveillance Measure) and GSM (Graded Surveillance Measure), which can bring higher margins, tighter price bands or restrictions on trading.",
          },
          {
            term: "Trade-for-trade segment",
            detail:
              "Some micro caps are moved to the trade-for-trade (T2T) segment, where every trade must be settled by delivery - you cannot buy and sell the same stock in one day.",
          },
          {
            term: "Tips and manipulation",
            detail:
              "Micro caps are the most common targets of 'pump and dump' schemes promoted through social media and messaging apps. Be very wary of unsolicited stock tips.",
          },
        ],
      },
      {
        heading: "What to check before investing in a micro cap",
        paragraphs: [
          "Read the company's financial statements and annual report, check whether it is actually profitable and generating cash, look at who the promoters are and whether their shares are pledged, and check the daily trading volume and whether the stock is under ASM or GSM surveillance. Limit micro caps to a small part of your portfolio - money you can afford to lose - and never invest on the strength of a tip alone.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is micro cap a SEBI category?",
        answer:
          "No. SEBI's classification has three bands - large cap (top 100), mid cap (101-250) and small cap (251 onward). Micro cap is a commonly used term for the very smallest companies within the small cap band.",
      },
      {
        question: "What are ASM and GSM?",
        answer:
          "They are surveillance frameworks run by the stock exchanges. ASM (Additional Surveillance Measure) and GSM (Graded Surveillance Measure) apply to stocks with unusual price or volume moves or concerns about fundamentals, and can mean higher margin requirements, tighter price bands or trading restrictions.",
      },
    ],
  },
};

/** The guide for a landing page, or null if it has none. */
export const guideFor = (kind: string, slug: string): StockGuide | null => STOCK_GUIDES[`${kind}/${slug}`] ?? null;
