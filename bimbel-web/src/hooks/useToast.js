import { useState } from "react";

export function useToast() {
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showSuccess = (message) => {
    setToast({ show: true, message, type: "success" });
  };

  const showError = (message) => {
    setToast({ show: true, message, type: "error" });
  };

  const hideToast = () => {
    setToast({ show: false, message: "", type: "success" });
  };

  return { toast, showSuccess, showError, hideToast };
}