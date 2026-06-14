"use client";

import { useEffect, useState, useTransition } from "react";
import { BsBookmarkCheckFill, BsBookmarkFill } from "react-icons/bs";
import { addToast } from "@heroui/react";
import IconButton from "./IconButton";
import { Trash } from "@/utils/icons";
import useDeviceVibration from "@/hooks/useDeviceVibration";
import { SavedMovieDetails } from "@/types/movie";
import {
  addToLibrary,
  removeFromLibrary,
  checkInLibrary,
} from "@/utils/localStorage/library";
import { queryClient } from "@/app/providers";
import { usePathname } from "next/navigation";

interface BookmarkButtonProps {
  data: SavedMovieDetails;
  isTooltipDisabled?: boolean;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ data, isTooltipDisabled }) => {
  const pathname = usePathname();
  const { startVibration } = useDeviceVibration();
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    setIsChecking(true);
    const result = checkInLibrary(data.id, data.type);
    if (result.success) {
      setIsSaved(result.isInLibrary);
    }
    setIsChecking(false);
  }, [data.id, data.type]);

  const handleBookmark = () => {
    startTransition(() => {
      if (isSaved) {
        const result = removeFromLibrary(data.id, data.type);
        if (result.success) {
          setIsSaved(false);
          addToast({
            title: `${data.title} removed from your watchlist!`,
            color: "danger",
            icon: <Trash />,
          });
          if (pathname.startsWith("/library")) {
            queryClient.invalidateQueries({ queryKey: ["watchlist"] });
          }
        } else {
          addToast({
            title: "Error",
            description: result.error || "Failed to remove from watchlist",
            color: "danger",
          });
        }
      } else {
        const result = addToLibrary(data);
        if (result.success) {
          setIsSaved(true);
          startVibration([100]);
          addToast({
            title: `${data.title} added to your watchlist!`,
            color: "success",
          });
        } else if (result.error === "This item is already in your watchlist") {
          setIsSaved(true);
          addToast({
            title: "Already in watchlist",
            description: `${data.title} is already in your watchlist`,
            color: "warning",
          });
        } else {
          addToast({
            title: "Error",
            description: result.error || "Failed to add to watchlist",
            color: "danger",
          });
        }
      }
    });
  };

  return (
    <IconButton
      onPress={handleBookmark}
      icon={isSaved ? <BsBookmarkCheckFill size={20} /> : <BsBookmarkFill size={20} />}
      variant={isSaved ? "shadow" : "faded"}
      color="warning"
      isLoading={isChecking || isPending}
      tooltip={
        isTooltipDisabled ? undefined : isSaved ? "Remove from Watchlist" : "Add to Watchlist"
      }
    />
  );
};

export default BookmarkButton;
