/**
 * toast notification system
 * simple non obtrusive notifications for user feedback
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let toastId = 0;
const listeners: Set<(toast: Toast) => void> = new Set();
const removeListeners: Set<(id: string) => void> = new Set();

/**
 * subscribe to toast notif
 */
export function onToast(callback: (toast: Toast) => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * subscribe to toast removal
 */
export function onRemoveToast(callback: (id: string) => void) {
  removeListeners.add(callback);
  return () => removeListeners.delete(callback);
}

/**
 * show a toast notif
 */
function showToast(message: string, type: ToastType, duration = 3000) {
  const id = String(++toastId);
  const toast: Toast = { id, message, type, duration };

  // notify subscribers
  listeners.forEach(cb => cb(toast));

  // auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeListeners.forEach(cb => cb(id));
    }, duration);
  }

  return id;
}

/**
 * toast notif API
 */
export const toast = {
  success: (message: string, duration?: number) => showToast(message, 'success', duration),
  error: (message: string, duration?: number) => showToast(message, 'error', duration),
  info: (message: string, duration?: number) => showToast(message, 'info', duration),
  warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
  remove: (id: string) => removeListeners.forEach(cb => cb(id)),
};

export default toast;
