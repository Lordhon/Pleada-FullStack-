import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { styles } from "./MainPage"; 

const url = location.origin;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [formData, setFormData] = useState({ email: "", password: "", inn: "", phone_number: "+7" });
  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
      document.body.style.margin = "0";
      document.body.style.padding = "0";
      document.documentElement.style.margin = "0";
      document.documentElement.style.padding = "0";
      document.body.style.backgroundColor = "#1c1c1c";
    }, []);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePhoneChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith("+7")) val = "+7" + val.replace(/\D/g, "");
    setFormData({ ...formData, phone_number: val });
  };

  const handleCodeChange = (e) => setCode(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const response = await axios.post(`${url}/api/register/`, formData);
      console.log("Success:", response.data);
      setStep(2);
      setMessage("Код активации отправлен на почту.");
    } catch (error) {
      if (error.response) {
        const data = error.response.data;
        if ((data.email && data.email[0].includes("already exists")) || (data.phone_number && data.phone_number[0].includes("already exists"))) {
          if (data.is_active === false) {
            setMessage("Пользователь существует, но не активирован. Подтвердите почту.");
            setStep(2);
          } else {
            setMessage("Email или номер телефона уже занят.");
          }
        } else if (data.password) {
          setMessage(data.password.join(" "));
        } else {
          setMessage("Ошибка. Проверьте данные.");
        }
      } else {
        setMessage("Произошла ошибка. Попробуйте позже.");
      }
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const response = await axios.post(`${url}/api/account/activate-code/`, { email: formData.email, code });
      console.log("Code verified:", response.data);
      setMessage("Регистрация подтверждена!");
      navigate("/login");
    } catch (error) {
      if (error.response) setMessage("Неверный код. Попробуйте снова.");
      else setMessage("Произошла ошибка. Попробуйте позже.");
    }
  };

  const s = styles(isMobile);

  return (
    <div style={{ ...s.page, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      {step === 1 && (
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
          <h2 style={{ ...s.modalTitle, textAlign: "center" }}>Регистрация</h2>
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
          <input
            type="text"
            name="inn"
            placeholder="ИНН"
            value={formData.inn}
            onChange={handleChange}
            style={s.modalInput}
            required
          />
          <input
            type="tel"
            name="phone_number"
            placeholder="+7 (XXX) XXX-XX-XX"
            value={formData.phone_number}
            onChange={handlePhoneChange}
            style={s.modalInput}
            required
          />
          <button type="submit" style={s.modalSubmitBtn}>
            Зарегистрироваться
          </button>
          {message && <div style={{ color: "red", fontSize: "14px" }}>{message}</div>}
          <p style={{ color: "#ffcc00", cursor: "pointer", textAlign: "center" }} onClick={() => navigate("/login")}>
            Войти
          </p>
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={handleCodeSubmit}
          style={{
            ...s.modal,
            maxWidth: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          <h2 style={{ ...s.modalTitle, textAlign: "center" }}>Подтверждение кода</h2>
          <input
            type="text"
            name="code"
            placeholder="Введите код"
            value={code}
            onChange={handleCodeChange}
            style={s.modalInput}
            required
          />
          <button type="submit" style={s.modalSubmitBtn}>
            Подтвердить
          </button>
          {message && <div style={{ color: "limegreen", fontSize: "14px" }}>{message}</div>}
          <p style={{ color: "#ffcc00", cursor: "pointer", textAlign: "center" }} onClick={() => navigate("/login")}>
            Уже есть аккаунт? Войти
          </p>
        </form>
      )}
    </div>
  );
}
