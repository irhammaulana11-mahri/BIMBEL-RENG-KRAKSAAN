import React from "react";
import ReactDOM from "react-dom/client";

import { RouterProvider } from "react-router-dom";
import SessionManager from "./components/auth/SessionManager";
import AuthProvider from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppWrapper } from "./components/layout/PageMeta";

import { router } from "./routes";

import "./index.css";
import "./styles/dark-theme.css";
import { ConfirmationProvider } from "./components/ui/confirmation";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SessionManager>
          <AppWrapper>
            <ConfirmationProvider>
              <RouterProvider router={router} />
            </ConfirmationProvider>
          </AppWrapper>
        </SessionManager>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);