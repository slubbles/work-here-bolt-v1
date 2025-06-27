@@ .. @@
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
+import { useToast } from '@/hooks/use-toast';

const ToastProvider = ToastPrimitives.Provider;
@@ .. @@
type ToastActionElement = React.ReactElement<typeof ToastAction>;

+function Toaster() {
+  const { toasts } = useToast();
+
+  return (
+    <ToastProvider>
+      {toasts.map(function ({ id, title, description, action, ...props }) {
+        return (
+          <Toast key={id} {...props}>
+            <div className="grid gap-1">
+              {title && <ToastTitle>{title}</ToastTitle>}
+              {description && (
+                <ToastDescription>{description}</ToastDescription>
+              )}
+            </div>
+            {action}
+            <ToastClose />
+          </Toast>
+        );
+      })}
+      <ToastViewport />
+    </ToastProvider>
+  );
+}
+
export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
+  Toaster,
};