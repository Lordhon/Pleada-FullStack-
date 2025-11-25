import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useCartTotals from "../hooks/useCartTotals";

export default function PrivateEndpoint() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const token = localStorage.getItem("token");
    const url = window.location.origin; 
    const cartTotal = useCartTotals();

    useEffect(() => {
        if (!token) {
            setIsAuthenticated(false);
            setUser(null);
            return;
        }

        const verifyAndFetchUser = async () => {
            try {
                await axios.get(`${url}/api/verify/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const res = await axios.get(`${url}/api/me/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setUser(res.data);
                setIsAuthenticated(true);
            } catch (error) {
                console.log("Токен недействителен или ошибка:", error.response?.status || error.message);
                localStorage.removeItem("token");
                setIsAuthenticated(false);
                setUser(null);
            }
        };

        verifyAndFetchUser();

        const intervalId = setInterval(verifyAndFetchUser, 300000); 
        return () => clearInterval(intervalId);
    }, [token, url]);

    return (
        <nav style={styles.nav}>
            {!isAuthenticated ? (
                <button style={styles.button} onClick={() => navigate("/login")}>
                    Войти
                </button>
            ) : (
                <div style={styles.profileContainer}>
                    <button style={styles.button} onClick={() => navigate("/profile")}>
                        Профиль
                    </button>
                    {user?.company_name && (
                        <span style={styles.company}>{user.company_name}</span>
                    )}
                </div>
            )}

            <div style={styles.cartWrapper}>
                <button style={styles.button} onClick={() => navigate("/cart")}>
                    Корзина
                </button>
                {cartTotal > 0 && (
                    <div style={styles.cartBadge}>
                        <div style={styles.cartCount}>{cartTotal}</div>
                    </div>
                )}
            </div>
            <button style={styles.button} onClick={() => navigate("/")}>
                Каталог
            </button>
        </nav>
    );
}

const styles = {
    nav: { display: "flex", alignItems: "center", gap: "20px" },
    profileContainer: { 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center",
        gap: "4px"
    },
    button: {
        backgroundColor: "#ffcc00",
        border: "none",
        padding: "8px 16px",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
        color: "#1c1c1c",
        whiteSpace: "nowrap"
    },
    cartWrapper: {
        position: "relative"
    },
    cartBadge: {
        position: "absolute",
        top: "-8px",
        right: "-8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ff4444",
        borderRadius: "50%",
        width: "20px",
        height: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
    },
    cartCount: {
        fontSize: "12px",
        fontWeight: "bold",
        color: "#fff",
        lineHeight: 1
    },
    company: {
        fontSize: "11px",
        color: "#ffcc00",
        fontWeight: "500",
        textAlign: "center",
        whiteSpace: "nowrap"
    },
};