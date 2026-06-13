"use client";

import { siteConfig } from "@/config/site";
import { cn } from "@/utils/helpers";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "../other/BrandLogo";

const Sidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathName = usePathname();
  const hrefs = siteConfig.navItems.map((item) => item.href);
  const shouldShowSidebar = hrefs.includes(pathName);

  return (
    <div className="flex h-full">
      {shouldShowSidebar && (
        <aside className="fixed left-0 top-0 z-30 hidden h-screen w-20 flex-col border-r border-white/5 bg-surface pt-8 transition-all duration-300 ease-out md:flex lg:w-56">
          <div className="app-region-drag flex h-16 shrink-0 items-center px-4 lg:px-6">
            <BrandLogo className="text-xl lg:text-2xl" />
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
            {siteConfig.navItems.map((item) => {
              const isActive = pathName === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-secondary-background text-foreground"
                      : "text-foreground-400 hover:bg-secondary-background/50 hover:text-foreground"
                  )}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center transition-transform group-hover:scale-110">
                    {isActive ? item.activeIcon : item.icon}
                  </span>
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      )}
      <div className={cn("flex-1", shouldShowSidebar && "md:ml-20 lg:ml-56")}>
        {children}
      </div>
    </div>
  );
};

export default Sidebar;
