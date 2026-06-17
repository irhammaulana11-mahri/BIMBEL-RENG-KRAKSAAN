import React from "react";
import ReactDOM from "react-dom/client";

import { RouterProvider } from "react-router-dom";

import AuthProvider from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppWrapper } from "./components/common/PageMeta";

import { router } from "./routes";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppWrapper>
          <RouterProvider router={router} />
        </AppWrapper>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);