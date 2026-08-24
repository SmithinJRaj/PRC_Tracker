'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FormInput, TableProperties, Users, Trophy, LogOut, PhoneCall } from 'lucide-react'

type SidebarNavProps = {
  role: string
  fullName: string
}

export default function SidebarNav({ role, fullName }: SidebarNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      name: 'Log Registration',
      href: '/dashboard/register',
      icon: FormInput,
      show: true, // Everyone can log
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
      name: 'Management',
      href: '/dashboard/management',
      icon: Users,
      show: ['senior', 'admin'].includes(role),
    },
    {
      name: 'Leaderboard',
      href: '/dashboard/leaderboard',
      icon: Trophy,
      show: true,
    },
  ]

  return (
    <div className="w-64 bg-white border-r h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">PRC Tracker</h1>
        <div className="mt-2 text-sm text-gray-500">
          <p className="font-medium text-gray-900 truncate">{fullName}</p>
          <p className="capitalize">{role}</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
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
    </div>
  )
}
