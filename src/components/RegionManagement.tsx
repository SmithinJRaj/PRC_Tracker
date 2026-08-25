'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import AlertDialog from './AlertDialog'
import Modal from './Modal'
import { Edit, Trash2 } from 'lucide-react'

type Region = {
  id: string
  name: string
}

export default function RegionManagement({ initialRegions }: { initialRegions: Region[] }) {
  const [regions, setRegions] = useState<Region[]>(initialRegions)
  const [loading, setLoading] = useState(false)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const handleCreateRegion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string

    const { data, error } = await supabase
      .from('regions')
      .insert({ name })
      .select()
      .single()

    if (error) {
      toast.error('Failed to create region', { description: error.message })
    } else if (data) {
      toast.success('Region created successfully!')
      setRegions([...regions, data])
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    }
    
    setLoading(false)
  }

  const handleEditRegion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedRegion) return
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string

    const { error } = await supabase
      .from('regions')
      .update({ name })
      .eq('id', selectedRegion.id)

    if (error) {
      toast.error('Failed to update region', { description: error.message })
    } else {
      toast.success('Region updated successfully!')
      setRegions(regions.map(r => r.id === selectedRegion.id ? { ...r, name } : r))
      setEditModalOpen(false)
      router.refresh()
    }
    
    setLoading(false)
  }

  const handleDeleteRegion = async () => {
    if (!selectedRegion) return
    const { error } = await supabase
      .from('regions')
      .delete()
      .eq('id', selectedRegion.id)

    if (error) {
      toast.error('Failed to delete region', { description: error.message })
    } else {
      toast.success('Region deleted successfully!')
      setRegions(regions.filter(r => r.id !== selectedRegion.id))
      router.refresh()
    }
  }

  return (
    <div className="space-y-8 mt-4">
      <Card>
        <CardHeader>
          <CardTitle>Create New Region</CardTitle>
          <CardDescription>Add a new geographic region (e.g. Kozhikode, Wayanad)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateRegion} className="flex gap-4 items-end">
            <div className="space-y-2 flex-1 max-w-sm">
              <Label htmlFor="name">Region Name</Label>
              <Input id="name" name="name" required placeholder="Region Name" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Region'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Manage Regions</h2>
        {regions.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                          onClick={() => {
                            setSelectedRegion(r)
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
                            setSelectedRegion(r)
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
          <p className="text-gray-500 text-center py-4">No regions created yet.</p>
        )}
      </div>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Edit Region</h2>
          <form onSubmit={handleEditRegion} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Region Name</Label>
              <Input id="edit-name" name="name" required defaultValue={selectedRegion?.name} />
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
        onConfirm={handleDeleteRegion}
        title="Delete Region"
        description="Are you sure? This will delete the region. Registrations currently tied to this region may lose their association."
        confirmText="Delete Region"
        cancelText="Cancel"
      />
    </div>
  )
}
