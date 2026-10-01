import {
  CalendarHeart, Gift, LayoutDashboard, Luggage, Map as MapIcon,
  NotebookPen, Settings, Users, Wallet, type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  mobile?: boolean; // shown in the bottom tab bar
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard, mobile: true },
  { href: "/roadmap", label: "Roadmap", icon: MapIcon, mobile: true },
  { href: "/co-pilot", label: "Co-Pilot", icon: Users },
  { href: "/appointments", label: "Appointments", icon: CalendarHeart, mobile: true },
  { href: "/questions", label: "Doctor questions", icon: NotebookPen },
  { href: "/budget", label: "Budget", icon: Wallet, mobile: true },
  { href: "/registry", label: "Registry", icon: Gift },
  { href: "/hospital-bag", label: "Hospital bag", icon: Luggage, mobile: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
