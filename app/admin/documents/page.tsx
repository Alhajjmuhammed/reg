'use client'

import { useState, useEffect, useRef } from 'react'
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
  Upload,
  Link as LinkIcon,
  X,
  AlertTriangle,
  Download,
} from 'lucide-react'
import { getAllDocuments, createDocument, updateDocument, deleteDocument, getAllPackages } from '@/lib/store'
import { uploadFile } from '@/lib/upload'
import type { EventDocument, DocumentType, PackageType, Package } from '@/lib/types'
import { useStoreReady } from '@/components/store-provider'

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'timetable', label: 'Timetable' },
  { value: 'material', label: 'Training Material' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'other', label: 'Other' },
]

const DOC_TYPE_ICON: Record<string, React.ElementType> = {
  timetable: Clock,
  material: BookOpen,
  certificate: CheckCircle,
  announcement: AlertCircle,
  other: FileText,
}

const MAX_FILE_BYTES = 4 * 1024 * 1024 // 4 MB limit for localStorage safety

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function isDataUrl(url: string) {
  return url.startsWith('data:')
}

const emptyForm = {
  title: '',
  description: '',
  fileUrl: '',
  fileName: '',
  fileSize: 0,
  sourceType: 'url' as 'url' | 'file',
  type: 'material' as DocumentType,
  availableTo: 'all' as 'all' | PackageType,
  active: true,
}

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<EventDocument[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<EventDocument | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [fileError, setFileError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const storeReady = useStoreReady()
  useEffect(() => {
    setIsMounted(true)
    setDocs(getAllDocuments())
    setPackages(getAllPackages().filter(p => p.active))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeReady])

  const refresh = () => setDocs(getAllDocuments())

  const openAdd = () => {
    setEditingDoc(null)
    setForm({ ...emptyForm })
    setFileError('')
    setDialogOpen(true)
  }

  const openEdit = (doc: EventDocument) => {
    setEditingDoc(doc)
    setForm({
      title: doc.title,
      description: doc.description,
      fileUrl: doc.fileUrl,
      fileName: doc.fileName || '',
      fileSize: doc.fileSize || 0,
      sourceType: isDataUrl(doc.fileUrl) || doc.fileUrl.startsWith('/uploads/') ? 'file' : 'url',
      type: doc.type,
      availableTo: doc.availableTo,
      active: doc.active,
    })
    setFileError('')
    setDialogOpen(true)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileError('')
    try {
      const url = await uploadFile(file)
      setForm(f => ({ ...f, fileUrl: url, fileName: file.name, fileSize: file.size }))
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const clearFile = () => {
    setForm(f => ({ ...f, fileUrl: '', fileName: '', fileSize: 0 }))
    setFileError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.fileUrl.trim()) return
    const docData = {
      title: form.title.trim(),
      description: form.description.trim(),
      fileUrl: form.fileUrl,
      fileName: form.fileName || undefined,
      fileSize: form.fileSize || undefined,
      type: form.type,
      availableTo: form.availableTo,
      active: form.active,
    }
    if (editingDoc) {
      updateDocument(editingDoc.id, docData)
    } else {
      createDocument({ ...docData, uploadedAt: new Date().toISOString() })
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

  const availableToLabel = (val: string) => {
    if (val === 'all') return 'All Participants'
    const pkg = packages.find(p => p.id === val)
    return pkg ? `${pkg.name} only` : val
  }

  if (!isMounted) return null

  return (
    <AdminLayout requiredPermission="documents.manage">
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
                  const dataFile = isDataUrl(doc.fileUrl)
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
                            <div className="flex items-center gap-2 mt-0.5">
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                View
                              </a>
                              {dataFile && (
                                <a
                                  href={doc.fileUrl}
                                  download={doc.fileName || doc.title}
                                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                                >
                                  <Download className="h-2.5 w-2.5" />
                                  {doc.fileName || 'Download'}
                                  {doc.fileSize ? ` (${formatBytes(doc.fileSize)})` : ''}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {typeMeta?.label || doc.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {availableToLabel(doc.availableTo)}
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
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="doc-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="doc-title"
                placeholder="e.g. Day 1 Timetable"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            {/* Description */}
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

            {/* Source toggle */}
            <div className="space-y-2">
              <Label>File Source <span className="text-destructive">*</span></Label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setForm(f => ({ ...f, sourceType: 'url', fileUrl: '', fileName: '', fileSize: 0 })); setFileError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    form.sourceType === 'url'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <LinkIcon className="h-4 w-4" />
                  Paste URL
                </button>
                <button
                  type="button"
                  onClick={() => { setForm(f => ({ ...f, sourceType: 'file', fileUrl: '', fileName: '', fileSize: 0 })); setFileError('') }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    form.sourceType === 'file'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </button>
              </div>
            </div>

            {/* URL input */}
            {form.sourceType === 'url' && (
              <div className="space-y-1.5">
                <Input
                  id="doc-url"
                  type="url"
                  placeholder="https://drive.google.com/file/..."
                  value={form.fileUrl}
                  onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Paste a Google Drive, Dropbox, OneDrive, or any direct file link.
                </p>
              </div>
            )}

            {/* File upload */}
            {form.sourceType === 'file' && (
              <div className="space-y-2">
                {form.fileUrl && form.fileName ? (
                  <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
                    <FileText className="h-5 w-5 text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{form.fileName}</p>
                      {form.fileSize ? (
                        <p className="text-xs text-muted-foreground">{formatBytes(form.fileSize)}</p>
                      ) : null}
                    </div>
                    <button type="button" onClick={clearFile} className="text-muted-foreground hover:text-foreground shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="doc-file"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Click to select a file</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, images — max 4 MB</p>
                    <input
                      id="doc-file"
                      ref={fileInputRef}
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.txt"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
                {fileError && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    {fileError}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Files are uploaded to the server (max 20 MB). For very large files, use the URL option instead (Google Drive, Dropbox).
                </p>
              </div>
            )}

            {/* Type & Available To */}
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
                    <SelectItem value="all">All Participants</SelectItem>
                    {packages.map(pkg => (
                      <SelectItem key={pkg.id} value={pkg.id}>{pkg.name} only</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active toggle */}
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
            <Button
              onClick={handleSave}
              disabled={!form.title.trim() || !form.fileUrl.trim()}
            >
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
