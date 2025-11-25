import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const url = location.origin;
const formatPrice = (value) => {
  const numericValue = Number(value ?? 0);
  const truncated = Math.trunc(numericValue * 100) / 100;
  return truncated.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.backgroundColor = "#1c1c1c";

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const data = localStorage.getItem("orderSuccess");
    if (data) {
      setOrderData(JSON.parse(data));
      localStorage.removeItem("orderSuccess");
    }
  }, []);

  const s = styles(isMobile);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoSection} onClick={() => navigate("/")} title="На главную">
            <img src="/logo.png" alt="logo" style={s.logoImage} />
            {!isMobile && (
              <div style={s.logoText}>
                <h1 style={s.logoTitle}>ПЛЕЯДЫ</h1>
              </div>
            )}
          </div>
        </div>

        <div style={s.headerRight}>
          <nav style={s.nav}>
            <button style={s.navButton} onClick={() => navigate("/")}>Каталог</button>
          </nav>
        </div>
      </header>

      <div style={s.container}>
        <div style={s.successBox}>
          <div style={s.successIcon}>✓</div>
          <h1 style={s.successTitle}>Заказ оформлен успешно!</h1>
          
          {orderData && (
            <div style={s.orderDetails}>
              <div style={s.orderRow}>
                <span style={s.label}>Номер заказа:</span>
                <span style={s.value}>{orderData.orderNumber}</span>
              </div>
              <div style={s.orderRow}>
                <span style={s.label}>Сумма:</span>
                <span style={s.value}>{formatPrice(orderData.totalSum)} ₽</span>
              </div>
              <div style={s.orderRow}>
                <span style={s.label}>Уровень цен:</span>
                <span style={s.value}>{orderData.priceLevel}</span>
              </div>
              {orderData.savings > 0 && (
                <div style={s.orderRow}>
                  <span style={s.label}>Экономия:</span>
                  <span style={{ ...s.value, color: "#0f0" }}>-{formatPrice(orderData.savings)} ₽</span>
                </div>
              )}
            </div>
          )}

          <div style={s.message}>
            <p>Спасибо за ваш заказ! Мы свяжемся с вами в ближайшее время.</p>
            <p style={{ color: "#ccc", fontSize: "14px" }}>Проверьте SMS и email для получения деталей заказа</p>
          </div>

          <div style={s.buttonsGroup}>
            <button style={s.primaryBtn} onClick={() => navigate("/")}>
              Продолжить покупки
            </button>
            <button style={s.secondaryBtn} onClick={() => navigate("/profile")}>
              Мои заказы
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = (mobile) => ({
  page: {
    margin: 0,
    padding: 0,
    fontFamily: "Arial, sans-serif",
    color: "white",
    backgroundColor: "#1c1c1c",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    flexDirection: mobile ? "column" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: mobile ? "10px" : "10px 40px",
    backgroundColor: "#2a2a2a",
    gap: "10px",
    position: "relative",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "20px" },
  logoSection: { display: "flex", alignItems: "center", gap: mobile ? "10px" : "15px", cursor: "pointer" },
  logoImage: { width: mobile ? "100px" : "150px", height: "auto", objectFit: "contain" },
  logoText: { display: "flex", flexDirection: "column" },
  logoTitle: { margin: 0, color: "#ffcc00", fontSize: mobile ? "22px" : "30px" },
  headerRight: { display: "flex", alignItems: "center", gap: "20px" },
  nav: { display: "flex", alignItems: "center", gap: "20px" },
  navButton: { backgroundColor: "#ffcc00", border: "none", padding: "8px 16px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", color: "#1c1c1c", fontSize: "14px", whiteSpace: "nowrap" },
  container: { maxWidth: "1400px", margin: "0 auto", padding: "0 20px" },
  successBox: {
    backgroundColor: "#2a2a2a",
    borderRadius: "12px",
    padding: mobile ? "30px 20px" : "60px 40px",
    textAlign: "center",
    marginTop: "60px",
    marginBottom: "60px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
  },
  successIcon: {
    width: "100px",
    height: "100px",
    backgroundColor: "#0f0",
    color: "#1c1c1c",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "60px",
    fontWeight: "bold",
    margin: "0 auto 20px",
  },
  successTitle: {
    fontSize: mobile ? "28px" : "36px",
    margin: "0 0 30px 0",
    color: "#0f0",
    fontWeight: "bold",
  },
  orderDetails: {
    backgroundColor: "#1c1c1c",
    padding: "25px",
    borderRadius: "8px",
    marginBottom: "30px",
    textAlign: "left",
    display: "inline-block",
    minWidth: mobile ? "280px" : "400px",
  },
  orderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "15px",
    borderBottom: "1px solid #444",
    marginBottom: "15px",
  },
  label: {
    color: "#ffcc00",
    fontWeight: "500",
    fontSize: "14px",
  },
  value: {
    color: "white",
    fontWeight: "bold",
    fontSize: "16px",
  },
  message: {
    margin: "30px 0",
    fontSize: "16px",
    color: "#ddd",
  },
  buttonsGroup: {
    display: "flex",
    gap: "15px",
    justifyContent: "center",
    flexDirection: mobile ? "column" : "row",
    marginTop: "30px",
  },
  primaryBtn: {
    backgroundColor: "#ffcc00",
    color: "#1c1c1c",
    padding: "15px 40px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    minWidth: mobile ? "100%" : "200px",
  },
  secondaryBtn: {
    backgroundColor: "#555",
    color: "white",
    padding: "15px 40px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    minWidth: mobile ? "100%" : "200px",
  },
});