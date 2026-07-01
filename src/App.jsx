import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { adminRoute } from "./routes/adminRoute.jsx";
import { giftCodeRoute } from "./routes/giftCodeRoute.jsx";
import { giftInfoRoute } from "./routes/giftInfoRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            background: "#1f2937",
            color: "#f9fafb",
            border: "1px solid #374151",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
          },
          success: {
            style: {
              border: "1px solid #14532d",
            },
          },
          error: {
            style: {
              border: "1px solid #7f1d1d",
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to={giftCodeRoute.path} replace />} />
        <Route path={giftCodeRoute.path} element={giftCodeRoute.element} />
        <Route path={giftInfoRoute.path} element={giftInfoRoute.element} />
        <Route path={adminRoute.path} element={adminRoute.element} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
