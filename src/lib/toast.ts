/**
 * Client-side entry point for the site toast (src/components/Toast.astro).
 *
 * Toast.astro is mounted once in Layout.astro and listens for these events, so
 * any bundled <script> can raise a toast without knowing where the stack lives:
 *
 *   import { toast } from "@/lib/toast";
 *   toast({ title: "Saved", message: "Your details are in.", variant: "success" });
 *
 * For a toast decided on the server, render <Toast title="..." /> instead.
 */

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastOptions {
  title: string;
  message?: string;
  variant?: ToastVariant;
  /** Milliseconds on screen. Defaults to 6000. */
  duration?: number;
}

export const TOAST_EVENT = "gp:toast";
export const TOAST_CLEAR_EVENT = "gp:toast-clear";

export function toast(options: ToastOptions): void {
  document.dispatchEvent(new CustomEvent<ToastOptions>(TOAST_EVENT, { detail: options }));
}

export function clearToasts(): void {
  document.dispatchEvent(new CustomEvent(TOAST_CLEAR_EVENT));
}
