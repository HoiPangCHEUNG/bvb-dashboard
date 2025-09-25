"use client"

import { Sparkles, PanelRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function SidebarToggle() {
  const { toggleSidebar, open, isMobile } = useSidebar()

  return (
    <Button
      onClick={toggleSidebar}
      size="icon"
      className={cn(
        "fixed bottom-6 z-50 h-12 w-12 rounded-full shadow-lg",
        "bg-white text-black hover:bg-gray-50",
        "transition-all duration-300 ease-in-out",
        // Position based on sidebar state
        open && !isMobile
          ? "right-[21rem]" // Move left when sidebar is open (sidebar width + margin)
          : "right-6" // Default position when closed
      )}
    >
      {open ? (
        <PanelRight className="h-5 w-5" />
      ) : (
        <Sparkles className="h-5 w-5 text-purple-500" />
      )}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}