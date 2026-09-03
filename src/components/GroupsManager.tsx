'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Plus, Pencil, Network } from 'lucide-react'

type Group = {
  id: string
  name: string
  type: string
  parent_group_id: string | null
}

type User = {
  id: string
  full_name: string
  role: string
  group_id: string | null
}

export default function GroupsManager({ initialGroups, users }: { initialGroups: Group[], users: User[] }) {
  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('district')
  const [selectedParent, setSelectedParent] = useState<string>('none')

  const supabase = createClient()
  const router = useRouter()
  const [search, setSearch] = useState('')

  const stateGroups = groups.filter(g => g.type === 'state')

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '-'
    return groups.find(g => g.id === parentId)?.name || '-'
  }

  const getAssignedSeniors = (groupId: string) => {
    return users.filter(u => u.role === 'senior' && u.group_id === groupId).map(u => u.full_name)
  }

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Group name is required')
      return
    }

    const payload: any = { name: newName.trim(), type: newType }
    if (newType === 'district' && selectedParent !== 'none') {
      payload.parent_group_id = selectedParent
    }

    const { data, error } = await supabase.from('groups').insert(payload).select().single()

    if (error) {
      toast.error('Failed to create group', { description: error.message })
    } else {
      toast.success('Group created!')
      setGroups([...groups, data])
      setCreateOpen(false)
      setNewName('')
      setNewType('district')
      setSelectedParent('none')
      router.refresh()
    }
  }

  const handleEditHierarchy = async () => {
    if (!editingGroup) return

    const parentValue = selectedParent === 'none' ? null : selectedParent

    const { error } = await supabase
      .from('groups')
      .update({ parent_group_id: parentValue })
      .eq('id', editingGroup.id)

    if (error) {
      toast.error('Failed to update hierarchy', { description: error.message })
    } else {
      toast.success('Hierarchy updated!')
      setGroups(groups.map(g => g.id === editingGroup.id ? { ...g, parent_group_id: parentValue } : g))
      setEditOpen(false)
      setEditingGroup(null)
      router.refresh()
    }
  }

  const openEdit = (group: Group) => {
    setEditingGroup(group)
    setSelectedParent(group.parent_group_id || 'none')
    setEditOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Create Group
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Network className="w-5 h-5 text-gray-500" /> All Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input 
              placeholder="Search groups..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Parent Group</TableHead>
                  <TableHead>Assigned Seniors</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase())).map(g => {
                  const seniors = getAssignedSeniors(g.id)
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="font-semibold text-gray-900">{g.name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${g.type === 'state' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {g.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600">{getParentName(g.parent_group_id)}</TableCell>
                      <TableCell>
                        {seniors.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {seniors.map(s => (
                              <span key={s} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {g.type === 'district' && (
                          <Button variant="outline" size="sm" onClick={() => openEdit(g)}>
                            <Pencil className="w-3 h-3 mr-1" /> Edit Hierarchy
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {groups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                      No groups found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Add a new state or district group to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Group Name</label>
              <Input 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                placeholder="e.g., Kerala - Thrissur"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Type</label>
              <Select value={newType} onValueChange={(val) => setNewType(val || 'district')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="state">State</SelectItem>
                  <SelectItem value="district">District</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newType === 'district' && (
              <div>
                <label className="text-sm font-medium text-gray-700">Parent State Group</label>
                <Select value={selectedParent} onValueChange={(val) => setSelectedParent(val || 'none')}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Parent</SelectItem>
                    {stateGroups.map(sg => (
                      <SelectItem key={sg.id} value={sg.id}>{sg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Hierarchy Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Hierarchy: {editingGroup?.name}</DialogTitle>
            <DialogDescription>
              Assign this district to a parent state group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Parent State Group</label>
              <Select value={selectedParent} onValueChange={(val) => setSelectedParent(val || 'none')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Parent</SelectItem>
                  {stateGroups.map(sg => (
                    <SelectItem key={sg.id} value={sg.id}>{sg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleEditHierarchy} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Update Hierarchy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
