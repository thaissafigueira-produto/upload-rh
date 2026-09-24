import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import Cnpjs from "@/pages/Cnpjs";
import Colaboradores from "@/pages/Colaboradores";
import ConferenciaDetail from "@/pages/ConferenciaDetail";
import History from "@/pages/History";
import HistoryDetail from "@/pages/HistoryDetail";
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
        <Route path="/cnpjs" element={<Cnpjs />} />
        <Route path="/cnpjs/conferencia/:id" element={<ConferenciaDetail />} />
        <Route path="/historico" element={<History />} />
        <Route path="/historico/:id" element={<HistoryDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
