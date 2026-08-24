'use client';

import * as React from 'react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { th } from 'react-day-picker/locale';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = th,
  ...props
}: DayPickerProps) {
  return (
    <DayPicker
      locale={locale}
      showOutsideDays={showOutsideDays}
      {...props}
      className={cn('p-3', className)}
      classNames={{
        months: 'relative flex flex-col gap-4',
        month: 'flex flex-col gap-3',
        month_caption:
          'mx-auto flex h-8 w-full items-center justify-center text-sm font-semibold',
        nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
        button_previous: cn(
          buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
          'text-muted-foreground hover:text-foreground',
        ),
        button_next: cn(
          buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
          'text-muted-foreground hover:text-foreground',
        ),
        month_grid: 'border-collapse',
        weekdays: 'flex',
        weekday: 'w-9 pb-1 text-[0.7rem] font-medium text-muted-foreground',
        week: 'mt-1 flex w-full',
        day: 'flex h-9 w-9 items-center justify-center p-0 text-sm',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-9 rounded-lg p-0 font-normal aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary/85',
        ),
        range_start: '[&>button]:rounded-r-none',
        range_end: '[&>button]:rounded-l-none',
        range_middle:
          '[&>button]:rounded-none [&>button]:bg-white/10 [&>button]:text-foreground',
        today:
          '[&>button:not([aria-selected])]:font-semibold [&>button:not([aria-selected])]:text-accent',
        outside: 'opacity-40',
        disabled: 'pointer-events-none opacity-30',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className }) =>
          orientation === 'left' ? (
            <ChevronLeftIcon className={className} />
          ) : (
            <ChevronRightIcon className={className} />
          ),
      }}
    />
  );
}

export { Calendar };
