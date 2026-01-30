import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { styles } from "./MainPage";

export default function PromoPage() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  const s = styles(isMobile);

  return (
    <div
      style={{
        ...s.page,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          textAlign: "center",
          color: "#ffffff",
          padding: "40px",
        }}
      >
        <h1
          style={{
            fontSize: isMobile ? "24px" : "32px",
            color: "#ffcc00",
            marginBottom: "20px",
          }}
        >
          Ведутся технические работы, страница в разработке
        </h1>
        <button
          onClick={() => navigate("/")}
          style={{
            ...s.promoButton,
            marginTop: "20px",
          }}
        >
          Вернуться на главную
        </button>
      </div>
    </div>
  );
}

