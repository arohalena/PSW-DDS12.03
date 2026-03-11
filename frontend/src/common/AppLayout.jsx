import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../styles/layout.css";

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-main">
        <Topbar />
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}

export default AppLayout;