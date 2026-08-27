import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  id: string;
  category: "General" | "Account" | "Trading & Charges" | "Safety & Support";
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: "item-1",
    category: "General",
    question: "What is GoPocket?",
    answer:
      "GoPocket is a next-generation online stock broking platform designed for Indian retail traders and investors. We provide lightning-fast order execution across Equities, Futures & Options (F&O), Commodities, Currencies, and IPOs with powerful charting tools and flat ₹20 brokerage.",
  },
  {
    id: "item-2",
    category: "Account",
    question: "How do I open a Demat & Trading account with GoPocket?",
    answer:
      "Opening an account with GoPocket is 100% digital and paperless! Click 'Open Account', submit your Aadhaar-linked mobile number, upload your PAN card and bank proof for instant e-KYC, and complete Aadhaar e-sign. Your account will be activated within a few hours.",
  },
  {
    id: "item-3",
    category: "Trading & Charges",
    question: "What are the account opening and AMC charges?",
    answer:
      "GoPocket charges ₹0 for Demat & Trading Account Opening. We also offer Zero Annual Maintenance Charges (AMC) for life. You only pay flat ₹20 per executed order for Intraday and F&O trades.",
  },
  {
    id: "item-4",
    category: "Trading & Charges",
    question: "What is the brokerage fee per trade?",
    answer:
      "We follow a transparent flat pricing model: Equity Delivery is ₹0 (Free). Equity Intraday, Futures & Options (F&O), and Commodities are charged flat ₹20 per executed order or 0.03% (whichever is lower).",
  },
  {
    id: "item-5",
    category: "Safety & Support",
    question: "Is GoPocket registered with SEBI?",
    answer:
      "Yes, GoPocket is registered with the Securities and Exchange Board of India (SEBI) and is an active member of NSE, BSE, MCX, and CDSL depository. All your securities are stored safely directly with CDSL/NSDL in your demat account.",
  },
  {
    id: "item-6",
    category: "Account",
    question: "How can I deposit and withdraw funds?",
    answer:
      "Fund transfers can be made 24/7 instantly via UPI, IMPS, or Net Banking without any hassle. Withdrawals placed before 8:00 PM on trading days are processed and credited to your registered bank account on the same day.",
  },
  {
    id: "item-7",
    category: "Trading & Charges",
    question: "Does GoPocket offer API access for Algorithmic Trading?",
    answer:
      "Yes! GoPocket provides free, developer-grade REST & WebSocket APIs for algo traders, quantitative funds, and strategy builders to place orders, fetch real-time ticks, and manage portfolios programmatically.",
  },
  {
    id: "item-8",
    category: "Safety & Support",
    question: "How can I contact GoPocket customer support?",
    answer:
      "Our support team is available Monday through Saturday from 8:30 AM to 6:30 PM. You can reach out to us via email at support@gopocket.in or call our toll-free customer helpline.",
  },
];

export default function FAQSection() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "General", "Account", "Trading & Charges", "Safety & Support"];

  const filteredFaqs =
    activeCategory === "All"
      ? faqData
      : faqData.filter((item) => item.category === activeCategory);

  return (
    <section className="relative py-16 md:py-24 overflow-hidden bg-gray-50/50">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12" data-aos="fade-up">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 text-base md:text-lg">
            Everything you need to know about trading, opening an account, charges, and security on GoPocket.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10" data-aos="fade-up" data-aos-delay="100">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-primary text-white shadow-md shadow-primary/25 scale-105"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-primary/40 hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Shadcn Accordion */}
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-xl shadow-gray-200/50" data-aos="fade-up" data-aos-delay="200">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {filteredFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="border-b border-gray-100 last:border-b-0 px-2 py-1 rounded-xl transition-colors hover:bg-gray-50/60"
              >
                <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-gray-900 hover:text-primary hover:no-underline py-4">
                  <span className="flex items-center gap-3">
                    <span className="flex-1">{faq.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-sm md:text-base leading-relaxed pt-1 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Support CTA Footer */}
        <div className="mt-12 text-center p-8 bg-gradient-to-r from-primary/5 via-purple-50 to-primary/5 rounded-3xl border border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-6" data-aos="fade-up">
          <div className="text-left">
            <h4 className="text-lg font-bold text-gray-900 mb-1">Still have questions?</h4>
            <p className="text-sm text-gray-600">Can't find the answer you're looking for? Please contact our friendly support team.</p>
          </div>
          <a
            href="/open-account-call-back?src=Website&tag=FAQ"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 shrink-0"
          >
            Open Free Account
          </a>
        </div>
      </div>
    </section>
  );
}
