import { createPortal } from "react-dom";

export function AdminModalPortal({ children, ...props }) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="admin-modal-backdrop" {...props}>
      {children}
    </div>,
    document.body
  );
}
