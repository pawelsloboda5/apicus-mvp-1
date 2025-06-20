"use client";

import React, { useActionState, useOptimistic, startTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types for form actions and state
export type FormState = {
  message?: string;
  error?: string;
  success?: boolean;
} | null;

export type FormAction<T = FormData> = (
  prevState: FormState,
  formData: T
) => Promise<FormState>;

interface OptimizedFormProps {
  action: FormAction;
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  successMessage?: string;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
}

/**
 * Optimized submit button that uses useFormStatus for automatic pending state
 * React 19 feature - automatically detects parent form submission state
 */
export function SubmitButton({
  children,
  pendingText = "Submitting...",
  className,
  variant = "default",
  size = "default",
  disabled: externalDisabled,
  ...props
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'>) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || externalDisabled}
      variant={variant}
      size={size}
      className={className}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

/**
 * Form input that provides visual feedback during form submission
 */
export function FormInput({
  label,
  error,
  required,
  className,
  ...props
}: {
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const { pending } = useFormStatus();

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={props.id} className={required ? "after:content-['*'] after:text-destructive after:ml-1" : ""}>
          {label}
        </Label>
      )}
      <Input
        {...props}
        disabled={pending || props.disabled}
        className={cn(
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

/**
 * Form textarea with submission state awareness
 */
export function FormTextarea({
  label,
  error,
  required,
  className,
  ...props
}: {
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { pending } = useFormStatus();

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={props.id} className={required ? "after:content-['*'] after:text-destructive after:ml-1" : ""}>
          {label}
        </Label>
      )}
      <Textarea
        {...props}
        disabled={pending || props.disabled}
        className={cn(
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

/**
 * React 19 optimized form component using useActionState
 * Provides automatic pending state management and optimistic updates
 */
export function OptimizedForm({
  action,
  children,
  className,
  pendingText = "Processing...",
  successMessage,
  onSuccess,
  resetOnSuccess = false,
}: OptimizedFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  // Handle success callback
  React.useEffect(() => {
    if (state?.success && onSuccess) {
      onSuccess();
    }
  }, [state?.success, onSuccess]);

  // Reset form on success if requested
  React.useEffect(() => {
    if (state?.success && resetOnSuccess) {
      const form = document.querySelector('form') as HTMLFormElement;
      form?.reset();
    }
  }, [state?.success, resetOnSuccess]);

  return (
    <form action={formAction} className={cn("space-y-4", className)}>
      {children}
      
      {/* Display form state messages */}
      {state?.error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {state.error}
        </div>
      )}
      
      {state?.success && (
        <div className="text-sm text-green-600 bg-green-100 dark:bg-green-900/20 p-3 rounded-md">
          {successMessage || state.message || "Success!"}
        </div>
      )}
      
      {isPending && (
        <div className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-md flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {pendingText}
        </div>
      )}
    </form>
  );
}

/**
 * Optimistic form component for immediate UI feedback
 * Uses React 19's useOptimistic hook for instant updates
 */
export function OptimisticForm<T>({
  initialData,
  action,
  children,
  className,
  optimisticUpdate,
}: {
  initialData: T;
  action: FormAction;
  children: (data: T, isPending: boolean) => React.ReactNode;
  className?: string;
  optimisticUpdate: (currentData: T, formData: FormData) => T;
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [optimisticData, addOptimistic] = useOptimistic(initialData);

  const handleSubmit = async (formData: FormData) => {
    startTransition(() => {
      // Apply optimistic update manually
      const updatedData = optimisticUpdate(optimisticData, formData);
      addOptimistic(updatedData);
      formAction(formData);
    });
  };

  return (
    <form action={handleSubmit} className={className}>
      {children(optimisticData, isPending)}
      
      {state?.error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mt-4">
          {state.error}
        </div>
      )}
    </form>
  );
}

/**
 * ROI Settings form optimized for React 19
 * Uses optimistic updates for immediate feedback
 */
export function OptimizedROIForm({
  initialValues,
  onUpdate,
  className,
}: {
  initialValues: {
    runsPerMonth: number;
    minutesPerRun: number;
    hourlyRate: number;
  };
  onUpdate: (values: typeof initialValues) => Promise<FormState>;
  className?: string;
}) {
  const updateAction: FormAction = async (prevState, formData) => {
    const newValues = {
      runsPerMonth: Number(formData.get('runsPerMonth')),
      minutesPerRun: Number(formData.get('minutesPerRun')),
      hourlyRate: Number(formData.get('hourlyRate')),
    };
    
    return onUpdate(newValues);
  };

  const optimisticUpdate = (currentData: typeof initialValues, formData: FormData) => ({
    runsPerMonth: Number(formData.get('runsPerMonth')) || currentData.runsPerMonth,
    minutesPerRun: Number(formData.get('minutesPerRun')) || currentData.minutesPerRun,
    hourlyRate: Number(formData.get('hourlyRate')) || currentData.hourlyRate,
  });

  return (
    <OptimisticForm
      initialData={initialValues}
      action={updateAction}
      className={className}
      optimisticUpdate={optimisticUpdate}
    >
      {(data, isPending) => (
        <div className="space-y-4">
          <FormInput
            name="runsPerMonth"
            label="Runs per Month"
            type="number"
            defaultValue={data.runsPerMonth}
            min={1}
            max={10000}
            required
          />
          
          <FormInput
            name="minutesPerRun"
            label="Minutes per Run"
            type="number"
            defaultValue={data.minutesPerRun}
            min={0.1}
            max={120}
            step={0.1}
            required
          />
          
          <FormInput
            name="hourlyRate"
            label="Hourly Rate ($)"
            type="number"
            defaultValue={data.hourlyRate}
            min={5}
            max={500}
            required
          />
          
          <SubmitButton
            pendingText="Updating ROI..."
            className="w-full"
          >
            Update ROI Settings
          </SubmitButton>
          
          {isPending && (
            <div className="text-xs text-muted-foreground">
              Values are updated optimistically while saving...
            </div>
          )}
        </div>
      )}
    </OptimisticForm>
  );
} 