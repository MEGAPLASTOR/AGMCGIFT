import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { adminRoute } from "./routes/adminRoute.jsx";
import { giftCodeRoute } from "./routes/giftCodeRoute.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={giftCodeRoute.path} replace />} />
        <Route path={giftCodeRoute.path} element={giftCodeRoute.element} />
        <Route path={adminRoute.path} element={adminRoute.element} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
