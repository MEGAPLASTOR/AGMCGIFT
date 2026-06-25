import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { adminRoute } from "./routes/adminRoute.jsx";
import { giftCodeRoute } from "./routes/giftCodeRoute.jsx";
import { giftInfoRoute } from "./routes/giftInfoRoute.jsx";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to={giftCodeRoute.path} replace />} />
        <Route path={giftCodeRoute.path} element={giftCodeRoute.element} />
        <Route path={giftInfoRoute.path} element={giftInfoRoute.element} />
        <Route path={adminRoute.path} element={adminRoute.element} />
      </Routes>
    </HashRouter>
  );
}

export default App;
