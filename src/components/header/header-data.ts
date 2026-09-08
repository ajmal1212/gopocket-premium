import type { AstroComponent } from "@lucide/astro";
import Activity from "@lucide/astro/icons/activity";
import Banknote from "@lucide/astro/icons/banknote";
import BookOpen from "@lucide/astro/icons/book-open";
import Briefcase from "@lucide/astro/icons/briefcase";
import ChartPie from "@lucide/astro/icons/chart-pie";
import CreditCard from "@lucide/astro/icons/credit-card";
import DollarSign from "@lucide/astro/icons/dollar-sign";
import FileCheck from "@lucide/astro/icons/file-check";
import Globe from "@lucide/astro/icons/globe";
import Landmark from "@lucide/astro/icons/landmark";
import Mail from "@lucide/astro/icons/mail";
import MapPin from "@lucide/astro/icons/map-pin";
import RefreshCw from "@lucide/astro/icons/refresh-cw";
import Shield from "@lucide/astro/icons/shield";
import Smartphone from "@lucide/astro/icons/smartphone";
import SquareCheckBig from "@lucide/astro/icons/square-check-big";
import TrendingUp from "@lucide/astro/icons/trending-up";
import UserX from "@lucide/astro/icons/user-x";
import Zap from "@lucide/astro/icons/zap";

export interface MegaMenuEntry {
  icon: AstroComponent;
  title: string;
  description: string;
  href: string;
}

/** Learn mega-menu topics. All three point at the research hub for now. */
export const learnTopics: MegaMenuEntry[] = [
  {
    icon: TrendingUp,
    title: "Equity",
    description: "Master stock trading, investing & equity markets.",
    href: "/research-learn",
  },
  {
    icon: DollarSign,
    title: "Commodity",
    description: "Learn gold, crude oil & commodity trading.",
    href: "/research-learn",
  },
  {
    icon: BookOpen,
    title: "Learn",
    description: "Free trading courses, tutorials & market guides.",
    href: "/research-learn",
  },
];

/** Sign In mega-menu, top grid: the platforms a customer logs in to. */
export const signInServices: MegaMenuEntry[] = [
  {
    icon: Globe,
    title: "Web Trade",
    description: "Trade from your browser with our full web terminal.",
    href: "https://web.gopocket.in",
  },
  {
    icon: Briefcase,
    title: "Back office",
    description: "View contract notes, ledgers and account reports.",
    href: "https://bo.gopocket.in/shrdbms/userlogin.ss",
  },
  {
    icon: Landmark,
    title: "Bonds",
    description: "Explore and invest in government and corporate bonds.",
    href: "https://bonds.gopocket.in/",
  },
  {
    icon: ChartPie,
    title: "Mutual Funds",
    description: "Browse and invest in 40,000+ mutual fund schemes.",
    href: "https://mf.gopocket.in/",
  },
  {
    icon: Shield,
    title: "Insurance",
    description: "Protect what matters with GoPocket insurance plans.",
    href: "https://insure.gopocket.in/healthysure1/form/GoPocket/formperma/lS3_sxFO8rvdHISVIseXhlTTD_W66A98U4ot4iX2p0o",
  },
  {
    icon: Zap,
    title: "Insta Options",
    description: "Fast, simplified options trading in a few taps.",
    href: "https://gopocket.instaoptions.in/",
  },
  {
    icon: SquareCheckBig,
    title: "E-Voting (CDSL)",
    description: "Cast your vote as a shareholder via CDSL e-voting.",
    href: "https://evoting.cdslindia.com/Evoting/EvotingLogin",
  },
  {
    icon: CreditCard,
    title: "Payin",
    description: "Add funds to your trading account securely.",
    href: "https://pg.gopocket.in/Order",
  },
];

/** Sign In mega-menu, bottom grid: re-KYC / account modification journeys. */
export const signInRekycServices: MegaMenuEntry[] = [
  {
    icon: Smartphone,
    title: "Mobile Modification",
    description: "Update the mobile number linked to your account.",
    href: "https://re-kyc.gopocket.in/v1/company/gopocket/mobile_modification/login",
  },
  {
    icon: Mail,
    title: "Email Modification",
    description: "Update the email address linked to your account.",
    href: "https://re-kyc.gopocket.in/v1/company/gopocket/email_modification/login",
  },
  {
    icon: Banknote,
    title: "Bank Addition",
    description: "Add or change your linked bank account.",
    href: "https://re-kyc.gopocket.in/v1/company/gopocket/bank_modification/login",
  },
  {
    icon: Activity,
    title: "Segment Activation",
    description: "Enable new trading segments like F&O or currency.",
    href: "https://re-kyc.gopocket.in/v1/company/gopocket/segments_modification/login",
  },
  {
    icon: MapPin,
    title: "Address Updation",
    description: "Update your registered communication address.",
    href: "https://re-kyc.gopocket.in/v1/company/gopocket/address_modification/login",
  },
  {
    icon: TrendingUp,
    title: "Financial Updation",
    description: "Update your income and financial details on file.",
    href: "https://re-kyc.gopocket.in/v1/company/gopocket/annual_income_modification/login",
  },
  {
    icon: FileCheck,
    title: "DDPI (POA)",
    description: "Set up Demat Debit and Pledge Instruction online.",
    href: "https://re-kyc.gopocket.in/v1/company/gopocket/ddpi_modification/login",
  },
  {
    icon: RefreshCw,
    title: "Reactivation",
    description: "Reactivate a dormant or deactivated account.",
    href: "https://re-kyc.gopocket.in/v1/company/gopocket/reactivation/login",
  },
  {
    icon: UserX,
    title: "Account Closure",
    description: "Close your trading and demat account online.",
    href: "https://closure.gopocket.in/cloud_closure/closure/gopocket",
  },
];

export const headerLinks = {
  products: { href: "/products", label: "Products" },
  partner: { href: "/partner-with-us", label: "Partner With Us" },
  blog: { href: "/blog", label: "Blogs" },
  openAccount: { href: "/open-account-call-back?src=Website&tag=Menu", label: "Open Account" },
} as const;

export function isActivePath(currentPath: string, href: string) {
  return currentPath === href || currentPath === `${href}/`;
}
