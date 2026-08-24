'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, ChevronDownIcon, RotateCcw } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangeFilterProps {
  from: string;
  to: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const PRESETS = [
  { label: 'วันนี้', days: 1 },
  { label: '7 วัน', days: 7 },
  { label: '30 วัน', days: 30 },
];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function formatThaiDate(date: Date): string {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function DateRangeFilter({ from, to }: DateRangeFilterProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: new Date(from),
    to: new Date(to),
  }));

  const today = new Date();
  const activePreset = PRESETS.find(
    (p) =>
      range?.from &&
      range?.to &&
      startOfDay(range.from).getTime() ===
        startOfDay(
          new Date(today.getTime() - (p.days - 1) * DAY_MS),
        ).getTime() &&
      startOfDay(range.to).getTime() === startOfDay(today).getTime(),
  )?.label;

  const push = (fromDate: Date, toDate: Date) => {
    const params = new URLSearchParams({
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    });
    router.push(`/?${params.toString()}`);
  };

  const handleSelect = (selected: DateRange | undefined) => {
    setRange(selected);
    if (selected?.from && selected?.to) {
      push(startOfDay(selected.from), endOfDay(selected.to));
      setOpen(false);
    }
  };

  const applyPreset = (days: number) => {
    const next = {
      from: startOfDay(new Date(today.getTime() - (days - 1) * DAY_MS)),
      to: endOfDay(today),
    };
    setRange(next);
    push(next.from, next.to);
  };

  const reset = () => {
    setRange({
      from: startOfDay(new Date(Date.now() - 6 * DAY_MS)),
      to: endOfDay(new Date()),
    });
    router.push('/');
  };

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 p-3 bg-background/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground whitespace-nowrap">
        <CalendarClock className="w-4 h-4" />
        <span className="hidden md:inline">ช่วงวันที่อัปโหลด</span>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="justify-start gap-2 border-white/10 bg-black/20 font-normal text-white hover:bg-black/30 hover:text-white aria-expanded:bg-black/30"
            />
          }
        >
          <CalendarClock className="size-4 text-muted-foreground" />
          <span suppressHydrationWarning>
            {range?.from && range?.to
              ? `${formatThaiDate(range.from)} – ${formatThaiDate(range.to)}`
              : 'เลือกช่วงวันที่'}
          </span>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="range"
            numberOfMonths={1}
            selected={range}
            defaultMonth={range?.from}
            onSelect={handleSelect}
          />
          <p className="border-t border-white/10 px-4 py-2 text-xs text-muted-foreground">
            ค่าเริ่มต้น: 7 วันย้อนหลัง
          </p>
        </PopoverContent>
      </Popover>

      <div className="flex items-center gap-1 ml-auto">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => applyPreset(preset.days)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activePreset === preset.label
                ? 'text-white bg-white/10 border border-white/20'
                : 'text-muted-foreground hover:text-white/80'
            }`}
          >
            {preset.label === '7 วัน' ? '7 วัน (เริ่มต้น)' : preset.label}
          </button>
        ))}
        <Button
          variant="ghost"
          size="icon-sm"
          title="รีเซ็ตเป็นค่าเริ่มต้น (7 วันย้อนหลัง)"
          onClick={reset}
          className="ml-1 text-muted-foreground hover:text-white/80"
        >
          <RotateCcw />
        </Button>
      </div>
    </div>
  );
}
