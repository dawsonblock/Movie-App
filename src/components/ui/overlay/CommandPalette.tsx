"use client";

import { siteConfig } from "@/config/site";
import { cn } from "@/utils/helpers";
import {
  Input,
  Kbd,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const pathName = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const navigationItems = useMemo(
    () =>
      siteConfig.navItems.map((item) => ({
        ...item,
        isActive: pathName === item.href,
      })),
    [pathName]
  );

  const filteredNav = useMemo(() => {
    if (!query.trim()) return navigationItems;
    const q = query.toLowerCase();
    return navigationItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [query, navigationItems]);

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      backdrop="blur"
      size="lg"
      classNames={{
        base: "bg-surface-elevated border border-white/10",
        header: "border-b border-white/5",
        body: "p-2",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-2">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
              if (e.key === "Escape") onClose();
            }}
            placeholder="Search movies, shows, or navigate..."
            startContent={<FaSearch className="text-default-400 size-4" />}
            endContent={<Kbd>ESC</Kbd>}
            classNames={{
              inputWrapper: "bg-secondary-background",
            }}
            aria-label="Command palette search"
            autoComplete="off"
          />
        </ModalHeader>
        <ModalBody>
          {query.trim() && (
            <button
              type="button"
              onClick={handleSearch}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary-background"
            >
              <FaSearch className="text-default-400 size-4" />
              <span>
                Search for <span className="font-semibold">&quot;{query}&quot;</span>
              </span>
            </button>
          )}

          <div className="flex flex-col gap-1">
            <p className="px-3 py-1 text-xs font-medium text-foreground-400 uppercase tracking-wider">
              Navigation
            </p>
            {filteredNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  item.isActive
                    ? "bg-secondary-background text-foreground"
                    : "text-foreground-400 hover:bg-secondary-background/50 hover:text-foreground"
                )}
              >
                <span className="flex size-5 items-center justify-center">
                  {item.isActive ? item.activeIcon : item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
