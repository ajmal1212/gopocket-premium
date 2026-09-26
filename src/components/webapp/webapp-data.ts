/**
 * Copy for the /webapplication page.
 *
 * The page's layout follows a reference design section for section; everything
 * it says is GoPocket's. The testimonials are the real customer quotes from
 * Testimonials2.astro, so keep them in step with that file rather than editing
 * them here.
 */
import type { AstroComponent } from "@lucide/astro";
import Workflow from "@lucide/astro/icons/workflow";
import Funnel from "@lucide/astro/icons/funnel";
import LayoutGrid from "@lucide/astro/icons/layout-grid";
import Sheet from "@lucide/astro/icons/sheet";
import Wallet from "@lucide/astro/icons/wallet";
import ChartCandlestick from "@lucide/astro/icons/chart-candlestick";
import Zap from "@lucide/astro/icons/zap";
import TrendingUp from "@lucide/astro/icons/trending-up";
import Layers from "@lucide/astro/icons/layers";
import PiggyBank from "@lucide/astro/icons/piggy-bank";
import Rocket from "@lucide/astro/icons/rocket";
import Landmark from "@lucide/astro/icons/landmark";
import Gem from "@lucide/astro/icons/gem";
import Coins from "@lucide/astro/icons/coins";
import Bell from "@lucide/astro/icons/bell";
import Calculator from "@lucide/astro/icons/calculator";
import Download from "@lucide/astro/icons/download";
import Code from "@lucide/astro/icons/code";
import GraduationCap from "@lucide/astro/icons/graduation-cap";
import BadgeIndianRupee from "@lucide/astro/icons/badge-indian-rupee";

export const WEB_TRADE_URL = "https://web.gopocket.in";

export interface ShowcaseTab {
  id: string;
  label: string;
  icon: AstroComponent;
  image: string;
  alt: string;
}

/**
 * The web-*.webp captures are 1440x812: the original 1440x900 screenshots
 * (kept alongside them) with the desktop browser's tab strip and address bar
 * cut off the top 88px, so no crop setting can ever bring it back into view.
 */
export const showcaseTabs: ShowcaseTab[] = [
  {
    id: "strategy-builder",
    label: "Strategy Builder",
    icon: Workflow,
    image: "/assets/images/gopocket/web-strategy-builder.webp",
    alt: "Strategy builder with an options payoff graph, max profit, max loss, breakeven and strategy Greeks",
  },
  {
    id: "layout",
    label: "Customizable Layout",
    icon: LayoutGrid,
    image: "/assets/images/gopocket/web-customizable-layout.webp",
    alt: "Customizable web app layout with option charts, OI statistics and a strategy builder side by side",
  },
  {
    id: "option-chain",
    label: "Option Chain",
    icon: Sheet,
    image: "/assets/images/gopocket/web-option-chain.webp",
    alt: "Option chain with call and put OI, LTP and Greeks for each NIFTY strike",
  },
  {
    id: "quick-trade",
    label: "Quick Trade",
    icon: Zap,
    image: "/assets/images/gopocket/web-quick-trade.webp",
    alt: "Quick Trade screen with call, put and spot charts and one-click buy and sell buttons",
  },
  {
    id: "screener",
    label: "Screener",
    icon: Funnel,
    image: "/assets/images/gopocket/web-screener.webp",
    alt: "Options screener ranking NIFTY contracts by open interest, OI change and volume",
  },
];

export interface Highlight {
  icon: AstroComponent;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  width: number;
  height: number;
  /** object-position for the card's crop - the card is much narrower than the capture. */
  focus: string;
}

export const highlights: Highlight[] = [
  {
    icon: Zap,
    title: "Trade Faster",
    description:
      "Buy or sell calls and puts in one click from Quick Trade, set lots and order type inline, and exit every position at once.",
    image: "/assets/images/gopocket/web-quick-trade.webp",
    imageAlt: "Quick Trade panel with one-click Buy Call, Sell Call, Buy Put, Sell Put and Exit all buttons",
    width: 1440,
    height: 812,
    focus: "12% 100%",
  },
  {
    icon: LayoutGrid,
    title: "Build Your Layout",
    description:
      "Arrange charts, OI statistics and the strategy builder side by side, and save as many layouts as you need.",
    image: "/assets/images/gopocket/web-customizable-layout.webp",
    imageAlt: "Customizable web app layout with option charts, OI statistics and a strategy builder side by side",
    width: 1440,
    height: 812,
    focus: "50% 50%",
  },
  {
    icon: Workflow,
    title: "Plan Every Strategy",
    description:
      "Build multi-leg options strategies and see the payoff graph, max profit, max loss and breakeven before you place a trade.",
    image: "/assets/images/gopocket/web-strategy-builder.webp",
    imageAlt: "Strategy builder payoff graph with max profit, max loss and breakeven",
    width: 1440,
    height: 812,
    focus: "48% 50%",
  },
];

export interface Partner {
  name: string;
  logo: string;
  width: number;
  height: number;
}

export const partners: Partner[] = [
  { name: "NSE", logo: "/assets/images/exchanges/nse.svg", width: 120, height: 40 },
  { name: "BSE", logo: "/assets/images/exchanges/bse.svg", width: 120, height: 40 },
  { name: "MCX", logo: "/assets/images/exchanges/mcx.svg", width: 120, height: 40 },
  { name: "CDSL", logo: "/assets/images/exchanges/cdsl.svg", width: 120, height: 40 },
  { name: "SEBI", logo: "/assets/images/exchanges/sebi.png", width: 120, height: 40 },
];

export interface Feature {
  title: string;
  description: string;
  tags: string[];
  image: string;
  imageAlt: string;
  /** object-position for the card's crop, aimed at the part of the screen the copy is about. */
  focus: string;
}

export const features: Feature[] = [
  {
    title: "Option Chain",
    description:
      "Every strike on one screen: call and put OI, LTP and PCR, with Greeks and IV a toggle away. Max pain and India VIX sit up top, and you can buy or sell straight from any strike or add it to a basket.",
    tags: ["OI & PCR", "Greeks & IV", "Max pain", "Basket mode"],
    image: "/assets/images/gopocket/web-option-chain.webp",
    imageAlt: "Option chain showing call and put OI, LTP, PCR and Greeks for each NIFTY strike",
    focus: "50% 100%",
  },
  {
    title: "Strategy Builder",
    description:
      "Build a multi-leg options strategy and see its payoff before you trade. Max profit, max loss, breakeven, margin and strategy Greeks update as you add legs, or start from a ready-made bullish, bearish or neutral strategy.",
    tags: ["Payoff graph", "Prebuilt strategies", "Strategy Greeks", "Margin"],
    image: "/assets/images/gopocket/web-strategy-builder.webp",
    imageAlt: "Strategy builder with a payoff graph, max profit, max loss, breakeven and strategy Greeks",
    focus: "45% 100%",
  },
  {
    title: "Screener",
    description:
      "Find where the action is in seconds. Rank contracts by highest OI, OI gainers and losers, top value, top volume or price movers, and sort any column to dig deeper.",
    tags: ["Highest OI", "OI gainers & losers", "Top volume", "Price movers"],
    image: "/assets/images/gopocket/web-screener.webp",
    imageAlt: "Options screener ranking NIFTY contracts by open interest, OI change and volume",
    focus: "20% 100%",
  },
];

export interface Testimonial {
  quote: string;
  name: string;
  location: string;
  image: string;
}

export const testimonials: Testimonial[] = [
  {
    quote:
      "For two decades I wanted to trade but couldn't find the right platform. A friend introduced me to GoPocket, and now I trade safely on an easy-to-use app.",
    name: "Vijaya Kumar",
    location: "Erode",
    image: "/assets/images/testimonials/customer-01.jpg",
  },
  {
    quote:
      "Hello, GoPocket gives a low brokerage charge and good service. User-friendly app and providing good customer service.",
    name: "Mohana Sundaram",
    location: "Vellore",
    image: "/assets/images/testimonials/customer-05.jpg",
  },
  {
    quote:
      "I am new to trading and chose GoPocket, a good choice. Customer support is excellent and always available to help. Happy to be a GoPocket user.",
    name: "Padmavathi",
    location: "Tirupur",
    image: "/assets/images/testimonials/customer-02.jpg",
  },
  {
    quote:
      "GoPocket offers good customer support and a safe app. As a beginner learning the stock market, it is very helpful for me. Thank you GoPocket!",
    name: "Lakshmi Narayanan",
    location: "Coimbatore",
    image: "/assets/images/testimonials/customer-06.jpg",
  },
  {
    quote:
      "I have been with GoPocket for over a year. I used to invest in commodities; now I trade securities and equities. Thanks GoPocket for your support.",
    name: "Ajay Karthik",
    location: "Chennai",
    image: "/assets/images/testimonials/customer-04.jpg",
  },
  {
    quote:
      "I used Sky for a few years and now use GoPocket. The app is user-friendly, easy to place orders on and secure for investment. Thank you GoPocket.",
    name: "Arokianathan",
    location: "Coimbatore",
    image: "/assets/images/testimonials/customer-09.jpg",
  },
];

/** Icons on the two orbit rings of the "everything in one place" section. */
export const orbitOuter: { icon: AstroComponent; label: string }[] = [
  { icon: TrendingUp, label: "Stocks" },
  { icon: Layers, label: "F&O" },
  { icon: PiggyBank, label: "Mutual funds" },
  { icon: Rocket, label: "IPO" },
  { icon: Landmark, label: "Bonds" },
  { icon: Gem, label: "Commodities" },
];

export const orbitInner: { icon: AstroComponent; label: string }[] = [
  { icon: Coins, label: "ETFs" },
  { icon: Bell, label: "Alerts" },
  { icon: ChartCandlestick, label: "Charts" },
  { icon: Wallet, label: "Funds" },
];

export interface ExploreCard {
  icon: AstroComponent;
  title: string;
  href: string;
  image: string;
  imageAlt: string;
}

export const exploreCards: ExploreCard[] = [
  {
    icon: BadgeIndianRupee,
    title: "See our brokerage charges: a flat fee per order, with no hidden costs",
    href: "/pricing",
    image: "/assets/images/integration-card-1-3.webp",
    imageAlt: "",
  },
  {
    icon: Download,
    title: "Prefer an app? Download GoPocket for Android, iOS and desktop",
    href: "/downloads",
    image: "/assets/images/integration-card-2-1.webp",
    imageAlt: "",
  },
  {
    icon: Code,
    title: "Automate your strategy with the GoPocket trading APIs",
    href: "/gopocket-api",
    image: "/assets/images/integration-card-3-1.webp",
    imageAlt: "",
  },
  {
    icon: GraduationCap,
    title: "New to the markets? Learn step by step with free courses",
    href: "/courses",
    image: "/assets/images/integration-card-4-2.webp",
    imageAlt: "",
  },
  {
    icon: Calculator,
    title: "Plan every trade with the brokerage and margin calculators",
    href: "/brokerage-calculator",
    image: "/assets/images/ai-automation-4.webp",
    imageAlt: "",
  },
];
