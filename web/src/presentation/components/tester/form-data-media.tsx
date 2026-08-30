'use client';

import * as React from 'react';
import { FileUp, Image as ImageIcon, Music, Video, FileText, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEnvStore } from '@/application/stores/use-env-store';

interface FormDataMediaProps {
  onFormDataChange: (formData: FormData | null, isValid: boolean) => void;
}

export function FormDataMedia({ onFormDataChange }: FormDataMediaProps) {
  const { selectedConnectionId } = useEnvStore();
  const [file, setFile] = React.useState<File | null>(null);
  const [connectionId, setConnectionId] = React.useState<string>(
    selectedConnectionId ? String(selectedConnectionId) : '1'
  );
  const [to, setTo] = React.useState('5511999999999');
  const [type, setType] = React.useState<'image' | 'video' | 'audio' | 'document'>('image');
  const [caption, setCaption] = React.useState('');

  React.useEffect(() => {
    if (selectedConnectionId) {
      setConnectionId(String(selectedConnectionId));
    }
  }, [selectedConnectionId]);

  const updateFormData = React.useCallback(() => {
    if (!file || !to.trim() || !connectionId.trim() || !type) {
      onFormDataChange(null, false);
      return;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('connectionId', connectionId);
    fd.append('to', to);
    fd.append('type', type);
    if (caption.trim()) {
      fd.append('caption', caption);
    }

    onFormDataChange(fd, true);
  }, [file, connectionId, to, type, caption, onFormDataChange]);

  React.useEffect(() => {
    updateFormData();
  }, [updateFormData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      // Auto-detect type
      if (selected.type.startsWith('image/')) setType('image');
      else if (selected.type.startsWith('video/')) setType('video');
      else if (selected.type.startsWith('audio/')) setType('audio');
      else setType('document');
    }
  };

  const getFileIcon = () => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-8 h-8 text-emerald-400" />;
      case 'audio':
        return <Music className="w-8 h-8 text-sky-400" />;
      case 'video':
        return <Video className="w-8 h-8 text-purple-400" />;
      default:
        return <FileText className="w-8 h-8 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Educational banner */}
      <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-900/40 text-sky-200 text-xs flex items-start gap-2.5">
        <FileUp className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Formato Multipart/Form-Data:</strong> Endpoints de envio de mídia
          exigem o upload do arquivo binário real para os servidores da Meta. Preencha os
          campos abaixo para montar a requisição.
        </p>
      </div>

      {/* File Upload Dropzone */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-foreground/80">
          Arquivo Físico <span className="text-rose-400">*</span>
        </Label>

        {file ? (
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
            <div className="flex items-center gap-3">
              {getFileIcon()}
              <div className="flex flex-col">
                <span className="text-xs font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
                  {file.name}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {(file.size / 1024).toFixed(1)} KB • {file.type || 'tipo desconhecido'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl hover:border-emerald-500/50 hover:bg-secondary/20 transition-all cursor-pointer group">
            <FileUp className="w-8 h-8 text-muted-foreground group-hover:text-emerald-400 transition-colors mb-2" />
            <span className="text-xs font-medium text-foreground/90">
              Clique para selecionar um arquivo
            </span>
            <span className="text-[11px] text-muted-foreground mt-1">
              Imagens, Áudios, Vídeos ou Documentos (PDF, DOCX)
            </span>
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              required
            />
          </label>
        )}
      </div>

      {/* Form Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            connectionId <span className="text-rose-400">*</span>
          </Label>
          <Input
            type="number"
            value={connectionId}
            onChange={(e) => setConnectionId(e.target.value)}
            placeholder="Ex: 1"
            className="h-8 text-xs font-mono bg-background border-border"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Destinatário (to) <span className="text-rose-400">*</span>
          </Label>
          <Input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Ex: 5511999999999"
            className="h-8 text-xs font-mono bg-background border-border"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Tipo de Mídia (type) <span className="text-rose-400">*</span>
          </Label>
          <Select
            value={type}
            onValueChange={(val: any) => setType(val)}
          >
            <SelectTrigger className="h-8 text-xs font-mono bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-popover text-xs font-mono">
              <SelectItem value="image">image (Imagem)</SelectItem>
              <SelectItem value="document">document (Documento)</SelectItem>
              <SelectItem value="audio">audio (Áudio)</SelectItem>
              <SelectItem value="video">video (Vídeo)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Legenda (caption - opcional)
          </Label>
          <Input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Ex: Segue a foto solicitada"
            className="h-8 text-xs bg-background border-border"
          />
        </div>
      </div>
    </div>
  );
}
