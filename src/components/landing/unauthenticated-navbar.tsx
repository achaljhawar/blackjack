"use client";

import { Moon, Sun, Menu } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LoginDialog } from "./login-dialog";

export function UnauthenticatedNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const navLinks = [
    { href: "#overview", label: "Overview" },
    { href: "#how-to-play", label: "How to Play" },
    { href: "#leaderboard", label: "Leaderboard" },
  ];

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur transition-colors duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-lg transition-colors">
            <span className="text-primary-foreground font-mono text-xl font-bold">
              21
            </span>
          </div>
          <span className="text-xl font-bold tracking-tight">Blackjack</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-foreground/80 hover:text-primary text-sm font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Theme Toggle & Sign In */}
        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="hover:bg-accent transition-colors"
          >
            <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button onClick={() => setLoginDialogOpen(true)}>
            Sign In
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="hover:bg-accent transition-colors"
          >
            <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="hover:bg-accent transition-colors"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-card border-border w-[280px]"
            >
              <SheetHeader>
                <SheetTitle className="text-foreground text-left">
                  Navigation
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg px-3 py-3 text-base font-medium transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <Button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLoginDialogOpen(true);
                  }}
                  className="mt-4"
                >
                  Sign In
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
    </header>
  );
}
