import { jsx as _jsx } from "react/jsx-runtime";
// frontend/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DateFormatProvider } from "./contexts/DateFormatContext";
import "./index.css";
ReactDOM.createRoot(document.getElementById("root")).render(_jsx(React.StrictMode, { children: _jsx(DateFormatProvider, { children: _jsx(App, {}) }) }));
