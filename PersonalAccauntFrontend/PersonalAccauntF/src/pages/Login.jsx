import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
const  url= location.origin
function Login() {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [captchaToken, setCaptchaToken] = useState(null);
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!captchaToken) {
            setMessage("Подтвердите, что вы не робот!");
            return;
        }

        try {
            const response = await axios.post(`${url}/api/login/`, {
                ...formData,
                recaptcha: captchaToken,
            });
            localStorage.setItem("token", response.data.access);
            navigate("/");
            setMessage("Успешный вход!");
        } catch (error) {
            if (error.response) {
                setMessage("Неверный email или пароль");
            } else {
                setMessage("Произошла ошибка. Попробуйте позже.");
            }
        }
    };

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f5f5f5" }}>
            <form
                onSubmit={handleSubmit}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "15px",
                    background: "#fff",
                    padding: "30px",
                    borderRadius: "10px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                    width: "300px",
                }}
            >
                <h2 style={{ textAlign: "center", marginBottom: "10px" }}>Вход</h2>
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Пароль"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                />

                <ReCAPTCHA
                    sitekey="6LeXht0rAAAAAKBxY-SSKfnVqv-nH5m5OESd6HuF"
                    onChange={(token) => setCaptchaToken(token)}
                />

                <button type="submit" style={{ padding: "10px", border: "none", borderRadius: "5px", background: "#4CAF50", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
                    Войти
                </button>
                {message && <p style={{ color: message.includes("успеш") ? "green" : "red" }}>{message}</p>}


                <p
                    style={{ fontSize: "16px", textAlign: "center", marginTop: "20", cursor: "pointer", color: "#007BFF" }}
                    onClick={() => navigate("/register")}
                >
                    Зарегистрироваться
                </p>
            </form>
        </div>
    );
}

export default Login;
