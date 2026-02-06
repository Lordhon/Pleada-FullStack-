import React, { useState } from "react";
import axios from "axios";

export default function CallbackModal({ onClose }) {
  const [callbackName, setCallbackName] = useState("");
  const [callbackPhone, setCallbackPhone] = useState("+7");
  const [callbackLoading, setCallbackLoading] = useState(false);
  const [callbackError, setCallbackError] = useState("");
  const [callbackSuccess, setCallbackSuccess] = useState("");

  const formatPhone = (val) => {
    if (!val.startsWith("+7")) val = "+7";
    return "+7" + val.slice(2).replace(/\D/g, "");
  };

  const handlePhoneChange = (e) => {
    setCallbackPhone(formatPhone(e.target.value));
    setCallbackError("");
    setCallbackSuccess("");
  };

  const handleNameChange = (e) => {
    setCallbackName(e.target.value);
    setCallbackError("");
    setCallbackSuccess("");
  };

  const handleSubmit = async () => {
    setCallbackError("");
    setCallbackSuccess("");

    if (!callbackName.trim()) {
      setCallbackError("Пожалуйста, введите ваше имя");
      return;
    }

    const cleaned = callbackPhone.replace(/\D/g, "");
    if (!/^7\d{10}$/.test(cleaned)) {
      setCallbackError("Пожалуйста, введите корректный номер телефона (+7 и 10 цифр)");
      return;
    }

    setCallbackLoading(true);
    try {
      await axios.post(`${window.location.origin}/api/callback/`, {
        name: callbackName,
        phone: callbackPhone,
        domen: location.origin
        
      });

      if (window.ym) {
          ym(105250468, 'reachGoal', 'Callback');
        }
      setCallbackSuccess("Спасибо! Мы вам перезвоним в ближайшее время.");
      setCallbackPhone("+7");
      setCallbackName("");

     
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error("Ошибка при отправке:", err);
      setCallbackError("Ошибка при отправке данных. Попробуйте еще раз.");
    } finally {
      setCallbackLoading(false);
    }
  };

  const s = styles;

  return (
    <div style={s.modalOverlay} onClick={() => !callbackLoading && onClose()}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={s.modalTitle}>Обратный звонок</h2>
        <p style={s.modalText}>Введите ваше имя и номер телефона, и мы вам перезвоним</p>

        <input
          type="text"
          value={callbackName}
          onChange={handleNameChange}
          style={s.modalInput}
          placeholder="Имя"
          disabled={callbackLoading}
        />
        <input
          type="tel"
          value={callbackPhone}
          onChange={handlePhoneChange}
          style={s.modalInput}
          placeholder="Номер телефона"
          disabled={callbackLoading}
        />

        {callbackError && <div style={s.errorMessage}>{callbackError}</div>}
        {callbackSuccess && <div style={s.successMessage}>{callbackSuccess}</div>}

        <div style={s.modalButtons}>
          <button style={s.modalSubmitBtn} onClick={handleSubmit} disabled={callbackLoading}>
            {callbackLoading ? "Отправка..." : "Отправить"}
          </button>
          <button style={s.modalCancelBtn} onClick={onClose} disabled={callbackLoading}>
            Отмена
          </button>
        </div>

        <button style={s.modalClose} onClick={onClose} disabled={callbackLoading}>
          ×
        </button>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#2a2a2a",
    padding: "30px",
    borderRadius: "10px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    maxWidth: "400px",
    width: "90%",
    position: "relative",
  },
  modalTitle: {
    margin: "0 0 15px 0",
    fontSize: "24px",
    color: "#ffcc00",
    fontWeight: "bold",
  },
  modalText: {
    color: "#ccc",
    fontSize: "14px",
    marginBottom: "20px",
  },
  modalInput: {
    width: "100%",
    padding: "12px",
    marginBottom: "20px",
    borderRadius: "6px",
    border: "1px solid #444",
    backgroundColor: "#1c1c1c",
    color: "white",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  modalButtons: {
    display: "flex",
    gap: "10px",
    justifyContent: "space-between",
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: "#ffcc00",
    color: "#1c1c1c",
    border: "none",
    padding: "12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: "#444",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  modalClose: {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "transparent",
    border: "none",
    color: "#ffcc00",
    fontSize: "28px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  errorMessage: {
    backgroundColor: "#c33",
    color: "white",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "15px",
    fontSize: "14px",
  },
  successMessage: {
    backgroundColor: "#4caf50",
    color: "white",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "15px",
    fontSize: "14px",
  },
};