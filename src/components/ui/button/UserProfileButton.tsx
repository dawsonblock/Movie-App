import useBreakpoints from "@/hooks/useBreakpoints";
import { User } from "@/utils/icons";
import {
  Button,
  Avatar,
} from "@heroui/react";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { useRouter } from "next/navigation";

const UserProfileButton: React.FC = () => {
  const { mobile } = useBreakpoints();
  const { data: user, isLoading } = useSupabaseUser();
  const router = useRouter();

  const handleClick = () => {
    router.push("/auth");
  };

  const displayName = user?.username || "Guest";
  const avatarText = displayName.charAt(0).toUpperCase();

  return (
    <Button
      title="Profile"
      variant="light"
      isIconOnly={mobile}
      onPress={handleClick}
      endContent={
        <Avatar
          showFallback
          className="size-7"
          fallback={<User className="text-xl" />}
        >
          {avatarText}
        </Avatar>
      }
      className="min-w-fit"
      isLoading={isLoading}
    >
      <p className="hidden max-w-32 truncate md:block lg:max-w-56">{displayName}</p>
    </Button>
  );
};

export default UserProfileButton;
