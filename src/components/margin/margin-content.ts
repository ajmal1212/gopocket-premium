/**
 * Copy for /margin-calculator: the how-to and margin-component cards beside
 * the calculator, the long-form guide below it, and the FAQ (which also feeds
 * the page's FAQPage JSON-LD).
 *
 * Written around what traders search for - "margin calculator", "F&O / SPAN
 * margin calculator", "Nifty / Bank Nifty margin", "option selling margin",
 * "MCX crude / gold margin" - without quoting lot sizes or rupee figures,
 * which change with every SPAN file and contract revision. Where a reader
 * wants a number, the copy points them at the calculator instead.
 */

export interface MarginGuide {
  id: string;
  title: string;
  paragraphs: string[];
  points?: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export const steps = [
  "Choose the exchange - NFO for NSE futures and options, BFO for BSE (Sensex, Bankex), MCX for commodities.",
  "Pick Futures or Options, then search the symbol and choose its expiry, e.g. NIFTY - 27 Oct 2026.",
  "For an option, choose CE or PE and the strike price.",
  "Enter the number of lots, pick Buy or Sell and add it to the basket.",
  "Add more legs - a hedge, a spread or a straddle - and watch the total margin and margin benefit update.",
];

export const components = [
  {
    title: "SPAN margin",
    description:
      "The exchange's estimate of the worst one-day loss on your basket, worked out over a set of price and volatility scenarios.",
  },
  {
    title: "Exposure margin",
    description:
      "An extra buffer on top of SPAN, charged as a percentage of the contract value, for moves beyond those scenarios.",
  },
  {
    title: "Margin benefit",
    description:
      "What you save when positions offset each other - the margin without the hedge minus the margin with it.",
  },
];

export const guides: MarginGuide[] = [
  {
    id: "what-is-a-margin-calculator",
    title: "What is a Margin Calculator?",
    paragraphs: [
      "Futures and options are traded on margin: instead of paying the full contract value, you keep a deposit with your broker that the exchange blocks against the position. A margin calculator tells you that deposit before you place the order, so you know whether your account can carry the trade.",
      "GoPocket's F&O margin calculator works out the exact SPAN and exposure margin for NSE, BSE and MCX contracts from the exchange's own risk files. It handles a single future, an option you want to sell, or a basket of several legs, and shows the margin benefit you get when those legs hedge each other.",
    ],
  },
  {
    id: "how-is-margin-calculated",
    title: "How is F&O margin calculated?",
    paragraphs: [
      "Every futures and short option position needs an initial margin, made up of two parts. SPAN margin is the largest loss the exchange expects your position could make in a day, found by re-pricing it under a range of price and volatility moves. Exposure margin is an additional cushion, set as a percentage of the contract value.",
      "When you hold several positions, SPAN looks at the portfolio as a whole. A loss on one leg that is offset by a gain on another lowers the worst-case loss, so the basket needs less margin than its legs would on their own. The difference is your margin benefit.",
    ],
    points: [
      "Total margin = SPAN margin + Exposure margin, worked out on the whole basket",
      "Margin benefit = margin on the legs taken separately − margin on the hedged basket",
      "Exchanges publish fresh SPAN files several times a day, so the requirement moves with the market",
    ],
  },
  {
    id: "nifty-bank-nifty-sensex-margin",
    title: "Nifty, Bank Nifty and Sensex margin calculator",
    paragraphs: [
      "Index derivatives are the most traded contracts in India, and their margin changes with volatility and the size of the lot. To find the margin for Nifty futures, choose NFO, Futures and NIFTY with its expiry; for Bank Nifty or Fin Nifty, pick that symbol instead. Sensex and Bankex futures and options trade on BSE - choose BFO.",
      "For index options, select Options, then the expiry, CE or PE and the strike. The calculator shows the margin to sell that option, and how much less you need if you buy a further out-of-the-money option against it.",
    ],
  },
  {
    id: "option-selling-margin",
    title: "Option selling margin vs option buying",
    paragraphs: [
      "Buying a call or a put needs only the premium: your loss can never be more than what you paid, so there is no SPAN margin to block. Selling an option is different - the loss can run well past the premium you collect - so the exchange asks for SPAN and exposure margin, often a large multiple of the premium.",
      "That is why option sellers rarely sell naked. A short straddle or strangle, a credit spread or an iron condor needs far less margin once the bought options are in the basket. Add every leg of your strategy to the calculator to see the hedged margin, not the sum of the parts.",
    ],
    points: [
      "Bull call / bear put spread - buy one strike, sell another of the same expiry",
      "Iron condor - a sold strangle protected by bought wings on both sides",
      "Covered future - a future hedged with an option against it",
    ],
  },
  {
    id: "stock-futures-margin",
    title: "Futures margin calculator for stock futures",
    paragraphs: [
      "Stock futures carry higher margins than index futures because a single company's share can move more sharply than an index. The requirement also differs from stock to stock with its volatility. Choose NFO, Futures and the stock - RELIANCE, HDFCBANK, INFY, SBIN - to see the margin for one lot before you take the trade.",
    ],
  },
  {
    id: "mcx-commodity-margin",
    title: "MCX commodity margin calculator",
    paragraphs: [
      "Commodity futures and options on MCX are margined with SPAN too. Choose MCX to calculate crude oil margin, natural gas margin, gold and gold mini margin, silver and silver mini margin, or base metals like copper, zinc and aluminium. Lot sizes are applied for you, so one lot is priced as the exchange defines it.",
      "Mini contracts such as CRUDEOILM, GOLDM, SILVERM and NATGASMINI need a fraction of the margin of the full-size contract, which makes them a common way to start trading commodities with a smaller account.",
    ],
  },
  {
    id: "sebi-margin-rules",
    title: "SEBI margin rules you should know",
    paragraphs: [
      "SEBI requires brokers to collect the full upfront margin - SPAN plus exposure - before a derivatives position is taken. If the margin in your account falls short, the exchange levies a penalty on the shortfall, which is why it pays to check the requirement in advance.",
      "Margins can also rise on expiry day. The exchanges add an extra margin on short option positions expiring that day, and the margin benefit on calendar spreads does not apply to the leg that is expiring. Always leave a buffer above the calculated figure.",
    ],
  },
  {
    id: "tips-to-manage-margin",
    title: "Tips to manage your F&O margin",
    paragraphs: [],
    points: [
      "Check the margin before you trade - a shortfall can attract a penalty or a square-off",
      "Hedge short options with a bought option to cut the margin sharply",
      "Keep a buffer: SPAN files change during the day and volatility can push margins up",
      "Watch expiry day, when extra margin applies to short options",
      "Use mini commodity contracts or fewer lots if the margin is more than you want to block",
    ],
  },
];

export const faqItems: FaqItem[] = [
  {
    question: "What is a margin calculator?",
    answer:
      "A margin calculator tells you how much money you need in your trading account to take a futures or options position. GoPocket's calculator uses the exchange SPAN files, so the figure is the SPAN plus exposure margin the exchange blocks for your trade.",
  },
  {
    question: "How is SPAN margin calculated?",
    answer:
      "SPAN (Standard Portfolio Analysis of Risk) re-prices your positions under a range of price and volatility scenarios and takes the largest one-day loss as the margin. It looks at the whole portfolio, so positions that offset each other need less margin together than apart.",
  },
  {
    question: "What is exposure margin?",
    answer:
      "Exposure margin is charged on top of SPAN margin as an extra buffer against moves the SPAN scenarios do not cover. It is a percentage of the contract value set by the exchange.",
  },
  {
    question: "How much margin is required for Nifty futures?",
    answer:
      "The Nifty futures margin changes with volatility and the index level, so there is no fixed figure. Choose NFO, Futures, NIFTY and the expiry in the calculator to see today's SPAN and exposure margin for one lot or more.",
  },
  {
    question: "How much margin is needed to sell Nifty or Bank Nifty options?",
    answer:
      "Selling an index option needs SPAN plus exposure margin, which depends on the strike, expiry and current volatility. Choose Options, the expiry, CE or PE and the strike to see it. Buying a further out-of-the-money option against it usually brings the margin down sharply.",
  },
  {
    question: "Why is the margin lower when I add a hedge?",
    answer:
      "SPAN looks at the whole basket, not each position alone. When one position offsets the risk of another - a sold option with a bought option further out, or a future with an option against it - the worst-case loss of the basket falls, and so does the margin. The calculator shows this saving as the margin benefit.",
  },
  {
    question: "Do I need margin to buy options?",
    answer:
      "Buying an option needs the full premium rather than SPAN margin, because your loss is limited to what you pay. Selling an option or trading futures needs SPAN and exposure margin.",
  },
  {
    question: "How is MCX commodity margin calculated?",
    answer:
      "MCX futures and options are margined with SPAN plus exposure margin, like equity derivatives. Choose MCX in the calculator to see the margin for crude oil, natural gas, gold, silver and base metals, with the contract's lot size applied.",
  },
  {
    question: "Can I calculate margin for Sensex and Bankex options?",
    answer:
      "Yes. Sensex and Bankex futures and options trade on BSE's derivatives segment - choose BFO in the calculator.",
  },
  {
    question: "Does the margin requirement change during the day?",
    answer:
      "Yes. Exchanges publish fresh SPAN files several times during the trading day, and margins move with prices and volatility. Expiry day can also bring extra margin on short options. Keep a buffer above the calculated figure.",
  },
  {
    question: "What happens if I don't have enough margin?",
    answer:
      "Brokers must collect the full upfront margin before a derivatives trade. If your account falls short, the exchange levies a penalty on the shortfall, and positions may be squared off to bring the account back within its margin.",
  },
  {
    question: "Is the GoPocket margin calculator free?",
    answer: "Yes. The margin calculator is free to use and needs no login or GoPocket account.",
  },
];
