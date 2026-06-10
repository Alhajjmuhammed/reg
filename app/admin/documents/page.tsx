'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  ExternalLink,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { getAllDocuments, createDocument, updateDocument, deleteDocument } from '@/lib/store'
import type { EventDocument, DocumentType, PackageType } from '@/lib/types'

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'timetable', label: 'Timetable' },
  { value: 'material', label: 'Training Material' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'other', label: 'Other' },
]

const AVAILABLE_TO_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Participants' },
  { value: 'early-bird', label: 'Early Bird only' },
  { value: 'standard', label: 'Standard only' },
  { value: 'vip', label: 'VIP only' },
]

const DOC_TYPE_ICON: Record<string, React.ElementType> = {
  timetable: Clock,
  material: BookOpen,
  certificate: CheckCircle,
  announcement: AlertCircle,
  other: FileText,
}

const emptyForm = {
  title: '',
  description: '',
  fileUrl: '',
  type: 'material' as DocumentType,
  availableTo: 'all' as 'all' | PackageType,
  active: true,
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<EventDocument[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<EventDocument | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setDocs(getAllDocuments())
  }, [])

  const refresh = () => setDocs(getAllDocuments())

  const openAdd = () => {
    setEditingDoc(null)
    setForm({ ...emptyForm })
    setDialogOpen(true)
  }

  const openEdit = (doc: EventDocument) => {
    setEditingDoc(doc)
    setForm({
      title: doc.title,
      description: doc.description,
      fileUrl: doc.fileUrl,
      type: doc.type,
      availableTo: doc.availableTo,
      active: doc.active,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.fileUrl.trim()) return
    if (editingDoc) {
      updateDocument(editingDoc.id, {
        title: form.title,
        description: form.description,
        fileUrl: form.fileUrl,
        type: form.type,
        availableTo: form.availableTo,
        active: form.active,
      })
    } else {
      createDocument({
        title: form.title,
        description: form.description,
        fileUrl: form.fileUrl,
        type: form.type,
        availableTo: form.availableTo,
        active: form.active,
        uploadedAt: new Date().toISOString(),
      })
    }
    setDialogOpen(false)
    refresh()
  }

  const handleDelete = (id: string) => {
    deleteDocument(id)
    setDeleteConfirm(null)
    refresh()
  }

  const toggleActive = (doc: EventDocument) => {
    updateDocument(doc.id, { active: !doc.active })
    refresh()
  }

  if (!isMounted) return null

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Documents</h1>
            <p className="text-sm text-muted-foreground">
              Upload timetables, materials, and announcements for participants
            </p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Document
          </Button>
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Available To</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No documents yet</p>
                    <p className="text-sm">Click &ldquo;Add Document&rdquo; to upload the first one.</p>
                  </TableCell>
                </TableRow>
              ) : (
                docs.map((doc) => {
                  const DocIcon = DOC_TYPE_ICON[doc.type] || FileText
                  const typeMeta = DOC_TYPES.find(t => t.value === doc.type)
                  return (
                    <TableRow key={doc.id} className={!doc.active ? 'opacity-50' : ''}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <DocIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{doc.title}</p>
                            {doc.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{doc.description}</p>
                            )}
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                            >
                              Open link <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {typeMeta?.label || doc.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {AVAILABLE_TO_OPTIONS.find(o => o.value === doc.availableTo)?.label || doc.availableTo}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(doc.uploadedAt)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={doc.active}
                          onCheckedChange={() => toggleActive(doc)}
                          aria-label="Toggle active"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(doc)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteConfirm(doc.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDoc ? 'Edit Document' : 'Add Document'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="doc-title"
                placeholder="e.g. Day 1 Timetable"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-description">Description</Label>
              <Textarea
                id="doc-description"
                placeholder="Optional details about this document"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-url">File URL <span className="text-destructive">*</span></Label>
              <Input
                id="doc-url"
                type="url"
                placeholder="https://drive.google.com/file/..."
                value={form.fileUrl}
                onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Paste a Google Drive, Dropbox, or any direct file link.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as DocumentType }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Available To</Label>
                <Select value={form.availableTo} onValueChange={v => setForm(f => ({ ...f, availableTo: v as 'all' | PackageType }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_TO_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="doc-active"
                checked={form.active}
                onCheckedChange={v => setForm(f => ({ ...f, active: v }))}
              />
              <Label htmlFor="doc-active" className="cursor-pointer">Active (visible to participants)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || !form.fileUrl.trim()}>
              {editingDoc ? 'Save changes' : 'Add document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            This will permanently remove the document. Participants will no longer be able to access it.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
