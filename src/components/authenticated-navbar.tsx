"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coins, Moon, Sun, Menu, LogOut, Home, History, Trophy } from "lucide-react";
import { signOut } from "next-auth/react";
import type { AuthenticatedNavbarProps } from "@/models/components";

export function AuthenticatedNavbar({
  session,
  chips,
  onBuyChips,
}: AuthenticatedNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const getUserInitials = () => {
    const name = session.user?.name ?? session.user?.email ?? "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    return session.user?.name ?? session.user?.email ?? "User";
  };

  return (
    <header className="border-border bg-card sticky top-0 z-50 flex items-center justify-between border-b p-1.5 transition-colors duration-300 md:p-4 md:px-6">
      {/* Left Section - Logo and Chips */}
      <div className="flex items-center gap-1.5 md:gap-4">
        <div className="flex items-center gap-1 md:gap-2">
          <div className="bg-primary flex h-6 w-6 items-center justify-center rounded-md transition-colors md:h-10 md:w-10 md:rounded-lg">
            <span className="text-primary-foreground font-mono text-sm font-bold md:text-xl">
              21
            </span>
          </div>
          <span className="text-sm font-bold tracking-tight md:text-xl">Blackjack</span>
        </div>
        {chips !== undefined && (
          <div className="bg-primary/10 flex items-center gap-1 rounded-full px-1.5 py-0.5 md:gap-2 md:px-4 md:py-2">
            <Coins className="h-3 w-3 text-yellow-500 md:h-5 md:w-5" />
            <span className="text-foreground text-[11px] font-bold md:text-base">
              {chips}
            </span>
            {onBuyChips && (
              <Button
                variant="ghost"
                size="icon"
                className="bg-primary/20 hover:bg-primary/30 h-3.5 w-3.5 rounded-full md:h-6 md:w-6"
                onClick={onBuyChips}
              >
                <span className="text-foreground text-[9px] md:text-xs">+</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden items-center gap-3 md:flex">
        <Link href="/home">
          <Button variant="ghost" className="text-foreground hover:bg-accent">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
        <Link href="/history">
          <Button
            variant="ghost"
            className="text-foreground/80 hover:bg-accent hover:text-foreground"
          >
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
        </Link>
        <Link href="/leaderboard">
          <Button
            variant="ghost"
            className="text-foreground/80 hover:bg-accent hover:text-foreground"
          >
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboard
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent transition-colors"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="hover:bg-accent relative h-10 w-10 rounded-full p-0"
            >
              <Avatar className="border-border h-10 w-10 border-2">
                <AvatarImage
                  src={session.user?.image ?? undefined}
                  alt={getUserDisplayName()}
                />
                <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-orange-600 text-sm font-bold text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-border bg-card text-card-foreground w-56"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-foreground text-sm leading-none font-medium">
                  {getUserDisplayName()}
                </p>
                {session.user?.email && (
                  <p className="text-muted-foreground text-xs leading-none">
                    {session.user.email}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              className="text-foreground hover:bg-accent focus:bg-accent cursor-pointer"
              onClick={() => void handleLogout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>

      {/* Mobile Hamburger Menu */}
      <div className="flex items-center gap-1 md:hidden">
        {/* Theme Toggle for Mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent h-6 w-6 transition-colors"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-3.5 w-3.5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-3.5 w-3.5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User Avatar for Mobile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="hover:bg-accent relative h-6 w-6 rounded-full p-0"
            >
              <Avatar className="border-border h-6 w-6 border">
                <AvatarImage
                  src={session.user?.image ?? undefined}
                  alt={getUserDisplayName()}
                />
                <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-orange-600 text-[9px] font-bold text-white">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="border-border bg-card text-card-foreground w-56"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-foreground text-sm leading-none font-medium">
                  {getUserDisplayName()}
                </p>
                {session.user?.email && (
                  <p className="text-muted-foreground text-xs leading-none">
                    {session.user.email}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent h-6 w-6 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="border-border bg-card text-card-foreground w-[280px]"
          >
            <SheetHeader>
              <SheetTitle className="text-foreground text-left">
                Menu
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-4">
              <Link
                href="/home"
                onClick={() => setMobileMenuOpen(false)}
                className="text-foreground hover:bg-accent flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors"
              >
                <Home className="h-5 w-5" />
                Home
              </Link>
              <Link
                href="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="text-foreground hover:bg-accent flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors"
              >
                <History className="h-5 w-5" />
                History
              </Link>
              <Link
                href="/leaderboard"
                onClick={() => setMobileMenuOpen(false)}
                className="text-foreground hover:bg-accent flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors"
              >
                <Trophy className="h-5 w-5" />
                Leaderboard
              </Link>
              <div className="bg-border my-2 h-px" />
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  void handleLogout();
                }}
                className="text-destructive hover:bg-accent flex items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-medium transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
