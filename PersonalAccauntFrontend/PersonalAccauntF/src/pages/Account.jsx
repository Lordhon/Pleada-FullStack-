import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function AccountPage() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const userRes = await axios.get(`${window.location.origin}/api/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data);

        const ordersRes = await axios.get(`${window.location.origin}/api/history-orders/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(ordersRes.data.ord || []);
        setError("");
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setError("Ошибка при загрузке данных");
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndOrders();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const s = styles(isMobile);

  if (loading) {
    return (
      <div style={s.page}>
        <header style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.logoSection} onClick={() => navigate("/")}>
              <img src="/logo.png" alt="logo" style={s.logoImage} />
              {!isMobile && <h1 style={s.logoTitle}>ПЛЕЯДЫ</h1>}
            </div>
          </div>
          <button style={s.navButton} onClick={() => navigate("/")}>На главную</button>
        </header>
        <div style={s.loadingContainer}>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoSection} onClick={() => navigate("/")}>
            <img src="/logo.png" alt="logo" style={s.logoImage} />
            {!isMobile && <h1 style={s.logoTitle}>ПЛЕЯДЫ</h1>}
          </div>
        </div>
        <div style={s.headerRight}>
          <button style={s.navButton} onClick={() => navigate("/catalog/komatsu/")}>Каталог</button>
          <button style={s.navButton} onClick={() => navigate("/cart")}>Корзина</button>
          <button style={s.navButton} onClick={handleLogout}>Выход</button>
        </div>
      </header>

      <div style={s.container}>
        <div style={s.contentWrapper}>
          <section style={s.profileSection}>
            <div style={s.profileCard}>
              <h2 style={s.sectionTitle}>Мой профиль</h2>
              <div style={s.profileInfo}>
                <div style={s.infoRow}>
                  <span style={s.label}>Компания:</span>
                  <span style={s.value}>{user?.company || "Не указана"}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.label}>Email:</span>
                  <span style={s.value}>{user?.email || "Не указан"}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.label}>Телефон:</span>
                  <span style={s.value}>{user?.phone || "Не указан"}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.label}>ИНН:</span>
                  <span style={s.value}>{user?.inn || "Не указан"}</span>
                </div>
              </div>
            </div>
          </section>

          <section style={s.ordersSection}>
            <div style={s.ordersHeader}>
              <h2 style={s.sectionTitle}>История заказов</h2>
              {orders.length === 0 ? (
                <p style={s.emptyMessage}>У вас нет заказов</p>
              ) : (
                <p style={s.ordersCount}>Всего заказов: {orders.length}</p>
              )}
            </div>

            {error && <div style={s.errorMessage}>{error}</div>}

            {orders.length > 0 && (
              <div style={s.ordersList}>
                {orders.map((order, index) => (
                  <div key={index} style={s.orderCard}>
                    <div style={s.orderHeader}>
                      <div>
                        <h3 style={s.orderNumber}>Заказ #{order.num}</h3>
                        <p style={s.orderDate}>{order.dt}</p>
                      </div>
                      <div style={s.orderMeta}>
                        <p style={s.itemCount}>{order.item?.length || 0} товаров</p>
                        <p style={s.orderTotal}>ID: {order.idorder}</p>
                      </div>
                    </div>

                    <div style={s.itemsList}>
                      <table style={s.table}>
                        <thead>
                          <tr style={s.tableHeader}>
                            <th style={s.tableCell}>Название</th>
                            <th style={s.tableCell}>Артикул</th>
                            <th style={s.tableCell}>Кол-во</th>
                            <th style={s.tableCell}>Цена</th>
                            <th style={s.tableCell}>Сумма</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.item?.map((item, itemIndex) => {
                            const total = (parseFloat(item.price) * item.kol).toFixed(2);
                            return (
                              <tr key={itemIndex} style={s.tableRow}>
                                <td style={s.tableCell}>{item.nm}</td>
                                <td style={s.tableCell}>{item.art}</td>
                                <td style={s.tableCell}>{item.kol}</td>
                                <td style={s.tableCell}>{parseFloat(item.price).toFixed(2)} ₽</td>
                                <td style={s.tableCell}>{total} ₽</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={s.orderFooter}>
                      <div style={s.orderSummary}>
                        <span style={s.summaryLabel}>Сумма заказа:</span>
                        <span style={s.summaryValue}>
                          {order.item
                            ?.reduce((sum, item) => sum + parseFloat(item.price) * item.kol, 0)
                            .toFixed(2)} ₽
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export const styles = (mobile) => ({
  page: {
    backgroundColor: "#1c1c1c",
    color: "white",
    fontFamily: "Arial, sans-serif",
    minHeight: "100vh",
    width: "100%",
    overflowX: "hidden",
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
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: mobile ? "10px" : "15px",
    cursor: "pointer",
  },
  logoImage: {
    width: mobile ? "100px" : "150px",
    height: "auto",
    objectFit: "contain",
  },
  logoTitle: {
    margin: 0,
    color: "#ffcc00",
    fontSize: mobile ? "22px" : "30px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: mobile ? "8px" : "20px",
    flexWrap: "wrap",
  },
  navButton: {
    backgroundColor: "#ffcc00",
    border: "none",
    padding: mobile ? "8px 12px" : "8px 16px",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#1c1c1c",
    whiteSpace: "nowrap",
    fontSize: mobile ? "12px" : "14px",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: mobile ? "20px 10px" : "40px 20px",
    width: "100%",
  },
  contentWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "30px",
  },
  profileSection: {
    width: "100%",
  },
  profileCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: "10px",
    padding: mobile ? "20px" : "30px",
    border: "1px solid #444",
  },
  sectionTitle: {
    fontSize: mobile ? "20px" : "28px",
    marginBottom: "20px",
    color: "#ffcc00",
    margin: "0 0 20px 0",
  },
  profileInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "10px",
    borderBottom: "1px solid #444",
  },
  label: {
    fontWeight: "bold",
    color: "#ffcc00",
    fontSize: "14px",
  },
  value: {
    color: "#ccc",
    fontSize: "14px",
  },
  ordersSection: {
    width: "100%",
  },
  ordersHeader: {
    marginBottom: "20px",
  },
  ordersCount: {
    color: "#ccc",
    fontSize: "14px",
    margin: "10px 0 0 0",
  },
  emptyMessage: {
    color: "#999",
    fontSize: "16px",
    textAlign: "center",
    padding: "40px 20px",
    backgroundColor: "#2a2a2a",
    borderRadius: "10px",
  },
  errorMessage: {
    backgroundColor: "#c33",
    color: "white",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
  },
  ordersList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  orderCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: "10px",
    overflow: "hidden",
    border: "1px solid #444",
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: mobile ? "15px" : "20px",
    backgroundColor: "#333",
    borderBottom: "1px solid #444",
  },
  orderNumber: {
    margin: "0 0 5px 0",
    fontSize: "18px",
    color: "#ffcc00",
  },
  orderDate: {
    margin: "0",
    fontSize: "12px",
    color: "#999",
  },
  orderMeta: {
    textAlign: "right",
  },
  itemCount: {
    margin: "0",
    fontSize: "14px",
    color: "#ccc",
  },
  orderTotal: {
    margin: "5px 0 0 0",
    fontSize: "12px",
    color: "#999",
  },
  itemsList: {
    padding: mobile ? "15px" : "20px",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: mobile ? "12px" : "14px",
  },
  tableHeader: {
    backgroundColor: "#1c1c1c",
    borderBottom: "2px solid #ffcc00",
  },
  tableCell: {
    padding: mobile ? "8px 5px" : "12px",
    textAlign: "left",
    color: "#ccc",
    borderBottom: "1px solid #444",
  },
  tableRow: {
    borderBottom: "1px solid #444",
  },
  orderFooter: {
    padding: mobile ? "15px" : "20px",
    backgroundColor: "#333",
    borderTop: "1px solid #444",
  },
  orderSummary: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "15px",
    fontSize: mobile ? "14px" : "16px",
  },
  summaryLabel: {
    fontWeight: "bold",
    color: "#ffcc00",
  },
  summaryValue: {
    fontWeight: "bold",
    color: "#ffcc00",
    fontSize: mobile ? "16px" : "18px",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "400px",
    fontSize: "18px",
    color: "#ccc",
  },
});