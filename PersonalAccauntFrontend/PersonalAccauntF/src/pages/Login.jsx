import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { styles } from "./MainPage"; // используем общий стиль

const url = location.origin;

export default function LoginPage() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [captchaToken, setCaptchaToken] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  useEffect(() => {
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.documentElement.style.margin = "0";
      document.documentElement.style.padding = "0";
      document.body.style.backgroundColor = "#1c1c1c";
    }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

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
      setMessage("Успешный вход!");
      navigate("/");
    } catch (error) {
      if (error.response) {
        setMessage("Неверный email или пароль");
      } else {
        setMessage("Произошла ошибка. Попробуйте позже.");
      }
    }
  };

  const s = styles(isMobile);

  return (
    <div style={{ ...s.page, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <form
        onSubmit={handleSubmit}
        style={{
          ...s.modal,
          maxWidth: "400px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <h2 style={{ ...s.modalTitle, textAlign: "center" }}>Вход</h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          style={s.modalInput}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Пароль"
          value={formData.password}
          onChange={handleChange}
          style={s.modalInput}
          required
        />

        <ReCAPTCHA
          sitekey="6LeXht0rAAAAAKBxY-SSKfnVqv-nH5m5OESd6HuF"
          onChange={(token) => setCaptchaToken(token)}
        />

        <button type="submit" style={s.modalSubmitBtn}>
          Войти
        </button>

        {message && (
          <div style={{ color: message.toLowerCase().includes("успеш") ? "limegreen" : "red", fontSize: "14px" }}>
            {message}
          </div>
        )}

        <p
          style={{ color: "#ffcc00", cursor: "pointer", textAlign: "center" }}
          onClick={() => navigate("/register")}
        >
          Зарегистрироваться
        </p>
      </form>
    </div>
  );
}
