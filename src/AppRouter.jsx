import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import ResourcesPage from "./pages/ResourcesPage";
import GlossaryPage from "./pages/GlossaryPage";
import MoleculeViewer from "./components/MoleculeViewer";
import KineticsLab from "./components/KineticsLab";

const AppRouter = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/viewer" element={<MoleculeViewer />} />
    <Route path="/lab" element={<KineticsLab />} />
    <Route path="/resources" element={<ResourcesPage />} />
    <Route path="/glossary" element={<GlossaryPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/:categoryId" element={<CategoryPage />} />
    <Route path="*" element={<div style={{ padding: 40, textAlign: "center" }}>
      <h2>Page Not Found</h2>
      <p>The requested page does not exist.</p>
    </div>} />
  </Routes>
);

export default AppRouter;
