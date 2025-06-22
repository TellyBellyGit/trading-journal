// frontend/src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DateFormatProvider } from "./contexts/DateFormatContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DateFormatProvider>
      <App />
    </DateFormatProvider>
  </React.StrictMode>
);
