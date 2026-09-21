import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/utils/cn';

interface WrapperProps {
  htmlFor?: string;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

function FieldWrapper({ htmlFor, label, error, hint, required, children }: WrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-brand-900">
          {label}
          {required && <span className="text-rose-600"> *</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-brand-500">{hint}</p>}
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

const baseInputClasses =
  'w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm text-brand-900 ' +
  'placeholder:text-brand-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 ' +
  'disabled:cursor-not-allowed disabled:bg-brand-50';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, required, className, rightElement, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <FieldWrapper htmlFor={inputId} label={label} error={error} hint={hint} required={required}>
        {rightElement ? (
          <div className="relative">
            <input
              ref={ref}
              id={inputId}
              className={cn(
                baseInputClasses,
                'pr-10',
                error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100',
                className,
              )}
              {...props}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">{rightElement}</div>
          </div>
        ) : (
          <input
            ref={ref}
            id={inputId}
            className={cn(baseInputClasses, error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100', className)}
            {...props}
          />
        )}
      </FieldWrapper>
    );
  },
);
Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, className, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    return (
      <FieldWrapper htmlFor={textareaId} label={label} error={error} hint={hint} required={required}>
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(baseInputClasses, 'min-h-24 resize-y', error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-100', className)}
          {...props}
        />
      </FieldWrapper>
    );
  },
);
Textarea.displayName = 'Textarea';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, className, children, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    return (
      <FieldWrapper htmlFor={selectId} label={label} error={error} hint={hint} required={required}>
        <select
          ref={ref}
          id={selectId}
          className={cn(baseInputClasses, 'appearance-none bg-no-repeat', error && 'border-rose-400', className)}
          {...props}
        >
          {children}
        </select>
      </FieldWrapper>
    );
  },
);
Select.displayName = 'Select';
