'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FormInput, TableProperties, Users, Trophy, LogOut, PhoneCall, Menu, LineChart, Settings, Contact, ClipboardCheck, Network } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type SidebarNavProps = {
  role: string
  fullName: string
}

export default function SidebarNav({ role, fullName }: SidebarNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navItems = [
    {
      name: 'Log Registration',
      href: '/dashboard/register',
      icon: FormInput,
      show: true,
    },
    {
      name: 'Lead Tracking',
      href: '/dashboard/leads',
      icon: PhoneCall,
      show: true,
    },
    {
      name: 'All Registrations',
      href: '/dashboard/master',
      icon: TableProperties,
      show: ['senior', 'admin'].includes(role),
    },
    {
      name: 'Attendance',
      href: '/dashboard/attendance',
      icon: ClipboardCheck,
      show: ['senior', 'admin'].includes(role),
    },
    {
      name: 'Team Directory',
      href: '/dashboard/directory',
      icon: Contact,
      show: true,
    },
    {
      name: 'Management',
      href: '/dashboard/management',
      icon: Settings,
      show: ['senior', 'admin'].includes(role),
    },
    {
      name: 'Groups',
      href: '/dashboard/groups',
      icon: Network,
      show: role === 'admin',
    },
    {
      name: 'Leaderboard',
      href: '/dashboard/leaderboard',
      icon: Trophy,
      show: true,
    },
    {
      name: 'Summary',
      href: '/dashboard/summary',
      icon: LineChart,
      show: ['senior', 'admin'].includes(role),
    },
  ]

  const NavLinks = () => (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">PRC Tracker</h1>
        <div className="mt-2 text-sm text-gray-500">
          <p className="font-medium text-gray-900 truncate">{fullName}</p>
          <p className="capitalize">{role}</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
      </nav>

      <div className="p-4 border-t">
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </form>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b flex items-center px-4 z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger className="p-2 mr-2 hover:bg-gray-100 rounded-md">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 flex flex-col">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <NavLinks />
          </SheetContent>
        </Sheet>
        <h1 className="text-xl font-bold text-blue-600 ml-2">PRC Tracker</h1>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-white border-r h-screen flex-col fixed left-0 top-0">
        <NavLinks />
      </div>
    </>
  )
}
