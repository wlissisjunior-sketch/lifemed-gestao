import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AppShell from "./components/layout/AppShell";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import NewPatient from "./pages/NewPatient";
import PatientProfile from "./pages/PatientProfile";
import Institutions from "./pages/Institutions";
import Professionals from "./pages/Professionals";
import {
  Assessments,
  Budgets,
  Attendances,
  Visits,
  Extensions,
  Addendums,
  Materials,
  Documents,
  Reports,
  SettingsPage,
} from "./pages/StubPages";

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Root() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pacientes" element={<Patients />} />
        <Route path="pacientes/novo" element={<NewPatient />} />
        <Route path="pacientes/:id" element={<PatientProfile />} />
        <Route path="instituicoes" element={<Institutions />} />
        <Route path="avaliacoes" element={<Assessments />} />
        <Route path="orcamentos" element={<Budgets />} />
        <Route path="atendimentos" element={<Attendances />} />
        <Route path="visitas" element={<Visits />} />
        <Route path="prorrogacoes" element={<Extensions />} />
        <Route path="aditivos" element={<Addendums />} />
        <Route path="materiais" element={<Materials />} />
        <Route path="documentos" element={<Documents />} />
        <Route path="profissionais" element={<Professionals />} />
        <Route path="relatorios" element={<Reports />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </BrowserRouter>
  );
}
