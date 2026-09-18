// src/components/intake/UploadCard.tsx

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UploadCloud,
  FileText,
  X,
  Sparkles,
  Eye,
  EyeOff,
  ArrowRight,
  FileType,
  FolderKanban,
  File as FileIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

const ACCEPTED = '.pdf,.docx,.txt,.md';

interface UploadCardProps {
  projectName: string;
  onProjectName: (v: string) => void;
  description: string;
  onDescription: (v: string) => void;
  sourceText: string;
  onSourceText: (v: string) => void;
  clientName: string;
  onClientName: (v: string) => void;
  clientEmail: string;
  onClientEmail: (v: string) => void;
  company: string;
  onCompany: (v: string) => void;
  projectPriority: string;
  onProjectPriority: (v: string) => void;
  expectedDeliveryDate: string;
  onExpectedDeliveryDate: (v: string) => void;
  onStart: (file: File | null) => void;
  starting?: boolean;
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export function UploadCard({
  projectName,
  onProjectName,
  description,
  onDescription,
  sourceText,
  onSourceText,
  clientName,
  onClientName,
  clientEmail,
  onClientEmail,
  company,
  onCompany,
  projectPriority,
  onProjectPriority,
  expectedDeliveryDate,
  onExpectedDeliveryDate,
  onStart,
  starting,
}: UploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(false);
  const [fileText, setFileText] = useState('');
  const [invalidFile, setInvalidFile] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback((f: File): Promise<string> => {
    return new Promise((resolve) => {
      const isPlain = /\.(txt|md)$/i.test(f.name);
      if (!isPlain) return resolve('');
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => resolve('');
      reader.readAsText(f);
    });
  }, []);

  const acceptFile = useCallback(
    async (f: File | undefined | null) => {
      if (!f) return;
      const okExt = /\.(pdf|docx|txt|md)$/i.test(f.name);
      if (!okExt) {
        setInvalidFile(`Unsupported format. Accepted: ${ACCEPTED.replaceAll('.', '').replaceAll(',', ', ')}`);
        return;
      }
      setInvalidFile('');
      setFile(f);
      const text = await readFile(f);
      setFileText(text);
    },
    [readFile]
  );

  const canStart =
    !starting && projectName.trim().length >= 2 && clientName.trim().length >= 2 && clientEmail.trim().length >= 3 && (!!file || sourceText.trim().length >= 20 || description.trim().length >= 10);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="card glass rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-canvas-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-heading">New AI Project Intake</h2>
            <p className="text-xs text-text-muted">The AI pipeline will analyze, plan and assign your project</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Project name"
              placeholder="e.g. FinTrack — AI expense manager"
              value={projectName}
              onChange={(e) => onProjectName(e.target.value)}
              icon={<FolderKanban size={16} />}
            />
            <Input
              label="Source type"
              value={file ? (file.name.toLowerCase().endsWith('.pdf') ? 'PDF document' : file.name.toLowerCase().endsWith('.docx') ? 'Word document' : 'Text / Markdown') : 'Manual briefing'}
              disabled
              hint={file ? 'Document attached to the requirement' : 'Paste a brief or attach a document'}
              icon={<FileType size={16} />}
            />
          </div>

          <Textarea
            label="Project description (optional)"
            placeholder="A short overview of what you want to build, your users, and the outcome you expect…"
            value={description}
            onChange={(e) => onDescription(e.target.value)}
            className="min-h-[84px]"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Client name *" placeholder="e.g. ABC College" value={clientName} onChange={(e) => onClientName(e.target.value)} />
            <Input label="Client email *" placeholder="client@company.com" value={clientEmail} onChange={(e) => onClientEmail(e.target.value)} />
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <Input label="Company" placeholder="e.g. ABC College" value={company} onChange={(e) => onCompany(e.target.value)} />
            <Input label="Priority" placeholder="low | medium | high | critical" value={projectPriority} onChange={(e) => onProjectPriority(e.target.value)} />
            <Input label="Expected delivery" placeholder="YYYY-MM-DD" value={expectedDeliveryDate} onChange={(e) => onExpectedDeliveryDate(e.target.value)} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-text-heading">Project brief</span>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs font-medium text-brand-primary hover:underline"
              >
                or attach a file
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                acceptFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                'relative rounded-xl border-2 border-dashed transition-all duration-200 p-5',
                'bg-canvas-surface/40 text-center cursor-pointer',
                dragging ? 'border-brand-primary bg-brand-primary/5' : 'border-canvas-border hover:border-brand-primary/50'
              )}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
              <UploadCloud size={28} className={cn('mx-auto mb-2', dragging ? 'text-brand-primary' : 'text-text-muted')} />
              <p className="text-sm font-medium text-text-heading">
                {dragging ? 'Drop it — I’ll take it from here' : 'Drag & drop your requirements document'}
              </p>
              <p className="text-xs text-text-muted mt-1">PDF · DOCX · TXT · Markdown — or paste your brief below</p>
            </div>

            {invalidFile && <p className="text-xs text-error-600 mt-2">{invalidFile}</p>}

            {file && (
              <div className="flex items-center gap-3 mt-3 rounded-xl border border-canvas-border bg-canvas-surface/60 p-3">
                <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-brand-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-heading truncate">{file.name}</p>
                  <p className="text-xs text-text-muted">{formatBytes(file.size)}</p>
                </div>
                {/\.(txt|md)$/i.test(file.name) && (
                  <button
                    type="button"
                    onClick={() => setPreview((p) => !p)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text-heading"
                  >
                    {preview ? <EyeOff size={14} /> : <Eye size={14} />}
                    {preview ? 'Hide' : 'Preview'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setFileText('');
                  }}
                  className="p-1.5 rounded-lg text-text-muted hover:text-error-600 hover:bg-error-50 transition-colors"
                  aria-label="Remove file"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {file && preview && fileText && (
              <div className="mt-2 rounded-xl border border-canvas-border bg-canvas-surface/60 p-4 max-h-40 overflow-y-auto">
                <p className="text-xs text-text-heading whitespace-pre-wrap leading-relaxed">{fileText}</p>
              </div>
            )}

            <div className="relative mt-3">
              <Textarea
                label="Or paste your requirements brief"
                placeholder="Paste the product brief, feature wishlist, user stories or any reference material here. The more context, the richer the plan."
                value={sourceText}
                onChange={(e) => onSourceText(e.target.value)}
                className="min-h-[160px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-canvas-border">
            <div className="flex items-start gap-2 text-xs text-text-muted max-w-[340px]">
              <FileIcon size={14} className="mt-0.5 shrink-0" />
              <span>The pipeline runs 6 governed stages — analysis, features, tasks, assignments, sprints and monitoring — automatically to 100% on OpenCode Zen.</span>
            </div>
            <Button
              size="lg"
              disabled={!canStart}
              loading={starting}
              onClick={() => onStart(file)}
              className="shrink-0"
            >
              <span className="inline-flex items-center gap-2">
                Start Execution
                <ArrowRight size={16} />
              </span>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}