import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./common/AppLayout";
import "./App.css";
import EventsListScreen from "./screens/EventsListScreen";
import CreateEventScreen from "./screens/CreateEventScreen";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import UserManagementScreen from "./screens/UserManagementScreen";  
import CompetitorsScreen from "./screens/CompetitorsScreen";
import TeamsScreen from "./screens/TeamsScreen";
import ProjectsScreen from "./screens/ProjectsScreen";
import PopularVotingScreen from "./screens/PopularVotingScreen";

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
          path="/votar"
          element={
            <PrivateRoute>
              <AppLayout>
                <PopularVotingScreen />
              </AppLayout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;