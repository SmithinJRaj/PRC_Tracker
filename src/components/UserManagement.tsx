'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Ban, ShieldCheck, Shield, Users, UserX, AlertTriangle } from 'lucide-react'

type User = {
  id: string
  email: string
  full_name: string
  role: string
  group_id?: string | null
  roll_number?: string | null
  is_banned?: boolean
}

export default function UserManagement({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [search, setSearch] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleRoleChange = async (userId: string, newRole: string) => {
    const previousUsers = [...users]
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))

    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      toast.error('Failed to update role', { description: error.message })
      setUsers(previousUsers)
    } else {
      toast.success('Role updated successfully!')
      router.refresh()
    }
  }

  const handleBanToggle = async (userId: string, ban: boolean) => {
    const previousUsers = [...users]
    setUsers(users.map(u => u.id === userId ? { ...u, is_banned: ban } : u))

    const { error } = await supabase
      .from('users')
      .update({ is_banned: ban })
      .eq('id', userId)

    if (error) {
      toast.error(`Failed to ${ban ? 'ban' : 'unban'} user`, { description: error.message })
      setUsers(previousUsers)
    } else {
      toast.success(`User ${ban ? 'banned' : 'unbanned'} successfully!`)
      router.refresh()
    }
  }

  const filtered = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (u.roll_number || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const admins = filtered.filter(u => u.role === 'admin' && !u.is_banned)
  const seniors = filtered.filter(u => u.role === 'senior' && !u.is_banned && u.group_id)
  const juniors = filtered.filter(u => u.role === 'junior' && !u.is_banned)
  const unassigned = filtered.filter(u => u.role === 'senior' && !u.is_banned && !u.group_id)
  const banned = filtered.filter(u => u.is_banned)

  const renderUserTable = (
    sectionUsers: User[], 
    icon: React.ReactNode, 
    title: string, 
    showRoleSelect: boolean,
    showBanAction: boolean,
    showUnbanAction: boolean,
    emptyMessage: string
  ) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {icon} {title} <span className="text-sm font-normal text-gray-500">({sectionUsers.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sectionUsers.length > 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  {(showBanAction || showUnbanAction) && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sectionUsers.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="font-mono text-gray-500 text-sm">{u.roll_number || '-'}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell>
                      {showRoleSelect ? (
                        <Select 
                          defaultValue={u.role} 
                          onValueChange={(val) => handleRoleChange(u.id, val || 'junior')}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="junior">Junior</SelectItem>
                            <SelectItem value="senior">Senior</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                          u.role === 'senior' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {u.role}
                        </span>
                      )}
                    </TableCell>
                    {showBanAction && (
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => handleBanToggle(u.id, true)}
                        >
                          <Ban className="w-3 h-3 mr-1" /> Ban
                        </Button>
                      </TableCell>
                    )}
                    {showUnbanAction && (
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                          onClick={() => handleBanToggle(u.id, false)}
                        >
                          <ShieldCheck className="w-3 h-3 mr-1" /> Unban
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4 text-sm">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search by name, roll number, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <span className="text-sm text-gray-500">{filtered.length} of {users.length} users</span>
      </div>

      {renderUserTable(admins, <Shield className="w-5 h-5 text-purple-600" />, 'Admins', true, false, false, 'No admins found.')}
      {renderUserTable(seniors, <Users className="w-5 h-5 text-blue-600" />, 'Seniors', true, true, false, 'No assigned seniors found.')}
      {renderUserTable(juniors, <Users className="w-5 h-5 text-gray-600" />, 'Juniors', true, true, false, 'No juniors found.')}
      {renderUserTable(unassigned, <UserX className="w-5 h-5 text-amber-600" />, 'Unassigned Seniors', true, true, false, 'No unassigned seniors.')}
      {renderUserTable(banned, <AlertTriangle className="w-5 h-5 text-red-600" />, 'Ban List', false, false, true, 'No banned users.')}
    </div>
  )
}
