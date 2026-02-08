import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav style={{ display: "flex", gap: 10 }}>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/inventory">Inventory</Link>
      <Link to="/rentals">Rentals</Link>
      <button onClick={logout}>Logout</button>
    </nav>
  );
}
