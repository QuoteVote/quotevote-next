"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PopoverMenuProps } from "@/types/components";

/**
 * PopoverMenu Component
 *
 * A mobile-only navigation menu that displays application routes in a popover.
 * Replaces the MUI PopoverMenu with shadcn/ui Popover primitives.
 * Includes an AppBar-like header structure with menu button and page title.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false)
 * const routes = [{ path: 'search', name: 'Search', layout: '/' }]
 *
 * <PopoverMenu
 *   appRoutes={routes}
 *   open={open}
 *   handleClick={() => setOpen(true)}
 *   handleClose={() => setOpen(false)}
 *   page="Search"
 * />
 * ```
 */
export function PopoverMenu({
  appRoutes,
  handleClick,
  handleClose,
  open,
  page,
  className,
}: PopoverMenuProps) {
  return (
    <div className={cn("md:hidden", className)}>
      <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground">
        <div className="flex h-14 items-center px-4">
          <Popover open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClick}
                aria-label="Open menu"
                className="mr-2 text-white hover:bg-white/10"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-56 p-1"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <nav className="flex flex-col" role="menu" aria-label="Navigation menu">
                {appRoutes.map((appRoute) => {
                  const href = `${appRoute.layout}${appRoute.path}`;
                  const isSelected = appRoute.name === page;

                  return (
                    <Link
                      key={appRoute.path}
                      href={href}
                      onClick={handleClose}
                      className={cn(
                        "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                        "focus:bg-accent focus:text-accent-foreground",
                        "hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent text-accent-foreground font-medium",
                        "cursor-pointer"
                      )}
                      role="menuitem"
                      aria-current={isSelected ? "page" : undefined}
                    >
                      {appRoute.icon && (
                        <span className="flex-shrink-0">
                          <appRoute.icon className="h-4 w-4" />
                        </span>
                      )}
                      <span>{appRoute.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </PopoverContent>
          </Popover>
          <h1 className="text-lg font-semibold text-white">{page}</h1>
        </div>
      </header>
    </div>
  );
}
