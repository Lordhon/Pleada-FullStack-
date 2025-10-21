import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function PrivateEndpoint() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const token = localStorage.getItem("token");
    const url = window.location.origin; 

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
    company: {
        fontSize: "11px",
        color: "#ffcc00",
        fontWeight: "500",
        textAlign: "center",
        whiteSpace: "nowrap"
    },
};