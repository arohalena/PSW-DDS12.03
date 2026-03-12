import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import UserManagementScreen from "./screens/UserManagementScreen";
import AppLayout from "./common/AppLayout";
import "./App.css";

function PrivateRoute({ children }) {
  const usuario = localStorage.getItem("usuarioLogueado");
  return usuario ? children : <Navigate to="/login" replace />;
}


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/registro" element={<RegisterScreen />} />

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
      </Routes>
    </BrowserRouter>
  );
}


export default App;