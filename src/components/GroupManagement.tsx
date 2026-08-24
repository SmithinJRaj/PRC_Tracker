'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AlertDialog from './AlertDialog'
import Modal from './Modal'
import { Edit, Trash2 } from 'lucide-react'

type Group = {
  id: string
  name: string
  head_id: string | null
}

type User = {
  id: string
  full_name: string
  role: string
}

export default function GroupManagement({ initialGroups, seniors }: { initialGroups: Group[], seniors: User[] }) {
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [loading, setLoading] = useState(false)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleHeadChange = async (groupId: string, newHeadId: string) => {
    // Optimistic update
    const previousGroups = [...groups]
    setGroups(groups.map(g => g.id === groupId ? { ...g, head_id: newHeadId } : g))

    const { error } = await supabase
      .from('groups')
      .update({ head_id: newHeadId })
      .eq('id', groupId)

    if (error) {
      toast.error('Failed to assign head', { description: error.message })
      setGroups(previousGroups)
    } else {
      toast.success('Group head assigned successfully!')
      router.refresh()
    }
  }

  const handleCreateGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string

    const { data, error } = await supabase
      .from('groups')
      .insert({ name })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create group', { description: error.message })
    } else if (data) {
      toast.success('Group created successfully!')
      setGroups([...groups, data])
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    }
    
    setLoading(false)
  }

  const handleEditGroup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedGroup) return
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string

    const { error } = await supabase
      .from('groups')
      .update({ name })
      .eq('id', selectedGroup.id)

    if (error) {
      toast.error('Failed to update group', { description: error.message })
    } else {
      toast.success('Group updated successfully!')
      setGroups(groups.map(g => g.id === selectedGroup.id ? { ...g, name } : g))
      setEditModalOpen(false)
      router.refresh()
    }
    
    setLoading(false)
  }

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', selectedGroup.id)

    if (error) {
      toast.error('Failed to delete group', { description: error.message })
    } else {
      toast.success('Group deleted successfully!')
      setGroups(groups.filter(g => g.id !== selectedGroup.id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-8 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Create New Group</CardTitle>
          <CardDescription>Add a new committee group (e.g. Malayali, Tamil, Design)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateGroup} className="flex gap-4 items-end">
            <div className="space-y-2 flex-1 max-w-sm">
              <Label htmlFor="name">Group Name</Label>
              <Input id="name" name="name" required placeholder="Group Name" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Manage Groups</h2>
        {groups.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Group Head (Senior)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell>
                      <Select 
                        value={g.head_id || 'unassigned'} 
                        onValueChange={(val) => handleHeadChange(g.id, val === 'unassigned' ? null as any : val)}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {seniors.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                          onClick={() => {
                            setSelectedGroup(g)
                            setEditModalOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                          onClick={() => {
                            setSelectedGroup(g)
                            setDeleteAlertOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No groups created yet.</p>
        )}
      </div>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Edit Group</h2>
          <form onSubmit={handleEditGroup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Group Name</Label>
              <Input id="edit-name" name="name" required defaultValue={selectedGroup?.name} />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>
      </Modal>

      <AlertDialog 
        isOpen={deleteAlertOpen} 
        onClose={() => setDeleteAlertOpen(false)}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        description="Are you sure? Deleting this group will not delete its users or their leads, but it will unassign them from this group."
        confirmText="Delete Group"
        cancelText="Cancel"
      />
    </div>
  )
}
