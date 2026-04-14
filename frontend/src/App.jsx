import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./common/AppLayout";
import "./App.css";
import EventsListScreen from "./screens/event/EventsListScreen";
import CreateEventScreen from "./screens/event/CreateEventScreen";
import LoginScreen from "./screens/login/LoginScreen";
import RegisterScreen from "./screens/login/RegisterScreen";
import UserManagementScreen from "./screens/user/UserManagementScreen";  
import CompetitorsScreen from "./screens/competitor/CompetitorsScreen";
import TeamsScreen from "./screens/team/TeamsScreen";
import ProjectsScreen from "./screens/project/ProjectsScreen";
import PopularVotingScreen from "./screens/voting/PopularVotingScreen";
import ProjectVotingDetailScreen from "./screens/voting/ProjectVotingDetailScreen";
import CriteriosScreen from "./screens/criterio/CriterioScreen";
import RankingScreen from "./screens/ranking/RankingScreen";
import MyProjectDashboardScreen from "./screens/dashboard/MyProjectDashboardScreen";

function PrivateRoute({ children }) {
  const usuario = localStorage.getItem("usuarioLogueado");
  return usuario ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/eventos" replace />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/registro" element={<RegisterScreen />} />

        <Route
          path="/eventos"
          element={
            <PrivateRoute>
              <AppLayout>
                <EventsListScreen />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/eventos/crear"
          element={
            <PrivateRoute>
              <AppLayout>
                <CreateEventScreen />
              </AppLayout>
            </PrivateRoute>
          }
        />
        
        <Route
          path="/usuarios"
          element={
            <PrivateRoute>
              <AppLayout>
                <UserManagementScreen />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/competidores"
          element={
            <PrivateRoute>
              <AppLayout>
                <CompetitorsScreen />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/equipos"
          element={
            <PrivateRoute>
              <AppLayout>
                <TeamsScreen />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/proyectos"
          element={
            <PrivateRoute>
              <AppLayout>
                <ProjectsScreen />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/eventos/:eventoId/proyectos"
          element={
            <PrivateRoute>
              <AppLayout>
                <ProjectsScreen />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/votar"
          element={
            <PrivateRoute>
              <AppLayout>
                <PopularVotingScreen />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/votar/:eventoId/proyecto/:proyectoId"
          element={
           <PrivateRoute>
            <AppLayout>
               <ProjectVotingDetailScreen />
            </AppLayout>
           </PrivateRoute>
          }
        />
        <Route
          path="/criterios"
          element={
            <PrivateRoute>
              <AppLayout>
                <CriteriosScreen />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/resultados"
          element={
            <PrivateRoute>
              <AppLayout>
                <RankingScreen />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/mi-proyecto"
          element={
            <PrivateRoute>
              <AppLayout>
                <MyProjectDashboardScreen />
              </AppLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;