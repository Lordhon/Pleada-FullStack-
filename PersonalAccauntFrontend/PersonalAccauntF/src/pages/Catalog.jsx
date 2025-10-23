import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const url = location.origin;

export default function CatalogPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState("");

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const priceChecks = {
    price: 500000,
    price1: 200000,
    price2: 100000,
    price3: 0,
  };

  const itemRefs = useRef({}); 

 
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

 
  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.backgroundColor = "#1c1c1c";
  }, []);

  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

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

 
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

 
  useEffect(() => {
    if (!slug) return;
    fetch(`${url}/api/catalog/${slug}/`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Ошибка ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        setItems(data);
        setFilteredItems(data);
      })
      .catch((err) => console.error("Ошибка загрузки:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  
  useEffect(() => {
    const query = searchQuery.toLowerCase();
    setFilteredItems(
      items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.art.toLowerCase().includes(query)
      )
    );
  }, [searchQuery, items]);

  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlightArt = params.get("highlight");

    if (highlightArt && itemRefs.current[highlightArt]) {
      itemRefs.current[highlightArt].scrollIntoView({ behavior: "smooth", block: "center" });
      itemRefs.current[highlightArt].style.backgroundColor = "#008000";
      setTimeout(() => {
        itemRefs.current[highlightArt].style.backgroundColor = "";
      }, 2000);
    }
  }, [items]);

  
  const addToCart = (item) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[item.art]) updated[item.art].quantity += 1;
      else updated[item.art] = { ...item, quantity: 1 };
      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  };

  const updateQuantity = (art, newQuantity) => {
    if (!newQuantity) return;
    let quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 1) return;
    const item = items.find((i) => i.art === art);
    const maxQuantity = item ? item.kl : 1;
    if (quantity > maxQuantity) quantity = maxQuantity;
    setCart((prev) => {
      const updated = { ...prev, [art]: { ...prev[art], quantity } };
      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCart = (art) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[art];
      localStorage.setItem("cart", JSON.stringify(updated));
      return updated;
    });
  };

  const isInCart = (art) => cart.hasOwnProperty(art);

  
  const { currentLevelKey, nextLevelRemaining } = (() => {
    const cartItems = Object.values(cart);
    const calculateSum = (priceKey) =>
      cartItems.reduce((sum, item) => sum + item[priceKey] * item.quantity, 0);

    let levelKey = "price3";
    let currentSum = calculateSum("price3");

    if (currentSum >= priceChecks.price2) {
      levelKey = "price2";
      currentSum = calculateSum("price2");
      if (currentSum >= priceChecks.price1) {
        levelKey = "price1";
        currentSum = calculateSum("price1");
        if (currentSum >= priceChecks.price) {
          levelKey = "price";
          currentSum = calculateSum("price");
        }
      }
    }

    let nextRemaining = 0;
    if (levelKey === "price3") nextRemaining = priceChecks.price2 - currentSum;
    else if (levelKey === "price2") nextRemaining = priceChecks.price1 - currentSum;
    else if (levelKey === "price1") nextRemaining = priceChecks.price - currentSum;
    nextRemaining = nextRemaining > 0 ? nextRemaining : 0;

    return { currentLevelKey: levelKey, nextLevelRemaining: nextRemaining };
  })();

  if (loading) return <div style={styles.loading}>Загрузка...</div>;

  return (
    <div style={styles.page}>
      <header style={{ ...styles.header, flexDirection: isMobile ? "column" : "row" }}>
        <div style={styles.headerLeft}>
          <div style={styles.logoSection} onClick={() => navigate("/")}>
            <img src="/logo.png" alt="logo" style={styles.logoImage} />
            {!isMobile && (
              <div style={styles.logoText}>
                <h1 style={styles.logoTitle}>ПЛЕЯДЫ</h1>
              </div>
            )}
          </div>
          {!isMobile && (
            <button style={styles.promoButton} onClick={() => navigate("/promo")}>
              Акции
            </button>
          )}
        </div>

        {isMobile && (
          <button
            style={{ ...styles.promoButton, marginTop: "10px" }}
            onClick={() => navigate("/promo")}
          >
            Акции
          </button>
        )}

        <div style={styles.headerRight}>
          {!isMobile && (
            <div style={styles.phoneSection}>
              +7 930 665-32-71
              <span style={styles.phoneSub}>для связи по вопросам и заказам</span>
            </div>
          )}

          {!isAuthenticated ? (
            <button style={styles.navButton} onClick={() => navigate("/login")}>
              Войти
            </button>
          ) : (
            <div style={styles.profileContainer}>
              <button style={styles.navButton} onClick={() => navigate("/profile")}>
                Профиль
              </button>
              <span style={styles.company}>{user?.company || "Нет названия"}</span>
            </div>
          )}

          <button style={styles.navButton} onClick={() => navigate("/cart")}>
            Корзина
          </button>

          <button style={styles.navButton} onClick={() => navigate("/")}>
            Каталог
          </button>
        </div>
      </header>

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Поиск по названию или артикулу..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <section style={styles.content}>
        <h1 style={styles.title}>Каталог: {slug?.toUpperCase()}</h1>

        <div style={styles.tableContainer}>
          <table
            style={{
              ...styles.table,
              fontSize: isMobile ? "12px" : "14px",
              minWidth: isMobile ? "100%" : "600px",
            }}
          >
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeader}>Артикул</th>
                <th style={styles.tableHeader}>Название</th>
                <th style={styles.tableHeader}>
                  Крупный опт<div style={styles.priceSubText}>от 500 000 ₽</div>
                </th>
                <th style={styles.tableHeader}>
                  Средний опт<div style={styles.priceSubText}>от 200 000 ₽</div>
                </th>
                <th style={styles.tableHeader}>
                  Мелкий опт<div style={styles.priceSubText}>от 100 000 ₽</div>
                </th>
                <th style={styles.tableHeader}>
                  Розница<div style={styles.priceSubText}>без ограничений</div>
                </th>
                <th style={styles.tableHeader}>Кол-во</th>
                <th style={styles.tableHeader}></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <tr
                    key={item.art}
                    ref={(el) => (itemRefs.current[item.art] = el)}
                    style={{
                      ...styles.tableRow,
                      backgroundColor: index % 2 === 0 ? "#2a2a2a" : "#333333",
                    }}
                  >
                    <td style={styles.tableCell}>{item.art}</td>
                    <td style={styles.tableCell}>{item.name}</td>

                    {["price", "price1", "price2", "price3"].map((type) => (
                      <td style={styles.tableCell} key={type}>
                        <div
                          style={{
                            fontWeight: currentLevelKey === type ? "bold" : "normal",
                            color: currentLevelKey === type ? "#ffcc00" : "#eee",
                          }}
                        >
                          {item[type].toLocaleString()} ₽
                        </div>
                        {currentLevelKey === type && nextLevelRemaining > 0 && (
                          <div
                            style={{
                              color: "#4CAF50",
                              fontSize: "10px",
                              marginTop: "2px",
                            }}
                          >
                            До следующего уровня: {nextLevelRemaining.toLocaleString()} ₽
                          </div>
                        )}
                      </td>
                    ))}

                    <td style={styles.tableCell}>{item.kl}</td>

                    <td style={styles.actionCell}>
                      {!isInCart(item.art) ? (
                        <button
                          style={{
                            ...styles.addButton,
                            fontSize: isMobile ? "12px" : "14px",
                          }}
                          onClick={() => addToCart(item)}
                          disabled={item.kl <= 0}
                        >
                          В корзину
                        </button>
                      ) : (
                        <div style={styles.quantityContainer}>
                          <input
                            type="number"
                            value={cart[item.art].quantity}
                            onChange={(e) => updateQuantity(item.art, e.target.value)}
                            min="1"
                            max={item.kl}
                            style={{
                              ...styles.quantityInput,
                              width: isMobile ? "40px" : "60px",
                            }}
                          />
                          <button
                            style={{
                              ...styles.removeButton,
                              width: isMobile ? "20px" : "25px",
                              height: isMobile ? "20px" : "25px",
                            }}
                            onClick={() => removeFromCart(item.art)}
                            title="Удалить"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={styles.noDataCell}>
                    Нет товаров
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#1c1c1c",
    color: "white",
    fontFamily: "Arial, sans-serif",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 20px",
    backgroundColor: "#2a2a2a",
    flexWrap: "wrap",
    gap: "10px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  logoSection: { display: "flex", alignItems: "center", gap: "20px", cursor: "pointer" },
  logoImage: { width: "150px", height: "auto", objectFit: "contain" },
  logoText: { display: "flex", flexDirection: "column" },
  logoTitle: { margin: 0, color: "#ffcc00" },
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
  navButton: {
    backgroundColor: "#ffcc00",
    border: "none",
    padding: "8px 16px",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#1c1c1c",
    whiteSpace: "nowrap",
  },
  searchContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "15px 10px",
    backgroundColor: "#222",
  },
  searchInput: {
    width: "100%",
    maxWidth: "400px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #444",
    backgroundColor: "#1c1c1c",
    color: "white",
    fontSize: "14px",
  },
  content: { padding: "20px 10px", maxWidth: "1400px", margin: "0 auto" },
  title: { fontSize: "28px", marginBottom: "20px", color: "#ffcc00", textAlign: "center" },
  tableContainer: { overflowX: "auto", borderRadius: "10px", border: "1px solid #444" },
  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "#2a2a2a" },
  tableHeaderRow: { backgroundColor: "#ffcc00" },
  tableHeader: {
    padding: "10px 6px",
    textAlign: "left",
    fontWeight: "bold",
    color: "#1c1c1c",
    borderBottom: "2px solid #444",
  },
  priceSubText: { fontSize: "11px", fontWeight: "normal", color: "#333", marginTop: "2px" },
  tableRow: { borderBottom: "1px solid #444" },
  tableCell: { padding: "6px 4px", borderRight: "1px solid #444", color: "#eee", wordBreak: "break-word" },
  actionCell: { padding: "6px", borderRight: "1px solid #444", minWidth: "90px" },
  noDataCell: { padding: "30px", textAlign: "center", color: "#aaa" },
  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#ffcc00" },
  addButton: { backgroundColor: "#ffcc00", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", color: "#1c1c1c", width: "100%", transition: "all 0.2s" },
  quantityContainer: { display: "flex", alignItems: "center", gap: "4px", justifyContent: "space-between" },
  quantityInput: { padding: "2px", borderRadius: "3px", border: "1px solid #555", backgroundColor: "#1c1c1c", color: "white", textAlign: "center" },
  removeButton: { backgroundColor: "#ff4444", border: "none", borderRadius: "3px", cursor: "pointer", fontWeight: "bold", color: "white", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.2s" },
};
