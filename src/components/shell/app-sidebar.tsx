"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon, RadarIcon } from "lucide-react";

import { NAV_SECTIONS } from "@/components/shell/nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

function isActive(pathname: string, url: string) {
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/" />}
              className="h-11 data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <RadarIcon className="size-4" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="font-display truncate text-sm font-semibold">
                  Forecast Observatory
                </span>
                <span className="truncate text-[0.68rem] text-muted-foreground">
                  Noeud FX Intelligence
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV_SECTIONS.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-[0.65rem] tracking-[0.12em] uppercase">
              {section.label}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
              {section.items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    isActive={isActive(pathname, item.url)}
                    tooltip={item.title}
                    className="h-9 group-data-[collapsible=icon]:size-9!"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action="/logout" method="post" className="w-full">
              <SidebarMenuButton
                render={<button type="submit" />}
                tooltip="Sign out"
                className="h-9 w-full group-data-[collapsible=icon]:size-9!"
              >
                <LogOutIcon />
                <span>Sign out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
