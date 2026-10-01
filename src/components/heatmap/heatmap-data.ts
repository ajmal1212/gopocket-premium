import type { Faq } from "@/components/FAQSection.astro";

export const HEATMAP_COPY = {
  path: "/markets/heatmap",
  title: "Stock Heatmap – Nifty 50 Live Heat Map by Sector | GoPocket",
  description:
    "Live stock market heatmap of Nifty 50, Nifty Bank, Nifty Next 50 and more. See every stock's change today, grouped by sector and sized by market cap.",
  heading: "Stock Heatmap",
  intro:
    "See the whole index at a glance. Each tile is a stock, sized by its market cap and coloured by how far it has moved today - green for up, red for down. Hover a tile for its intraday chart, or pick another index.",
  about: [
    {
      heading: "How to read the heatmap",
      body: "Stocks are grouped by sector and sized by market capitalisation, so the largest companies take up the most space. The colour shows the day's change against the previous close: the deeper the green or red, the bigger the move.",
    },
    {
      heading: "Spot sector moves",
      body: "Because stocks sit with their sector, a broad move stands out immediately - a block of green across banks, or red across IT. A single tile against its neighbours points to stock-specific news rather than a sector trend.",
    },
    {
      heading: "Where the data comes from",
      body: "Prices are from the NSE. During market hours, 9:15 AM to 3:30 PM IST, the map shows the latest prices each time you open it or switch index; outside market hours it shows the last session's closing change.",
    },
  ],
  faqs: [
    {
      question: "What is a stock market heatmap?",
      answer:
        "A stock market heatmap shows many stocks at once as coloured tiles. The size of each tile reflects the company's market capitalisation and the colour reflects its price change - green for gains, red for losses - so you can read the market's mood in seconds.",
    },
    {
      question: "Why are some tiles bigger than others?",
      answer:
        "Tiles are sized by market capitalisation. Larger companies such as Reliance, HDFC Bank and TCS take up more space because they carry more weight in the index and move it more.",
    },
    {
      question: "How often does the heatmap update?",
      answer:
        "The heatmap shows the latest prices each time you open the page or switch index during market hours - reload the page for an update. Outside market hours it shows each stock's change at the last session's close.",
    },
    {
      question: "Which indices can I view on the heatmap?",
      answer:
        "You can switch between Nifty 50, Nifty Bank, Nifty Financial Services, Nifty Next 50, Nifty Midcap Select and Nifty FPI 150. You can also pick an industry, such as Finance or IT - Software, to see every NSE-listed stock in it grouped by market cap.",
    },
    {
      question: "What does the colour of a tile mean?",
      answer:
        "Green tiles are trading above their previous close and red tiles below it. Grey tiles have moved less than half a percent either way. The legend shows the percentage each shade stands for.",
    },
  ] satisfies Faq[],
};
