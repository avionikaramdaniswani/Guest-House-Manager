import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAuth } from "@/lib/auth";

// Daftarkan token getter ke customFetch supaya semua API call
// otomatis menyertakan Authorization: Bearer <token> dari localStorage
initAuth();

createRoot(document.getElementById("root")!).render(<App />);
