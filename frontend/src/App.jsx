import AppLayout from "./common/AppLayout";
import UserManagementScreen from "./screens/UserManagementScreen";
import "./App.css";

function App() {
  return (
    <AppLayout>
      <UserManagementScreen />
    </AppLayout>
  );
}

export default App;