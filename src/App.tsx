import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Colaboradores from "@/pages/Colaboradores";
import History from "@/pages/History";
import Login from "@/pages/Login";
import Overview from "@/pages/Overview";
import UpdateBase from "@/pages/UpdateBase";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Overview />} />
        <Route path="/colaboradores" element={<Colaboradores />} />
        <Route path="/atualizar-base" element={<UpdateBase />} />
        <Route path="/historico" element={<History />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
