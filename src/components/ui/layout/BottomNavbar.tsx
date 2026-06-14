"use client";

import { siteConfig } from "@/config/site";
import clsx from "clsx";
import { Link } from "@heroui/link";
import { usePathname } from "next/navigation";
import { Chip } from "@heroui/chip";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { User } from "@/utils/icons";

const BottomNavbar = () => {
  const pathName = usePathname();
  const { data: user } = useSupabaseUser();
  const hrefs = siteConfig.navItems.map((item) => item.href);
  const show = hrefs.includes(pathName);

  return (
    show && (
      <>
        <div className="pt-20 md:hidden" />
        <div className="fixed bottom-0 left-0 z-50 block h-fit w-full translate-y-px border-t border-secondary-background bg-background py-2 md:hidden">
          <div className="mx-auto grid h-full max-w-lg grid-cols-5">
            {siteConfig.navItems.filter((item) => item.showInBottomNav !== false).map((item) => {
              const isActive = pathName === item.href;
              return (
                <Link
                  href={item.href}
                  key={item.href}
                  className="flex items-center justify-center text-foreground"
                >
                  <div className="flex max-h-[50px] flex-col items-center justify-center">
                    <Chip
                      size="lg"
                      variant={isActive ? "solid" : "light"}
                      classNames={{
                        base: "py-[2px] transition-all",
                        content: "size-full",
                      }}
                    >
                      {isActive ? item.activeIcon : item.icon}
                    </Chip>
                    <p className={clsx("text-[10px]", { "font-bold": isActive })}>{item.label}</p>
                  </div>
                </Link>
              );
            })}
            <Link
              href="/auth"
              className="flex items-center justify-center text-foreground"
            >
              <div className="flex max-h-[50px] flex-col items-center justify-center">
                <Chip
                  size="lg"
                  variant={user ? "light" : "solid"}
                  color={user ? "default" : "primary"}
                  classNames={{
                    base: "py-[2px] transition-all",
                    content: "size-full",
                  }}
                >
                  <User className="size-full" />
                </Chip>
                <p className={clsx("text-[10px]", { "font-bold": !user })}>{user ? "Profile" : "Sign In"}</p>
              </div>
            </Link>
          </div>
        </div>
      </>
    )
  );
};

export default BottomNavbar;
