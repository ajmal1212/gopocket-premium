import type { Faq } from "@/components/FAQSection.astro";
import type { MoverKind } from "@/lib/market-movers";

interface MoversCopy {
  path: string;
  title: string;
  description: string;
  heading: string;
  /** The toggle's label for this side. */
  label: string;
  about: string[];
  faqs: Faq[];
}

export const MOVERS_COPY: Record<MoverKind, MoversCopy> = {
  gainers: {
    path: "/markets/top-gainers",
    title: "Top Gainers Today – NSE Stocks Up the Most | GoPocket",
    description:
      "Today's top gaining stocks on the NSE across Nifty 50, Bank Nifty, Nifty Next 50 and F&O. Live price, % change and ₹ change.",
    heading: "Top gainers today",
    label: "Top gainers",
    about: [
      "Top gainers are the stocks with the largest percentage rise over their previous close in the current session. The list is ranked by % change, so a small company moving 10% will sit above a large one moving 3%.",
      "Filter by index to see the leaders within Nifty 50, Bank Nifty or Nifty Next 50, or switch to F&O stocks for names you can also trade in derivatives. A sharp rise can reverse just as quickly, so find out why a stock moved before acting on it.",
    ],
    faqs: [
      {
        question: "What are top gainers in the stock market?",
        answer:
          "Top gainers are the stocks that have risen the most in percentage terms compared with their previous day's closing price. They are ranked by % change during the current trading session.",
      },
      {
        question: "How often is the top gainers list updated?",
        answer:
          "The list follows NSE's snapshot, which refreshes through market hours (9:15 AM to 3:30 PM IST). Outside market hours it shows the last session's final movers.",
      },
      {
        question: "Should I buy a stock because it is a top gainer?",
        answer:
          "A place on the list only tells you a stock moved sharply today, not why or whether it will continue. Check the news, volume and the company's fundamentals before investing.",
      },
      {
        question: "How can I buy top gaining stocks?",
        answer:
          "Open a free GoPocket demat account, search for the stock and place a delivery or intraday order. Delivery trades are free and intraday trades cost a flat ₹20 per order.",
      },
    ],
  },
  losers: {
    path: "/markets/top-losers",
    title: "Top Losers Today – NSE Stocks Down the Most | GoPocket",
    description:
      "Today's top losing stocks on the NSE across Nifty 50, Bank Nifty, Nifty Next 50 and F&O. Live price, % change and ₹ change.",
    heading: "Top losers today",
    label: "Top losers",
    about: [
      "Top losers are the stocks with the largest percentage fall from their previous close in the current session. The list is ranked by % change, so the steepest decline sits at the top regardless of the company's size.",
      "Filter by index to see the laggards within Nifty 50, Bank Nifty or Nifty Next 50, or switch to F&O stocks. A heavy fall on high volume often follows news or results; on low volume it may simply be a thin market.",
    ],
    faqs: [
      {
        question: "What are top losers in the stock market?",
        answer:
          "Top losers are the stocks that have fallen the most in percentage terms compared with their previous day's closing price. They are ranked by % change during the current trading session.",
      },
      {
        question: "How often is the top losers list updated?",
        answer:
          "The list follows NSE's snapshot, which refreshes through market hours (9:15 AM to 3:30 PM IST). Outside market hours it shows the last session's final movers.",
      },
      {
        question: "Is it a good idea to buy top losers?",
        answer:
          "A sharp fall can be an opportunity or a warning. Find out why the stock dropped - results, news, a sector-wide move - before treating a lower price as good value.",
      },
      {
        question: "How can I trade stocks on the top losers list?",
        answer:
          "Open a free GoPocket demat account to buy for delivery, or trade intraday for a flat ₹20 per order. F&O stocks can also be traded through futures and options.",
      },
    ],
  },
};
