import useBreakpoints from "@/hooks/useBreakpoints";
import { User } from "@/utils/icons";
import {
  Button,
  Avatar,
} from "@heroui/react";

const UserProfileButton: React.FC = () => {
  const { mobile } = useBreakpoints();

  return (
    <Button
      title="Profile"
      variant="light"
      isIconOnly={mobile}
      endContent={
        <Avatar
          showFallback
          className="size-7"
          fallback={<User className="text-xl" />}
        />
      }
      className="min-w-fit"
    >
      <p className="hidden max-w-32 truncate md:block lg:max-w-56">Guest</p>
    </Button>
  );
};

export default UserProfileButton;
