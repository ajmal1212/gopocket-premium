/**
 * Every calculator on the site, in display order. Read by the calculator
 * sidebar (Popular Calculators) and the footer's Calculators column, so a new
 * calculator page is added here once and shows up in both.
 */

export type CalculatorId =
  "sip" | "lumpsum" | "swp" | "xirr" | "cagr" | "mf-returns" | "emi" | "car-loan" | "ppf" | "epf" | "brokerage";

export interface CalculatorLink {
  id: CalculatorId;
  label: string;
  href: string;
  /**
   * False for entries that point at another calculator's page - Lumpsum and
   * Mutual Fund Returns are tabs of the SIP calculator. The footer lists only
   * one link per page; the sidebar lists them all.
   */
  ownPage: boolean;
}

export const calculators: CalculatorLink[] = [
  { id: "sip", label: "SIP Calculator", href: "/sip-calculator", ownPage: true },
  { id: "lumpsum", label: "Lumpsum Calculator", href: "/sip-calculator", ownPage: false },
  { id: "swp", label: "SWP Calculator", href: "/swp-calculator", ownPage: true },
  { id: "xirr", label: "XIRR Calculator", href: "/xirr-calculator", ownPage: true },
  { id: "cagr", label: "CAGR Calculator", href: "/cagr-calculator", ownPage: true },
  { id: "mf-returns", label: "Mutual Fund Returns Calculator", href: "/sip-calculator", ownPage: false },
  { id: "emi", label: "EMI Calculator", href: "/emi-calculator", ownPage: true },
  { id: "car-loan", label: "Car Loan EMI Calculator", href: "/car-loan-emi-calculator", ownPage: true },
  { id: "ppf", label: "PPF Calculator", href: "/ppf-calculator", ownPage: true },
  { id: "epf", label: "EPF Calculator", href: "/epf-calculator", ownPage: true },
  { id: "brokerage", label: "Brokerage Calculator", href: "/brokerage-calculator", ownPage: true },
];
