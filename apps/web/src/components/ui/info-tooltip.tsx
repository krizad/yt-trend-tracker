'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoTooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function InfoTooltip({ content, children, side = 'top' }: InfoTooltipProps) {
  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          aria-label="More information"
          className="text-muted-foreground hover:text-white transition-colors cursor-help inline-flex items-center ml-1 outline-none border-none bg-transparent p-0"
        >
          {children || <Info className="w-3.5 h-3.5" />}
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-[280px] bg-card/95 backdrop-blur-md border-white/10 text-white shadow-xl shadow-purple-900/20 text-xs leading-relaxed p-3"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
