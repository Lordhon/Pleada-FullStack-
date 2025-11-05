import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Register from "./pages/register.jsx";
import ActivateUser from "./pages/ConfirmAccount.jsx";
import Login from "./pages/Login.jsx";
import SecurityEndpoint from "./func/privateendpoint.jsx";
import MainPage from "./pages/MainPage.jsx";
import CatalogPage from "./pages/Catalog.jsx";
import CartPage from "./pages/Cart.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";


function App() {
    return (

            <Router>
                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/activate" element={<ActivateUser />} />
                    <Route path="" element={<MainPage />} />
                    <Route path="/catalog/:slug" element={<CatalogPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/order-success" element={<OrderSuccess  />} />
                    <Route element={<SecurityEndpoint />}>




                    </Route>


                </Routes>
            </Router>

    );
}

export default App;
