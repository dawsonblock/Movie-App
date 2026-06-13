"use client";

import BackButton from "@/components/ui/button/BackButton";
import { siteConfig } from "@/config/site";
import { cn } from "@/utils/helpers";
import { Kbd, Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/react";
import { useWindowScroll } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import FullscreenToggleButton from "../button/FullscreenToggleButton";
import UserProfileButton from "../button/UserProfileButton";
import ThemeSwitchDropdown from "../input/ThemeSwitchDropdown";
import BrandLogo from "../other/BrandLogo";

const TopNavbar = () => {
  const pathName = usePathname();
  const [kbdLabel, setKbdLabel] = useState("CTRL+K");
  const [{ y }] = useWindowScroll();

  useEffect(() => {
    setKbdLabel(/macintosh|mac os x/i.test(navigator.userAgent) ? "CMD+K" : "CTRL+K");
  }, []);
  const opacity = Math.min((y / 1000) * 5, 1);
  const hrefs = siteConfig.navItems.map((item) => item.href);
  const show = hrefs.includes(pathName);
  const tv = pathName.includes("/tv/");
  const player = pathName.includes("/player");
  const auth = pathName.includes("/auth");

  if (auth || player) return null;

  return (
    <Navbar
      disableScrollHandler
      isBlurred={false}
      position="sticky"
      maxWidth="full"
      classNames={{ wrapper: "px-2 md:px-4 lg:px-6" }}
      className={cn(
        "app-region-drag inset-0 h-min border-b border-transparent bg-transparent backdrop-blur-xl transition-colors",
        {
          "border-white/5 bg-background/70": show,
        }
      )}
    >
      {!show && (
        <div
          className="absolute inset-0 h-full w-full border-b border-white/5 bg-background/70"
          style={{ opacity }}
        />
      )}
      <NavbarBrand className="app-region-no-drag">
        {show ? <BrandLogo /> : <BackButton href={tv ? "/?content=tv" : "/"} />}
      </NavbarBrand>
      {show && !pathName.startsWith("/search") && (
        <NavbarContent className="hidden w-full max-w-xl gap-2 md:flex" justify="center">
          <NavbarItem className="w-full">
            <Link
              href="/search"
              className="app-region-no-drag group flex w-full items-center gap-2 rounded-full bg-secondary-background px-4 py-2 text-sm text-foreground-400 transition-colors hover:bg-secondary-background/80 hover:text-foreground"
            >
              <FaSearch className="size-4" />
              <span className="flex-1 text-left">Search your favorite movies...</span>
              <Kbd className="hidden md:inline-block">{kbdLabel}</Kbd>
            </Link>
          </NavbarItem>
        </NavbarContent>
      )}
      <NavbarContent justify="end" className="app-region-no-drag">
        <NavbarItem className="flex gap-1">
          <ThemeSwitchDropdown />
          <FullscreenToggleButton />
          <UserProfileButton />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};

export default TopNavbar;
