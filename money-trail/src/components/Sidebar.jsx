import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

const Sidebar = () => {
  return (
    <aside>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2rem" }}>
        <img src={logo} alt="MoneyTrail Logo" style={{ width: "28px", height: "28px" }} />
        <h2 style={{ color: "white", fontSize: "18px", margin: 0 }}>MoneyTrail</h2>
      </div>
      <nav>
        <Link to="/">Dashboard</Link>
        <Link to="/accounts">Accounts</Link>
        <Link to="/merchants">Merchants</Link>
        <Link to="/alerts">Alerts</Link>
      </nav>
    </aside>
  );
};

export default Sidebar;