'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useDemo } from '@/lib/demo/store';
import {
  createServiceFile,
  updateServiceFileContent,
  deleteServiceFile,
  renameServiceFile,
} from '@/lib/demo/workflows';
import { ServiceFile } from '@/lib/demo/types';
import { createDefaultFileSystem } from '@/lib/demo/service-factories';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Folder,
  FileCode,
  FileText,
  File,
  Upload,
  FolderPlus,
  FilePlus,
  Trash2,
  Edit3,
  Download,
  Search,
  ArrowLeft,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Code2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceFilesPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const { state, setState } = useDemo();

  const service = state.services.find((s) => s.id === serviceId);

  // Fallback filesystem if not yet initialized
  const fs = useMemo(() => {
    if (!service) return { files: [] };
    return service.fileSystem || createDefaultFileSystem(service.domain || 'example.com');
  }, [service]);

  const [currentPath, setCurrentPath] = useState<string>('/public_html');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dialog States
  const [editorFile, setEditorFile] = useState<ServiceFile | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [newFileDialogOpen, setNewFileDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [renameTarget, setRenameTarget] = useState<ServiceFile | null>(null);
  const [renameNewName, setRenameNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ServiceFile | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [simulatedUploadProgress, setSimulatedUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState('');

  // Calculate items in current directory
  const currentItems = useMemo(() => {
    if (!fs.files) return [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return fs.files.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
    }

    return fs.files.filter((f) => {
      if (currentPath === '/') {
        return f.path.split('/').filter(Boolean).length === 1;
      }
      if (f.path === currentPath) return false;
      if (!f.path.startsWith(currentPath + '/')) return false;

      // Only direct children
      const remainder = f.path.slice(currentPath.length + 1);
      return !remainder.includes('/');
    });
  }, [fs.files, currentPath, searchQuery]);

  // Breadcrumbs calculation
  const breadcrumbs = useMemo(() => {
    if (currentPath === '/') return [{ name: 'root', path: '/' }];
    const segments = currentPath.split('/').filter(Boolean);
    const crumbs = [{ name: 'root', path: '/' }];
    let acc = '';
    for (const seg of segments) {
      acc += '/' + seg;
      crumbs.push({ name: seg, path: acc });
    }
    return crumbs;
  }, [currentPath]);

  if (!service) {
    return (
      <div className="p-8 text-center text-slate-500">
        Service not found.
      </div>
    );
  }

  // Handlers
  function handleOpenItem(item: ServiceFile) {
    if (item.isDir || item.isDirectory) {
      setCurrentPath(item.path);
      setSearchQuery('');
    } else {
      setEditorFile(item);
      setEditorContent(item.content || '');
    }
  }

  function handleSaveEditor() {
    if (!editorFile || !service) return;
    try {
      const nextState = updateServiceFileContent(state, service.id, editorFile.path, editorContent);
      setState(nextState);
      toast.success(`Saved ${editorFile.name} successfully.`);
      setEditorFile(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save file.');
    }
  }

  function handleCreateFile() {
    if (!newFileName.trim() || !service) {
      toast.error('File name cannot be empty.');
      return;
    }
    const cleanName = newFileName.trim();
    const filePath = currentPath === '/' ? `/${cleanName}` : `${currentPath}/${cleanName}`;

    try {
      const nextState = createServiceFile(state, service.id, {
        path: filePath,
        name: cleanName,
        isDir: false,
        content: '<?php\n// Created via Web File Manager\n',
      });
      setState(nextState);
      toast.success(`Created file ${cleanName}`);
      setNewFileDialogOpen(false);
      setNewFileName('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error creating file');
    }
  }

  function handleCreateFolder() {
    if (!newFolderName.trim() || !service) {
      toast.error('Folder name cannot be empty.');
      return;
    }
    const cleanName = newFolderName.trim();
    const folderPath = currentPath === '/' ? `/${cleanName}` : `${currentPath}/${cleanName}`;

    try {
      const nextState = createServiceFile(state, service.id, {
        path: folderPath,
        name: cleanName,
        isDir: true,
      });
      setState(nextState);
      toast.success(`Created directory ${cleanName}`);
      setNewFolderDialogOpen(false);
      setNewFolderName('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error creating folder');
    }
  }

  function handleRename() {
    if (!renameTarget || !renameNewName.trim() || !service) return;
    try {
      const nextState = renameServiceFile(state, service.id, renameTarget.path, renameNewName.trim());
      setState(nextState);
      toast.success(`Renamed to ${renameNewName.trim()}`);
      setRenameTarget(null);
      setRenameNewName('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error renaming file');
    }
  }

  function handleDelete() {
    if (!deleteTarget || !service) return;
    try {
      const nextState = deleteServiceFile(state, service.id, deleteTarget.path);
      setState(nextState);
      toast.success(`Deleted ${deleteTarget.name}`);
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error deleting item');
    }
  }

  function handleSimulateUpload() {
    if (!uploadingFileName.trim() || !service) {
      toast.error('Please enter a mock filename to upload.');
      return;
    }
    setSimulatedUploadProgress(10);
    const interval = setInterval(() => {
      setSimulatedUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          const targetPath = currentPath === '/' ? `/${uploadingFileName.trim()}` : `${currentPath}/${uploadingFileName.trim()}`;
          try {
            const nextState = createServiceFile(state, service.id, {
              path: targetPath,
              name: uploadingFileName.trim(),
              isDir: false,
              content: `/* Uploaded mock asset: ${uploadingFileName.trim()} */\n`,
            });
            setState(nextState);
            toast.success(`Uploaded ${uploadingFileName.trim()} to ${currentPath}`);
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Upload failed');
          }
          setUploadDialogOpen(false);
          setUploadingFileName('');
          setSimulatedUploadProgress(0);
          return 100;
        }
        return prev + 30;
      });
    }, 250);
  }

  function handleDownloadMock(file: ServiceFile) {
    const blob = new Blob([file.content || `/* Runstead Service File: ${file.name} */\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${file.name}`);
  }

  const totalFiles = fs.files.length;
  const totalSizeBytes = fs.files.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Overview & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Interactive File Manager</h2>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              Web Root: /public_html
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse, upload, edit, and organize files for <strong className="text-slate-800">{service.domain}</strong>.
            All operations are executed within your service container webroot.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5"
            onClick={() => setNewFolderDialogOpen(true)}
          >
            <FolderPlus className="h-4 w-4 text-amber-500" />
            New Folder
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5"
            onClick={() => setNewFileDialogOpen(true)}
          >
            <FilePlus className="h-4 w-4 text-blue-500" />
            New File
          </Button>

          <Button
            size="sm"
            className="text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 text-white"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Breadcrumb Navigation & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100/80 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium text-slate-600">
          {breadcrumbs.map((crumb, idx) => (
            <div key={crumb.path} className="flex items-center gap-1.5 whitespace-nowrap">
              {idx > 0 && <span className="text-slate-400">/</span>}
              <button
                onClick={() => {
                  setCurrentPath(crumb.path);
                  setSearchQuery('');
                }}
                className={`hover:text-blue-600 transition-colors px-1.5 py-0.5 rounded ${
                  currentPath === crumb.path ? 'font-bold text-slate-950 bg-white shadow-2xs' : ''
                }`}
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search current scope..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-white"
          />
        </div>
      </div>

      {/* File Table / Explorer */}
      <Card className="border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Permissions</th>
                <th className="py-3 px-4">Last Modified</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentPath !== '/' && !searchQuery && (
                <tr
                  onClick={() => {
                    const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
                    setCurrentPath(parent);
                  }}
                  className="hover:bg-slate-50 cursor-pointer text-slate-500 font-medium"
                >
                  <td colSpan={5} className="py-2.5 px-4 flex items-center gap-2">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>.. (Parent Directory)</span>
                  </td>
                </tr>
              )}

              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Folder className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">This directory is empty</p>
                    <p className="text-[11px] mt-0.5">Use the action buttons above to upload or create files.</p>
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => {
                  const isPhp = item.name.endsWith('.php');
                  const isHtml = item.name.endsWith('.html');
                  const isConfig = item.name.includes('config') || item.name.startsWith('.');

                  return (
                    <tr
                      key={item.path}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div
                          onClick={() => handleOpenItem(item)}
                          className="flex items-center gap-2.5 font-medium text-slate-900 cursor-pointer"
                        >
                          {item.isDir || item.isDirectory ? (
                            <Folder className="h-4 w-4 text-amber-500 fill-amber-100 shrink-0" />
                          ) : isPhp ? (
                            <Code2 className="h-4 w-4 text-indigo-500 shrink-0" />
                          ) : isHtml ? (
                            <FileCode className="h-4 w-4 text-orange-500 shrink-0" />
                          ) : isConfig ? (
                            <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                          ) : (
                            <File className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate max-w-xs sm:max-w-md group-hover:text-blue-600">
                            {item.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {item.isDir || item.isDirectory ? '-' : `${((item.size || 0) / 1024).toFixed(1)} KB`}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] bg-slate-50 text-slate-700 border-slate-200"
                        >
                          {item.permissions || (item.isDir || item.isDirectory ? '0755' : '0644')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {item.modifiedAt ? new Date(item.modifiedAt).toLocaleString() : 'Just now'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                          {!(item.isDir || item.isDirectory) && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-600 hover:text-blue-600"
                                title="Edit Code"
                                onClick={() => handleOpenItem(item)}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-slate-600 hover:text-emerald-600"
                                title="Download File"
                                onClick={() => handleDownloadMock(item)}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-600 hover:text-amber-600"
                            title="Rename"
                            onClick={() => {
                              setRenameTarget(item);
                              setRenameNewName(item.name);
                            }}
                          >
                            <span className="text-[10px] font-bold">RE</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-600 hover:text-rose-600"
                            title="Delete"
                            disabled={item.path === '/' || item.path === '/public_html'}
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span>
              Total Objects: <strong className="text-slate-800">{totalFiles}</strong>
            </span>
            <span>
              Disk Usage: <strong className="text-slate-800">{totalSizeMB} MB</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Filesystem healthy & synchronized</span>
          </div>
        </div>
      </Card>

      {/* Code Editor Dialog */}
      <Dialog open={Boolean(editorFile)} onOpenChange={(open) => !open && setEditorFile(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-blue-600" />
                  Editing {editorFile?.name}
                </DialogTitle>
                <DialogDescription className="text-xs font-mono text-slate-500 mt-0.5">
                  Path: {editorFile?.path} • Permissions: {editorFile?.permissions || '0644'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 my-3 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 p-3 shadow-inner">
            <textarea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              className="w-full h-[50vh] bg-transparent text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none resize-none"
              spellCheck={false}
            />
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Encoding: UTF-8</span>
              <span>•</span>
              <span>Lines: {editorContent.split('\n').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditorFile(null)}>
                Cancel
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveEditor}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New File Dialog */}
      <Dialog open={newFileDialogOpen} onOpenChange={setNewFileDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
            <DialogDescription className="text-xs">
              File will be created inside <span className="font-mono text-slate-800">{currentPath}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Filename</label>
              <Input
                placeholder="e.g. index.php, config.json, .htaccess"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setNewFileDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateFile} className="bg-blue-600 hover:bg-blue-700 text-white">
              Create File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription className="text-xs">
              Directory will be created inside <span className="font-mono text-slate-800">{currentPath}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Folder Name</label>
              <Input
                placeholder="e.g. uploads, assets, backups"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateFolder} className="bg-amber-600 hover:bg-amber-700 text-white">
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Item</DialogTitle>
            <DialogDescription className="text-xs">
              Change name of <span className="font-mono text-slate-800">{renameTarget?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">New Name</label>
              <Input
                value={renameNewName}
                onChange={(e) => setRenameNewName(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleRename} className="bg-blue-600 hover:bg-blue-700 text-white">
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete <strong className="text-slate-900">{deleteTarget?.name}</strong>?
              {(deleteTarget?.isDir || deleteTarget?.isDirectory) && ' All nested files will also be removed permanently.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simulated Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription className="text-xs">
              Upload an archive, script, or image into <span className="font-mono text-slate-800">{currentPath}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">File Name</label>
              <Input
                placeholder="e.g. logo.png, theme-bundle.zip"
                value={uploadingFileName}
                onChange={(e) => setUploadingFileName(e.target.value)}
                className="text-xs"
              />
            </div>

            {simulatedUploadProgress > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-slate-600 font-mono">
                  <span>Transferring data...</span>
                  <span>{simulatedUploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 transition-all duration-200"
                    style={{ width: `${simulatedUploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={simulatedUploadProgress > 0}
              onClick={handleSimulateUpload}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Start Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
