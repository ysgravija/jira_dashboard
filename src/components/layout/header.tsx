'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Settings } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex-1 flex justify-end">
          <nav className="flex items-center space-x-2">
          <Button variant="ghost" asChild>
              <Link href="/">
                Home
              </Link>
            </Button>

            <Button variant="ghost" asChild>
              <Link href="/dashboard">
                Dashboard
              </Link>
            </Button>
            
            <Button variant="ghost" size="icon" asChild title="Settings">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}

export { Header } 