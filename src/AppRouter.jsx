import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import MoleculeViewer from "./components/MoleculeViewer";
import KineticsLab from "./components/KineticsLab";

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/viewer" element={<MoleculeViewer />} />
    <Route path="/lab" element={<KineticsLab />} />
    <Route path="/:categoryId" element={<CategoryPage />} />
    <Route path="*" element={<div style={{ padding: 40, textAlign: "center" }}>
      <h2>Page Not Found</h2>
      <p>The requested page does not exist.</p>
    </div>} />
  </Routes>
);

export default AppRouter;
