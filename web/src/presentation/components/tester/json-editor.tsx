'use client';

import * as React from 'react';
import { AlertCircle, Check, Copy, FileUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface JsonEditorProps {
  value: string;
  onChange: (val: string) => void;
  onErrorChange?: (hasError: boolean) => void;
}

export function JsonEditor({ value, onChange, onErrorChange }: JsonEditorProps) {
  const [jsonError, setJsonError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validate = React.useCallback(
    (text: string) => {
      if (!text.trim()) {
        setJsonError(null);
        onErrorChange?.(false);
        return true;
      }
      try {
        JSON.parse(text);
        setJsonError(null);
        onErrorChange?.(false);
        return true;
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Sintaxe JSON inválida';
        setJsonError(message);
        onErrorChange?.(true);
        return false;
      }
    },
    [onErrorChange]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);
    validate(val);
  };

  const handleFormat = () => {
    if (!value.trim()) return;
    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      setJsonError(null);
      onErrorChange?.(false);
    } catch {
      // ignore
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileToBase64 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      try {
        let currentObj: Record<string, any> = {};
        if (value.trim()) {
          currentObj = JSON.parse(value);
        }
        currentObj.document = {
          ...(currentObj.document || {}),
          base64: base64Data,
          filename: selectedFile.name,
        };
        const updated = JSON.stringify(currentObj, null, 2);
        onChange(updated);
        setJsonError(null);
        onErrorChange?.(false);
        toast.success(`Arquivo "${selectedFile.name}" convertido e inserido em document.base64!`);
      } catch {
        toast.error('Erro ao injetar Base64 no JSON atual. Verifique a sintaxe.');
      }
    };
    reader.readAsDataURL(selectedFile);
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground/80">
          Corpo da Requisição (JSON Body)
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileToBase64}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-6 px-2 text-[11px] font-medium text-muted-foreground hover:text-emerald-400 gap-1 border border-border/60 hover:border-emerald-500/40"
            title="Converte um arquivo local em Base64 e injeta em document.base64"
          >
            <FileUp className="w-3 h-3 text-emerald-400" />
            PDF para Base64
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFormat}
            disabled={!!jsonError}
            className="h-6 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground gap-1"
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Formatar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground gap-1"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            Copiar
          </Button>
        </div>
      </div>

      <div className="relative">
        <Textarea
          value={value}
          onChange={handleChange}
          rows={10}
          spellCheck={false}
          className={`font-mono text-xs p-3.5 bg-zinc-950 text-zinc-100 dark:bg-black dark:text-zinc-200 border resize-y transition-colors ${
            jsonError
              ? 'border-rose-500/80 focus-visible:ring-rose-500/50'
              : 'border-border focus-visible:ring-emerald-500/30'
          }`}
          placeholder="{\n  \n}"
        />
      </div>

      {jsonError && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Erro de sintaxe JSON: {jsonError}</span>
        </div>
      )}
    </div>
  );
}
