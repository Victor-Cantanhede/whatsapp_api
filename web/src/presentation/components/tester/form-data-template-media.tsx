'use client';

import * as React from 'react';
import { FileUp, FileText, Plus, Trash2, X, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useEnvStore } from '@/application/stores/use-env-store';

interface FormDataTemplateMediaProps {
  onFormDataChange: (formData: FormData | null, isValid: boolean) => void;
}

export function FormDataTemplateMedia({ onFormDataChange }: FormDataTemplateMediaProps) {
  const { selectedConnectionId } = useEnvStore();

  const [file, setFile] = React.useState<File | null>(null);
  const [connectionId, setConnectionId] = React.useState<string>(
    selectedConnectionId ? String(selectedConnectionId) : '1'
  );
  const [to, setTo] = React.useState('5511999999999');
  const [templateName, setTemplateName] = React.useState('fatura_mensal');
  const [filename, setFilename] = React.useState('Fatura_Outubro.pdf');
  const [language, setLanguage] = React.useState('pt_BR');
  const [variables, setVariables] = React.useState<string[]>(['João', 'R$ 150,00']);

  const [prevSelectedId, setPrevSelectedId] = React.useState(selectedConnectionId);

  if (selectedConnectionId !== prevSelectedId) {
    setPrevSelectedId(selectedConnectionId);
    if (selectedConnectionId) {
      setConnectionId(String(selectedConnectionId));
    }
  }

  const updateFormData = React.useCallback(() => {
    if (!file || !connectionId.trim() || !to.trim() || !templateName.trim()) {
      onFormDataChange(null, false);
      return;
    }

    const fd = new FormData();
    fd.append('file', file);
    fd.append('connectionId', connectionId);
    fd.append('to', to);
    fd.append('templateName', templateName);

    if (filename.trim()) {
      fd.append('filename', filename.trim());
    }

    if (language.trim()) {
      fd.append('language', language.trim());
    }

    const validVars = variables.filter((v) => v.trim() !== '');
    if (validVars.length > 0) {
      fd.append('variables', JSON.stringify(validVars));
    }

    onFormDataChange(fd, true);
  }, [file, connectionId, to, templateName, filename, language, variables, onFormDataChange]);

  React.useEffect(() => {
    updateFormData();
  }, [updateFormData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!filename.trim()) {
        setFilename(selected.name);
      }
    }
  };

  const handleAddVariable = () => {
    setVariables((prev) => [...prev, '']);
  };

  const handleUpdateVariable = (index: number, val: string) => {
    setVariables((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveVariable = (index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Educational banner */}
      <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-emerald-200 text-xs flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Envio de Template com Documento Físico (Multipart):</strong> Anexe um arquivo PDF/documento do seu computador para ser enviado no cabeçalho do template da Meta, sem necessidade de servidores de storage externos (como S3).
        </p>
      </div>

      {/* File Upload Dropzone */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-foreground/80">
          Arquivo do Documento (PDF / Documento Físico) <span className="text-destructive">*</span>
        </Label>

        {!file ? (
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/80 hover:border-emerald-500/50 rounded-xl bg-secondary/10 hover:bg-secondary/20 cursor-pointer transition-colors group">
            <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors mb-2">
              <FileUp className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-foreground">
              Clique para selecionar ou arraste o arquivo PDF aqui
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Formatos aceitos: PDF, DOCX, XLSX (máximo 100 MB)
            </p>
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
          </label>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                <p className="text-[11px] text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFile(null)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Grid: Connection ID & Recipient */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground/80">
            ID da Conexão <span className="text-destructive">*</span>
          </Label>
          <Input
            value={connectionId}
            onChange={(e) => setConnectionId(e.target.value)}
            placeholder="Ex: 1"
            className="h-8 text-xs font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground/80">
            Número Destinatário (com DDI) <span className="text-destructive">*</span>
          </Label>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Ex: 5511999999999"
            className="h-8 text-xs font-mono"
          />
        </div>
      </div>

      {/* Grid: Template Name & Filename */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground/80">
            Nome do Template na Meta <span className="text-destructive">*</span>
          </Label>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Ex: fatura_mensal"
            className="h-8 text-xs font-mono"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground/80">
            Nome de Exibição no WhatsApp (Opcional)
          </Label>
          <Input
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="Ex: Fatura_Outubro.pdf"
            className="h-8 text-xs font-mono"
          />
        </div>
      </div>

      {/* Language */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-foreground/80">Idioma do Template</Label>
        <Input
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="pt_BR"
          className="h-8 text-xs font-mono max-w-[200px]"
        />
      </div>

      {/* Dynamic Variables Section */}
      <div className="space-y-2 border-t border-border/80 pt-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs font-medium text-foreground/80">
              Variáveis do Corpo do Template
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Valores interpolados para os marcadores {`{{1}}, {{2}}`} do corpo
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddVariable}
            className="h-7 text-xs gap-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Variável
          </Button>
        </div>

        {variables.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-2">
            Nenhuma variável configurada. Clique no botão acima caso seu template possua parâmetros.
          </p>
        ) : (
          <div className="space-y-2">
            {variables.map((val, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground w-8 shrink-0">
                  {`{{${idx + 1}}}`}
                </span>
                <Input
                  value={val}
                  onChange={(e) => handleUpdateVariable(idx, e.target.value)}
                  placeholder={`Valor da variável {{${idx + 1}}}`}
                  className="h-8 text-xs font-mono flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveVariable(idx)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
