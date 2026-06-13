import { heroui } from "@heroui/react";

export default heroui({
  themes: {
    light: {
      colors: {
        //@ts-expect-error this is a custom color name
        "secondary-background": "#F4F4F5",
        surface: "#FAFAFA",
        "surface-elevated": "#FFFFFF",
        "border-subtle": "#E4E4E7",
      },
    },
    dark: {
      colors: {
        background: "#0D0C0F",
        //@ts-expect-error this is a custom color name
        "secondary-background": "#18181B",
        surface: "#131217",
        "surface-elevated": "#1A191E",
        "border-subtle": "#27272A",
      },
    },
  },
});
