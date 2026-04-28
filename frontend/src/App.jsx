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

function PrivateRoute({ children }) {
  const usuario = localStorage.getItem("usuarioLogueado");
  return usuario ? children : <Navigate to="/login" replace />;
}

function PrivatePage({ children }) {
  return (
    <PrivateRoute>
      <AppLayout>{children}</AppLayout>
    </PrivateRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
  <Route path="/login" element={<LoginScreen />} />
  <Route path="/registro" element={<RegisterScreen />} />

  <Route path="/" element={<PrivatePage><DashboardScreen /></PrivatePage>} />

  <Route path="/eventos" element={<PrivatePage><EventsListScreen /></PrivatePage>} />
  <Route path="/eventos/crear" element={<PrivatePage><CreateEventScreen /></PrivatePage>} />
  <Route path="/eventos/:eventoId" element={<PrivatePage><EventDetailScreen /></PrivatePage>} />

  <Route
    path="/eventos/:eventoId/proyectos/:proyectoId"
    element={<PrivatePage><ProjectDetailScreen /></PrivatePage>}
  />

  <Route
    path="/eventos/:eventoId/votaciones/:votingId/proyectos/:proyectoId/votar"
    element={<PrivatePage><ProjectVotingDetailScreen /></PrivatePage>}
  />

  <Route
    path="/eventos/:eventoId/votaciones/:votingId/resultados"
    element={<PrivatePage><RankingScreen /></PrivatePage>}
  />

  <Route path="/proyectos" element={<PrivatePage><ProjectsScreen /></PrivatePage>} />
  <Route path="/usuarios" element={<PrivatePage><UserManagementScreen /></PrivatePage>} />
  <Route path="/configuracion" element={<PrivatePage><MyProjectDashboardScreen /></PrivatePage>} />

  {/* redirects */}
  <Route path="/votar" element={<Navigate to="/eventos" replace />} />
</Routes>
    </BrowserRouter>
  );
}

export default App;