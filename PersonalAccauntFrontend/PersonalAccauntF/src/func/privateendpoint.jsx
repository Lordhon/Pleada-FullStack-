import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function HeaderWithAuth() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            setIsAuthenticated(false);
            return;
        }

        const verifyToken = async () => {
            try {
                await axios.get("http://localhost/api/verify/", {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                setIsAuthenticated(true);
            } catch (error) {
                console.log("Токен недействителен:", error.response?.status || error.message);
                localStorage.removeItem("token");
                setIsAuthenticated(false);
            }
        };

        verifyToken();


        const intervalId = setInterval(verifyToken, 300000);
        return () => clearInterval(intervalId);
    }, [token]);

    return (
        <nav style={styles.nav}>
            {!isAuthenticated ? (
                <button style={styles.button} onClick={() => navigate("/login")}>
                    Войти
                </button>
            ) : (
                <button style={styles.button} onClick={() => navigate("/profile")}>
                    Профиль
                </button>
            )}
            <button style={styles.button} onClick={() => navigate("/cart")}>
                Корзина
            </button>
            <button style={styles.button} onClick={() => navigate("/")}>
                Каталог
            </button>
        </nav>
    );
}

const styles = {
    nav: { display: "flex", alignItems: "center", gap: "20px" },
    button: {
        backgroundColor: "#ffcc00",
        border: "none",
        padding: "8px 16px",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
    },
};
