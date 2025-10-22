import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";

function getKey() {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];
  return CryptoJS.MD5(dateStr).toString();
}

const url = location.origin;

function formatPhone(val) {
  if (!val.startsWith("+7")) val = "+7";
  return "+7" + val.slice(2).replace(/\D/g, "");
}

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({});
  const [showQuickOrder, setShowQuickOrder] = useState(false);
  const [phone, setPhone] = useState("+7");
  const [code, setCode] = useState("");
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const priceChecks = {
    price: 500000,
    price1: 200000,
    price2: 100000,
    price3: 0,
  };

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) setCart(JSON.parse(savedCart));

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);

    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.backgroundColor = "#1c1c1c";

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    const verifyAndFetchUser = async () => {
      try {
        await fetch(`${url}/api/verify/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const res = await fetch(`${url}/api/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setIsAuthenticated(true);
        }
      } catch {
        localStorage.removeItem("token");
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    verifyAndFetchUser();
    const intervalId = setInterval(verifyAndFetchUser, 300000);
    return () => clearInterval(intervalId);
  }, []);

  const updateQuantity = (art, quantity) => {
    if (!quantity) return;
    let q = parseInt(quantity);
    if (isNaN(q) || q < 1) return;

    setCart((prev) => {
      const maxStock = prev[art].kl;
      if (q > maxStock) q = maxStock;
      const updated = { ...prev, [art]: { ...prev[art], quantity: q } };
      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  };

  const removeItem = (art) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[art];
      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  };

  const cartItems = Object.values(cart);

  const calculateSum = (priceKey) =>
    cartItems.reduce((sum, item) => sum + item[priceKey] * item.quantity, 0);

  let priceKey = "price3";
  let levelName = "Розница";
  let currentSum = calculateSum(priceKey);

  if (currentSum >= priceChecks.price2) {
    priceKey = "price2";
    levelName = "Мелкий опт";
    currentSum = calculateSum(priceKey);
    if (currentSum >= priceChecks.price1) {
      priceKey = "price1";
      levelName = "Средний опт";
      currentSum = calculateSum(priceKey);
      if (currentSum >= priceChecks.price) {
        priceKey = "price";
        levelName = "Крупный опт";
        currentSum = calculateSum(priceKey);
      }
    }
  }

  const dynamicPrices = {};
  cartItems.forEach((item) => (dynamicPrices[item.art] = item[priceKey]));

  const totalCartSum = currentSum;
  const currentPriceLevel = levelName;
  const totalSavings = calculateSum("price3") - totalCartSum;

  const handleCheckout = () => {
    const token = localStorage.getItem("token");
    if (!token) setShowQuickOrder(true);
    else handleAuthenticatedOrder();
  };

  const handleQuickOrder = async () => {
    try {
      const payload = awaitingCode ? { phone, code, cart } : { phone, cart };

      const res = await fetch(`${url}/api/order/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ошибка запроса: ${res.status} ${text}`);
      }

      const data = await res.json();

      if (!awaitingCode && data.verification_required) {
        setAwaitingCode(true);
        alert("Код подтверждения отправлен на телефон");
        return;
      }

      localStorage.setItem(
        "currentOrder",
        JSON.stringify({ cart, totalCartSum, currentPriceLevel })
      );
      if (data.token) localStorage.setItem("token", data.token);
      setShowQuickOrder(false);
      setAwaitingCode(false);
      navigate("/");
    } catch (err) {
      console.error(err);
      alert(
        awaitingCode
          ? "Неверный код подтверждения"
          : "Не удалось отправить код подтверждения"
      );
    }
  };

  const handleAuthenticatedOrder = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Пожалуйста, авторизуйтесь");

      const res = await fetch(`${url}/api/order/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cart }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          alert("Сессия истекла. Пожалуйста, авторизуйтесь заново.");
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }
        const text = await res.text();
        throw new Error(`Ошибка запроса: ${res.status} ${text}`);
      }

      localStorage.setItem(
        "currentOrder",
        JSON.stringify({ cart, totalCartSum, currentPriceLevel })
      );
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Не удалось оформить заказ. Попробуйте еще раз.");
    }
  };

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

          
          {!isMobile && (
            <button style={s.promoButton} onClick={() => navigate("/promo")}>
              Акции
            </button>
          )}
        </div>

        
        {isMobile && (
          <button
            style={{ ...s.promoButton, marginTop: "10px" }}
            onClick={() => navigate("/promo")}
          >
            Акции
          </button>
        )}

        <div style={s.headerRight}>
          {!isMobile && (
            <div style={s.phoneSection}>
              +7 930 665-32-71
              <span style={s.phoneSub}>для связи по вопросам и заказам</span>
            </div>
          )}

          <nav style={s.nav}>
            {!isAuthenticated ? (
              <button style={s.navButton} onClick={() => navigate("/login")}>
                Войти
              </button>
            ) : (
              <div style={s.profileContainer}>
                <button style={s.navButton} onClick={() => navigate("/profile")}>
                  Профиль
                </button>
                {user?.company && <span style={s.company}>{user.company}</span>}
              </div>
            )}
            <button style={s.navButton} onClick={() => navigate("/cart")}>
              Корзина
            </button>
            <button style={s.navButton} onClick={() => navigate("/")}>
              Каталог
            </button>
          </nav>
        </div>
      </header>

      <div style={s.container}>
        <h1 style={s.title}>Ваша корзина</h1>
        {cartItems.length === 0 ? (
          <div style={s.empty}>Корзина пуста</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Артикул</th>
                  <th style={s.th}>Название</th>
                  <th style={s.th}>Цена (₽)</th>
                  <th style={s.th}>Кол-во</th>
                  <th style={s.th}>Сумма (₽)</th>
                  <th style={s.th}>Экономия</th>
                  <th style={s.th}>На складе</th>
                  <th style={s.th}></th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => {
                  const dynamicPrice = dynamicPrices[item.art];
                  const sumItem = dynamicPrice * item.quantity;
                  const save = item.price3 * item.quantity - sumItem;
                  return (
                    <tr key={item.art}>
                      <td style={s.td}>{item.art}</td>
                      <td style={s.td}>{item.name}</td>
                      <td style={s.td}>{dynamicPrice.toLocaleString()}</td>
                      <td style={s.td}>
                        <input
                          type="number"
                          value={item.quantity}
                          min="1"
                          max={item.kl}
                          onChange={(e) => updateQuantity(item.art, e.target.value)}
                          style={{ ...s.input, width: isMobile ? "50px" : "70px" }}
                        />
                      </td>
                      <td style={s.td}>{sumItem.toLocaleString()}</td>
                      <td style={{ ...s.td, color: save > 0 ? "#0f0" : "#ccc" }}>
                        {save > 0 ? `-${save.toLocaleString()}` : "-"}
                      </td>
                      <td style={s.td}>{item.kl}</td>
                      <td style={s.td}>
                        <button onClick={() => removeItem(item.art)} style={s.removeBtn}>
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={s.summary}>
              <h3 style={s.summaryTitle}>
                Итого: {totalCartSum.toLocaleString()} ₽
              </h3>
              <div style={s.currentLevel}>
                Уровень цен: <strong>{currentPriceLevel}</strong>
              </div>
              {totalSavings > 0 && (
                <div style={s.savings}>
                  Экономия:{" "}
                  <strong style={{ color: "#0f0" }}>
                    {totalSavings.toLocaleString()} ₽
                  </strong>
                </div>
              )}
            </div>

            <button style={s.checkoutBtn} onClick={handleCheckout}>
              Оформить заказ
            </button>
          </div>
        )}
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
  logoText: {
    display: "flex",
    flexDirection: "column",
  },
  logoTitle: {
    margin: 0,
    color: "#ffcc00",
    fontSize: mobile ? "22px" : "30px",
  },
  promoButton: {
    backgroundColor: "#ffcc00",
    border: "none",
    padding: "8px 16px",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#1c1c1c",
    whiteSpace: "nowrap",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  phoneSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    color: "white",
    fontSize: "14px",
  },
  phoneSub: {
    color: "#ccc",
    fontSize: "12px",
    marginTop: "2px",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  navButton: {
    backgroundColor: "#ffcc00",
    border: "none",
    padding: "8px 16px",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#1c1c1c",
    whiteSpace: "nowrap",
    fontSize: "14px",
  },
  profileContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
  },
  company: {
    fontSize: "11px",
    color: "#ffcc00",
    fontWeight: "500",
    textAlign: "center",
    whiteSpace: "nowrap",
    position: "absolute",
    top: "100%",
    marginTop: "4px",
    left: "50%",
    transform: "translateX(-50%)",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 20px",
  },
  title: {
    fontSize: "32px",
    margin: "40px 0 30px",
    color: "#ffcc00",
    fontWeight: "bold",
  },
  empty: {
    fontSize: "18px",
    color: "#aaa",
    textAlign: "center",
    padding: "60px 20px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#2a2a2a",
    color: "white",
    borderRadius: "8px",
    overflow: "hidden",
  },
  th: {
    padding: "15px 12px",
    textAlign: "left",
    borderBottom: "2px solid #444",
    fontWeight: "bold",
    fontSize: "14px",
    color: "#ffcc00",
  },
  td: {
    padding: "15px 12px",
    fontSize: "14px",
    verticalAlign: "middle",
  },
  input: {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #555",
    backgroundColor: "#1c1c1c",
    color: "white",
    fontSize: "14px",
    textAlign: "center",
  },
  removeBtn: {
    backgroundColor: "#ff4444",
    color: "white",
    border: "none",
    padding: "6px 12px",
    cursor: "pointer",
    borderRadius: "4px",
    fontSize: "18px",
    fontWeight: "bold",
  },
  summary: {
    marginTop: "30px",
    backgroundColor: "#2a2a2a",
    padding: "25px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  },
  summaryTitle: {
    margin: "0 0 15px 0",
    fontSize: "24px",
    color: "#fff",
  },
  currentLevel: {
    fontSize: "16px",
    marginBottom: "10px",
    color: "#ffcc00",
  },
  savings: {
    fontSize: "18px",
    marginBottom: "15px",
    fontWeight: "bold",
    color: "#0f0",
  },
  checkoutBtn: {
    marginTop: "30px",
    backgroundColor: "#ffcc00",
    color: "#1c1c1c",
    padding: "15px 40px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
});
