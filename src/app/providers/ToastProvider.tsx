import React, { createContext, useContext, useMemo, useState } from "react";
import { Alert, Snackbar } from "@mui/material";

export type ToastPayload = {
  message: string;
  severity?: "success" | "info" | "warning" | "error";
};

type ToastContextValue = {
  pushToast: (payload: ToastPayload) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  const pushToast = (payload: ToastPayload) => {
    setToast(payload);
  };

  const handleClose = () => setToast(null);

  const value = useMemo(() => ({ pushToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleClose} severity={toast?.severity || "info"} sx={{ width: "100%" }}>
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};
