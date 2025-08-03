// frontend/src/main.tsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DateFormatProvider } from "./contexts/DateFormatContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { StripeProvider } from "./contexts/StripeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  //<React.StrictMode>
    <StripeProvider>
      <SettingsProvider>
        <DateFormatProvider>
          <App />
        </DateFormatProvider>
      </SettingsProvider>
    </StripeProvider>
  //</React.StrictMode>
);
