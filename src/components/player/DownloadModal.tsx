"use client";

import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import { DownloadSource } from "@/utils/downloads";
import { Copy, ExternalLink } from "@/utils/icons";
import { addToast, Button } from "@heroui/react";
import { useCallback } from "react";

interface DownloadModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  sources: DownloadSource[];
}

export function DownloadModal({ open, onClose, title, sources }: DownloadModalProps) {
  const copyToClipboard = useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(url);
        addToast({
          title: "URL copied to clipboard",
          color: "success",
        });
      } catch {
        addToast({
          title: "Failed to copy URL",
          color: "danger",
        });
      }
    },
    [],
  );

  return (
    <VaulDrawer
      open={open}
      onClose={onClose}
      backdrop="blur"
      title="Download"
      direction="right"
      hiddenHandler
      withCloseButton
      classNames={{ content: "space-y-0" }}
    >
      <div className="flex flex-col gap-5 p-5">
        <p className="text-sm text-gray-400">
          Direct downloads are not available from streaming embeds. Search for{" "}
          <span className="font-semibold text-white">&quot;{title}&quot;</span> on the sites below
          and paste the magnet link into your torrent client.
        </p>

        <div className="flex flex-col gap-3">
          {sources.map((source) => (
            <div
              key={source.name}
              className="flex items-center gap-3 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{source.name}</p>
                <p className="truncate text-xs text-gray-400">{source.url}</p>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label={`Copy ${source.name} URL`}
                onPress={() => copyToClipboard(source.url)}
              >
                <Copy size={18} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label={`Open ${source.name}`}
                onPress={() => {
                  // In Electron, external navigation is blocked for security.
                  // We copy the URL so the user can paste it into their browser.
                  copyToClipboard(source.url);
                }}
              >
                <ExternalLink size={18} />
              </Button>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-yellow-500/10 p-3 text-xs text-yellow-200">
          <p className="font-semibold">Disclaimer</p>
          <p>
            Downloading copyrighted content may be illegal in your jurisdiction. Ensure you have
            the right to download this content before proceeding.
          </p>
        </div>
      </div>
    </VaulDrawer>
  );
}
