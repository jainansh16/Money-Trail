import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DataProvider } from "./components/DataContext"; // adjust path

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DataProvider>
      <App />
    </DataProvider>
  </React.StrictMode>
);