import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-4xl font-bold text-red-600 dark:text-red-500">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Only users with a valid @nitc.ac.in email address are allowed to access the PRC Tracker.
        </p>
        <div className="pt-4">
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
