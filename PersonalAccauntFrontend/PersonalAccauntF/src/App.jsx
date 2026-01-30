import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import Register from "./pages/register.jsx";
import ActivateUser from "./pages/ConfirmAccount.jsx";
import Login from "./pages/Login.jsx";
import MainPage from "./pages/MainPage.jsx";
import CatalogPage from "./pages/Catalog.jsx";
import CartPage from "./pages/Cart.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import AccountPage from "./pages/Account.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import PromoPage from "./pages/Promo.jsx";
import { useEffect, useState } from "react";
import CallbackModal from "./components/CallbackModal";

function App() {
  const [showCallbackModal, setShowCallbackModal] = useState(false);

  useEffect(() => {
   
    if (localStorage.getItem("callbackModalShown")) return;

   
    const timer = setTimeout(() => {
      setShowCallbackModal(true);
      localStorage.setItem("callbackModalShown", "true");
    }, 2 * 60 * 1000); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/activate" element={<ActivateUser />} />
        <Route path="/" element={<MainPage />} />
        <Route path="/catalog/:slug" element={<CatalogPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/profile" element={<AccountPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/promo" element={<PromoPage />} />
      </Routes>

      {showCallbackModal && (
        <CallbackModal onClose={() => setShowCallbackModal(false)} />
      )}
    </Router>
  );
}

export default App;