import * as React from "react";
import {
  Controller,
  FormProvider,
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { cn } from "@/lib/utils";

interface FormProps<TFormValues extends FieldValues> extends UseFormReturn<TFormValues> {
  children: React.ReactNode;
}

export function Form<TFormValues extends FieldValues>({ children, ...form }: FormProps<TFormValues>) {
  return <FormProvider {...form}>{children}</FormProvider>;
}

interface FormFieldProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> {
  control: Control<TFieldValues>;
  name: TName;
  render: (props: { field: ControllerRenderProps<TFieldValues, TName> }) => React.ReactElement;
}

export function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  control,
  name,
  render,
}: FormFieldProps<TFieldValues, TName>) {
  return <Controller control={control} name={name} render={render} />;
}

export function FormItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FormLabel({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-stone-700", className)} {...props} />;
}

export function FormControl({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1", className)} {...props} />;
}

export function FormMessage({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-red-600", className)} {...props} />;
}
