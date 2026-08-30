'use client';

import * as React from 'react';
import { ParamDefinition } from '@/domain/shared/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DynamicFormProps {
  title: string;
  params: ParamDefinition[];
  values: Record<string, string | number>;
  onChange: (name: string, value: string | number) => void;
  prefixSymbol?: string;
}

export function DynamicForm({
  title,
  params,
  values,
  onChange,
  prefixSymbol = '',
}: DynamicFormProps) {
  if (!params || params.length === 0) return null;

  return (
    <div className="space-y-3 p-4 rounded-xl border border-border bg-card/30">
      <h3 className="text-xs font-semibold text-foreground/90 uppercase tracking-wider">
        {title}
      </h3>

      <div className="space-y-3">
        {params.map((param) => {
          const currentVal = values[param.name] ?? param.default ?? '';

          return (
            <div key={param.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={`input-${param.name}`}
                  className="text-xs font-mono font-medium text-foreground flex items-center gap-1"
                >
                  <span className="text-emerald-400">{prefixSymbol}</span>
                  {param.name}
                  {param.required && <span className="text-rose-400">*</span>}
                </Label>
                {param.type && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {param.type}
                  </span>
                )}
              </div>

              <Input
                id={`input-${param.name}`}
                type={param.type || 'text'}
                value={currentVal}
                onChange={(e) => onChange(param.name, e.target.value)}
                placeholder={param.placeholder || ''}
                className="h-8 text-xs font-mono bg-background border-border"
                required={param.required}
              />

              {param.description && (
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                  {param.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
