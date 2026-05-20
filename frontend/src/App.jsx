import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./common/AppLayout";
import { getUsuarioLogueado } from "./services/sessionService";
import "./App.css";

// Lazy loading: cada pantalla se descarga solo cuando se navega a ella
const DashboardScreen            = lazy(() => import("./screens/dashboard/DashboardScreen"));
const EventsListScreen           = lazy(() => import("./screens/event/EventsListScreen"));
const CreateEventScreen          = lazy(() => import("./screens/event/CreateEventScreen"));
const LoginScreen                = lazy(() => import("./screens/login/LoginScreen"));
const RegisterScreen             = lazy(() => import("./screens/login/RegisterScreen"));
const UserManagementScreen       = lazy(() => import("./screens/user/UserManagementScreen"));
const ProjectsScreen             = lazy(() => import("./screens/project/ProjectsScreen"));
const ProjectVotingDetailScreen  = lazy(() => import("./screens/voting/ProjectVotingDetailScreen"));
const RankingScreen              = lazy(() => import("./screens/ranking/RankingScreen"));
const MyProjectDashboardScreen   = lazy(() => import("./screens/dashboard/MyProjectDashboardScreen"));
const EventDetailScreen          = lazy(() => import("./screens/event/EventDetailScreen"));
const ProjectDetailScreen        = lazy(() => import("./screens/project/ProjectDetailScreen"));
const PopularVotingScreen        = lazy(() => import("./screens/voting/PopularVotingScreen"));
const EditVotingScreen           = lazy(() => import("./screens/voting/EditVotingScreen"));
const AuditoriaScreen            = lazy(() => import("./screens/auditoria/AuditoriaScreen"));

function PrivateRoute({ children }) {
  const usuario = localStorage.getItem("usuarioLogueado");
  return usuario ? children : <Navigate to="/login" replace />;
}

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

function LoadingFallback() {
  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      fontFamily: "system-ui, sans-serif",
      color: "#666"
    }}>
      Cargando...
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login"    element={<LoginScreen />}    />
          <Route path="/registro" element={<RegisterScreen />} />
          <Route
            path="/"
            element={
              <PrivatePage>
                <DashboardScreen />
              </PrivatePage>
            }
          />

          <Route
            path="/eventos"
            element={
              <PrivatePage>
                <EventsListScreen />
              </PrivatePage>
            }
          />

          <Route
            path="/eventos/crear"
            element={
              <PrivatePage roles={["ORGANIZADOR"]}>
                <CreateEventScreen />
              </PrivatePage>
            }
          />

          <Route
            path="/eventos/:eventoId"
            element={
              <PrivatePage>
                <EventDetailScreen />
              </PrivatePage>
            }
          />

          <Route
            path="/eventos/:eventoId/proyectos/:proyectoId"
            element={
              <PrivatePage>
                <ProjectDetailScreen />
              </PrivatePage>
            }
          />

          <Route
            path="/eventos/:eventoId/votaciones/:votingId/proyectos/:proyectoId/votar"
            element={
              <PrivatePage roles={["JURADO", "COMPETIDOR", "PUBLICO", "ESPECTADOR", "ORGANIZADOR"]}>
                <ProjectVotingDetailScreen />
              </PrivatePage>
            }
          />

          <Route
            path="/eventos/:eventoId/votaciones/:votingId/resultados"
            element={
              <PrivatePage>
                <RankingScreen />
              </PrivatePage>
            }
          />

          <Route
            path="/proyectos"
            element={
              <PrivatePage roles={["ORGANIZADOR", "JURADO"]}>
                <ProjectsScreen />
              </PrivatePage>
            }
          />

          <Route
            path="/usuarios"
            element={
              <PrivatePage roles={["ORGANIZADOR"]}>
                <UserManagementScreen />
              </PrivatePage>
            }
          />

          <Route
            path="/configuracion"
            element={
              <PrivatePage roles={["COMPETIDOR", "ORGANIZADOR"]}>
                <MyProjectDashboardScreen />
              </PrivatePage>
            }
          />

          <Route
            path="/auditoria"
            element={
              <PrivatePage roles={["ORGANIZADOR", "JURADO", "COMPETIDOR"]}>
                <AuditoriaScreen />
              </PrivatePage>
            }
          />

          <Route path="/votar" element={<Navigate to="/eventos" replace />} />
          <Route path="*"      element={<Navigate to="/"        replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;