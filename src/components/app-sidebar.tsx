"use client";

import * as React from "react";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  ActivityIcon,
  BarChart3Icon,
  CalendarIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  SearchIcon,
  Settings2Icon,
} from "lucide-react";

const data = {
  user: {
    name: "ML Team",
    email: "ml-ops@noeud.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Overview",
      url: "/",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Reports",
      url: "/reports/weekly",
      icon: <CalendarIcon />,
    },
    {
      title: "Pair Review",
      url: "/pairs/USDGHS?horizon=7",
      icon: <BarChart3Icon />,
    },
  ],
};
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [pairReviewUrl, setPairReviewUrl] = React.useState("/pairs/USDGHS?horizon=7");

  React.useEffect(() => {
    const raw = window.localStorage.getItem("observatory:lastPairReview");
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { pair?: string; horizon?: number };
      if (parsed.pair) {
        setPairReviewUrl(`/pairs/${parsed.pair}?horizon=${parsed.horizon ?? 7}`);
      }
    } catch {
      // Ignore malformed local state and fall back to the default entry.
    }
  }, []);

  const navMain = data.navMain.map((item) =>
    item.title === "Pair Review" ? { ...item, url: pairReviewUrl } : item,
  );

  const navSecondary = [
    {
      title: "Settings",
      url: "/settings",
      icon: <Settings2Icon />,
    },
    {
      title: "Help",
      url: "/help",
      icon: <HelpCircleIcon />,
    },
    {
      title: "Monthly Reports",
      url: "#",
      icon: <CalendarIcon />,
      disabled: true,
    },
    {
      title: "Investor View",
      url: "#",
      icon: <SearchIcon />,
      disabled: true,
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/" />}
            >
              <ActivityIcon className="size-5!" />
              <span className="text-base font-semibold">Noeud Observatory</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
