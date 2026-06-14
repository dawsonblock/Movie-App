"use client";

import { useEffect, useState, useTransition } from "react";
import { BsBookmarkCheckFill, BsBookmarkFill } from "react-icons/bs";
import { addToast } from "@heroui/react";
import IconButton from "./IconButton";
import { Trash } from "@/utils/icons";
import useDeviceVibration from "@/hooks/useDeviceVibration";
import { SavedMovieDetails } from "@/types/movie";
import {
  addToWatchlist,
  removeFromWatchlist,
  checkInWatchlist,
} from "@/actions/library";
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
    let isMounted = true;
    
    const checkWatchlistStatus = async () => {
      setIsChecking(true);
      const result = await checkInWatchlist(data.id, data.type);
      if (isMounted && result.success) {
        setIsSaved(result.isInWatchlist);
      }
      if (isMounted) {
        setIsChecking(false);
      }
    };
    
    checkWatchlistStatus();
    
    return () => {
      isMounted = false;
    };
  }, [data.id, data.type]);

  const handleBookmark = async () => {
    startTransition(async () => {
      if (isSaved) {
        const result = await removeFromWatchlist(data.id, data.type);
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
        const result = await addToWatchlist({
          id: data.id,
          type: data.type,
          adult: data.adult,
          backdrop_path: data.backdrop_path,
          poster_path: data.poster_path,
          release_date: data.release_date,
          title: data.title,
          vote_average: data.vote_average,
        });
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
