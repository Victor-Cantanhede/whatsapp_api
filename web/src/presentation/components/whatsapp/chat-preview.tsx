'use client';

import * as React from 'react';
import { CheckCheck, MessageSquare } from 'lucide-react';

interface ChatPreviewProps {
  text?: string;
  recipient?: string;
  templateName?: string;
}

export function ChatPreview({ text, recipient, templateName }: ChatPreviewProps) {
  const time = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const displayText =
    text ||
    (templateName
      ? `[Template: ${templateName}]`
      : 'Digite uma mensagem para visualizar o balão de chat.');

  return (
    <div className="rounded-xl border border-border bg-[#0b141a] p-4 text-white overflow-hidden space-y-2 shadow-inner">
      <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800/80 pb-2">
        <span className="flex items-center gap-1.5 font-medium text-emerald-400">
          <MessageSquare className="w-3.5 h-3.5" />
          Preview no WhatsApp
        </span>
        {recipient && (
          <span className="font-mono text-[11px] text-zinc-400">
            Para: {recipient}
          </span>
        )}
      </div>

      {/* WhatsApp Message Bubble */}
      <div className="flex justify-end pt-2">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-lg rounded-tr-none bg-[#005c4b] text-[#e9edef] p-3 shadow-md space-y-1 relative">
          <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">
            {displayText}
          </p>
          <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-200/70 pt-0.5">
            <span>{time}</span>
            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
          </div>
        </div>
      </div>
    </div>
  );
}
