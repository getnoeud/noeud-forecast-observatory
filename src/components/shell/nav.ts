import {
  ActivityIcon,
  BookOpenIcon,
  BrainCircuitIcon,
  DatabaseIcon,
  LandmarkIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  ServerCogIcon,
  TargetIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: typeof ActivityIcon;
  blurb: string;
};

export const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Forecast",
    items: [
      {
        title: "Overview",
        url: "/",
        icon: LayoutDashboardIcon,
        blurb: "Everything the pipeline produced in one screen",
      },
      {
        title: "Forward Forecast",
        url: "/forecast",
        icon: LineChartIcon,
        blurb: "The live 30-day probabilistic path for each pair",
      },
      {
        title: "Forecast Accuracy",
        url: "/accuracy",
        icon: TargetIcon,
        blurb: "Matured target dates scored against realised rates",
      },
      {
        title: "Commercial Rates",
        url: "/commercial",
        icon: LandmarkIcon,
        blurb: "Ghana bank rate cards beside the provider rate and the forecasts",
      },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        title: "Event Intelligence",
        url: "/intelligence",
        icon: BrainCircuitIcon,
        blurb: "Retrieval, evidence, and the LLM's bounded decision",
      },
      {
        title: "Model Lineage",
        url: "/models",
        icon: ActivityIcon,
        blurb: "Vintages, model identity, and promotion state",
      },
    ],
  },
  {
    label: "Foundations",
    items: [
      {
        title: "Market History",
        url: "/market",
        icon: DatabaseIcon,
        blurb: "Five years of calendar-day rates and their diagnostics",
      },
      {
        title: "Operations",
        url: "/operations",
        icon: ServerCogIcon,
        blurb: "Pipeline runs, provider ingestion, and leases",
      },
      {
        title: "Methodology",
        url: "/methodology",
        icon: BookOpenIcon,
        blurb: "How every number on this dashboard is produced",
      },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

export function navItemFor(pathname: string): NavItem | undefined {
  if (pathname === "/") return NAV_ITEMS.find((item) => item.url === "/");
  return NAV_ITEMS.filter((item) => item.url !== "/").find(
    (item) => pathname === item.url || pathname.startsWith(`${item.url}/`),
  );
}
