import type { Faq } from "@/components/FAQSection.astro";

export const FII_DII_COPY = {
  path: "/fii-dii-activity",
  title: "FII DII Data Today – FII & DII Trading Activity in Cash Market | GoPocket",
  description:
    "Daily, weekly and monthly FII and DII trading activity in the Indian cash market. Gross buy, gross sell and net buy/sell figures in ₹ crore, with charts.",
  heading: "FII and DII Trading Activity",
  intro:
    "FII and DII data shows how much foreign and domestic institutions bought and sold in India's cash market. Net buying means more money flowed in than out; net selling means the reverse. Track the daily figures, or switch to weekly and monthly totals to see the trend.",
  about: [
    {
      heading: "Who are FIIs and DIIs?",
      body: "Foreign Institutional Investors (FIIs), now registered with SEBI as Foreign Portfolio Investors, are overseas funds, banks and insurers investing in Indian markets. Domestic Institutional Investors (DIIs) are Indian mutual funds, insurance companies, banks and pension funds.",
    },
    {
      heading: "How to read the figures",
      body: "Gross buy and gross sell are the total value of shares each group bought and sold in the cash segment. Net buy/sell is the difference: a positive number means the group was a net buyer, a negative number a net seller. All values are in ₹ crore.",
    },
    {
      heading: "Why it matters",
      body: "Institutions trade in large amounts, so their flows can move the market. Sustained FII selling has often coincided with weakness in the rupee and in large-cap stocks, while steady DII buying - much of it from monthly SIP inflows - has cushioned those falls. Flows are one input among many, not a trading signal on their own.",
    },
  ],
  faqs: [
    {
      question: "What is FII and DII data?",
      answer:
        "FII and DII data is the daily record of how much Foreign Institutional Investors and Domestic Institutional Investors bought and sold in the Indian cash market, published as gross buy, gross sell and net buy/sell values in ₹ crore.",
    },
    {
      question: "When is FII and DII data released?",
      answer:
        "The exchanges publish provisional FII and DII figures for the cash market after trading closes each day, usually in the evening. This page updates once the day's figures are available.",
    },
    {
      question: "What does a negative FII net value mean?",
      answer:
        "A negative net value means FIIs sold more than they bought that day - they were net sellers and took money out of Indian equities. A positive value means they were net buyers.",
    },
    {
      question: "What is the difference between FII and DII?",
      answer:
        "FIIs are institutions based outside India, such as foreign mutual funds and pension funds. DIIs are Indian institutions, such as domestic mutual funds, insurance companies and banks. Their flows often move in opposite directions.",
    },
    {
      question: "Are the FII and DII figures final?",
      answer:
        "The daily figures are provisional and cover the cash market only. Final numbers, including derivatives and debt, are reported later by NSDL and the depositories and can differ slightly.",
    },
  ] satisfies Faq[],
};
