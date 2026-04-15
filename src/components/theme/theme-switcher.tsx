"use client";

import { useSyncExternalStore } from "react";
import { LaptopMinimal, MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ThemeName = "light" | "dark" | "system";

const themeOptions: Array<{
  value: ThemeName;
  label: string;
  icon: typeof SunMedium;
}> = [
  { value: "light", label: "Светлая", icon: SunMedium },
  { value: "dark", label: "Темная", icon: MoonStar },
  { value: "system", label: "Системная", icon: LaptopMinimal },
];

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const activeTheme = (mounted ? theme : "system") as ThemeName;
  const activeOption =
    themeOptions.find((option) => option.value === activeTheme) ??
    themeOptions.find((option) => option.value === (resolvedTheme as ThemeName)) ??
    themeOptions[0];
  const ActiveIcon = activeOption.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "outline", size: "icon" }), "rounded-full", className)}
      >
        <ActiveIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={activeTheme}
            onValueChange={(value) => setTheme(value as ThemeName)}
          >
            {themeOptions.map((option) => {
              const Icon = option.icon;

              return (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  <Icon data-icon="inline-start" />
                  {option.label}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
