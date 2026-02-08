import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./auth/Login";
import RequireAuth from "./auth/RequireAuth";
import Dashboard from "./pages/Dashboard";
import LaptopList from "./inventory/LaptopList";
import LaptopForm from "./inventory/LaptopForm";
import Navbar from "./layout/Navbar";
import RentalList from "./rentals/RentalList";
import RentalCreate from "./rentals/RentalCreate";

import StockMovementList from "./stock/StockMovementList";
import StockMovementCreate from "./stock/StockMovementCreate";


export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<LaptopList />} />
          <Route path="/rentals" element={<RentalList />} />
          <Route path="/rentals/create" element={<RentalCreate />} />
          <Route path="/inventory/create" element={<LaptopForm />} />
          <Route path="/stock" element={<StockMovementList />} />
          <Route path="/stock/create" element={<StockMovementCreate />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}



