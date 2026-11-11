import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Escolas from './pages/Escolas.jsx';
import EscolaForm from './pages/EscolaForm.jsx';
import EscolaDetalhe from './pages/EscolaDetalhe.jsx';
import Alunos from './pages/Alunos.jsx';
import AlunoForm from './pages/AlunoForm.jsx';
import Documentos from './pages/Documentos.jsx';
import GerarCarta from './pages/GerarCarta.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/escolas" element={<Escolas />} />
            <Route path="/escolas/nova" element={<EscolaForm />} />
            <Route path="/escolas/:id" element={<EscolaDetalhe />} />
            <Route path="/escolas/:id/editar" element={<EscolaForm />} />
            <Route path="/alunos" element={<Alunos />} />
            <Route path="/alunos/novo" element={<AlunoForm />} />
            <Route path="/alunos/:id/editar" element={<AlunoForm />} />
            <Route path="/documentos" element={<Documentos />} />
            <Route path="/documentos/carta" element={<GerarCarta />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
