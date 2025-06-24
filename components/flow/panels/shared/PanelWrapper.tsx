import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PanelWrapperProps {
  /** Whether the panel is open */
  open: boolean;
  /** Callback fired when the panel should close */
  onOpenChange: (open: boolean) => void;
  /** Panel title */
  title: string;
  /** Panel description */
  description?: string;
  /** Panel content */
  children: React.ReactNode;
  /** Additional footer content */
  footer?: React.ReactNode;
  /** Whether to show delete button */
  showDelete?: boolean;
  /** Callback fired when delete is clicked */
  onDelete?: () => void;
  /** Delete button text */
  deleteText?: string;
  /** Panel width class */
  className?: string;
  /** Panel side */
  side?: 'left' | 'right' | 'top' | 'bottom';
}

export function PanelWrapper({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  showDelete = false,
  onDelete,
  deleteText = 'Delete',
  className,
  side = 'right',
}: PanelWrapperProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={side} 
        className={cn(
          "w-[480px] sm:w-[540px] p-0 flex flex-col h-screen",
          className
        )}
      >
        <SheetHeader className="p-6 pb-4 border-b flex-shrink-0">
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <SheetDescription>{description}</SheetDescription>
          )}
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {(footer || showDelete) && (
          <SheetFooter className="p-6 pt-4 border-t flex-shrink-0">
            {footer}
            {showDelete && onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                className="w-full flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deleteText}
              </Button>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
} 