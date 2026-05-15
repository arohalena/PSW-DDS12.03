import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./common/AppLayout";
import "./App.css";

import DashboardScreen from "./screens/dashboard/DashboardScreen";
import EventsListScreen from "./screens/event/EventsListScreen";
import CreateEventScreen from "./screens/event/CreateEventScreen";
import LoginScreen from "./screens/login/LoginScreen";
import RegisterScreen from "./screens/login/RegisterScreen";
import UserManagementScreen from "./screens/user/UserManagementScreen";
import ProjectsScreen from "./screens/project/ProjectsScreen";
import ProjectVotingDetailScreen from "./screens/voting/ProjectVotingDetailScreen";
import RankingScreen from "./screens/ranking/RankingScreen";
import MyProjectDashboardScreen from "./screens/dashboard/MyProjectDashboardScreen";
import EventDetailScreen from "./screens/event/EventDetailScreen";
import ProjectDetailScreen from "./screens/project/ProjectDetailScreen";
import PopularVotingScreen from "./screens/voting/PopularVotingScreen";
import EditVotingScreen from "./screens/voting/EditVotingScreen";
import AuditoriaScreen from "./screens/auditoria/AuditoriaScreen";
import { getUsuarioLogueado } from "./services/sessionService";

// Verifica sesion
function PrivateRoute({ children }) {
  const usuario = localStorage.getItem("usuarioLogueado");
  return usuario ? children : <Navigate to="/login" replace />;
}

// Verifica sesion Y rol permitido
function RoleRoute({ children, roles }) {
  const usuario = getUsuarioLogueado();
  if (!usuario) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />;
  return children;
}

function PrivatePage({ children, roles }) {
  return (
    <RoleRoute roles={roles}>
      <AppLayout>{children}</AppLayout>
    </RoleRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/login"    element={<LoginScreen />}    />
        <Route path="/registro" element={<RegisterScreen />} />

        {/* Dashboard — todos los roles logueados */}
        <Route
          path="/"
          element={
            <PrivatePage>
              <DashboardScreen />
            </PrivatePage>
          }
        />

        {/* Eventos — todos */}
        <Route
          path="/eventos"
          element={
            <PrivatePage>
              <EventsListScreen />
            </PrivatePage>
          }
        />

        {/* Crear evento — solo ORGANIZADOR */}
        <Route
          path="/eventos/crear"
          element={
            <PrivatePage roles={["ORGANIZADOR"]}>
              <CreateEventScreen />
            </PrivatePage>
          }
        />

        {/* Detalle evento — todos */}
        <Route
          path="/eventos/:eventoId"
          element={
            <PrivatePage>
              <EventDetailScreen />
            </PrivatePage>
          }
        />

        {/* Detalle proyecto — todos */}
        <Route
          path="/eventos/:eventoId/proyectos/:proyectoId"
          element={
            <PrivatePage>
              <ProjectDetailScreen />
            </PrivatePage>
          }
        />

        {/* Votar - todos */}
        <Route
          path="/eventos/:eventoId/votaciones/:votingId/proyectos/:proyectoId/votar"
          element={
            <PrivatePage roles={["JURADO", "COMPETIDOR", "PUBLICO", "ESPECTADOR", "ORGANIZADOR"]}>
              <ProjectVotingDetailScreen />
            </PrivatePage>
          }
        />

        {/* Resultados/Ranking — todos */}
        <Route
          path="/eventos/:eventoId/votaciones/:votingId/resultados"
          element={
            <PrivatePage>
              <RankingScreen />
            </PrivatePage>
          }
        />

        {/* Proyectos globales — ORGANIZADOR y JURADO */}
        <Route
          path="/proyectos"
          element={
            <PrivatePage roles={["ORGANIZADOR", "JURADO"]}>
              <ProjectsScreen />
            </PrivatePage>
          }
        />

        {/* Gestión de usuarios — solo ORGANIZADOR */}
        <Route
          path="/usuarios"
          element={
            <PrivatePage roles={["ORGANIZADOR"]}>
              <UserManagementScreen />
            </PrivatePage>
          }
        />

        {/* Mi Proyecto — solo COMPETIDOR */}
        <Route
          path="/configuracion"
          element={
            <PrivatePage roles={["COMPETIDOR", "ORGANIZADOR"]}>
              <MyProjectDashboardScreen />
            </PrivatePage>
          }
        />

        {/* Auditoría — ORGANIZADOR JURADO y COMPETIDOR */}
        <Route
          path="/auditoria"
          element={
            <PrivatePage roles={["ORGANIZADOR", "JURADO", "COMPETIDOR"]}>
              <AuditoriaScreen />
            </PrivatePage>
          }
        />

        {/* Redirect comodin */}
        <Route path="/votar" element={<Navigate to="/eventos" replace />} />
        <Route path="*"      element={<Navigate to="/"        replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;