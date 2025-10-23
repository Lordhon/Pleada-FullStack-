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

  const s = styles(isMobile);

  if (loading) return <div style={s.loading}>Загрузка...</div>;

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoSection} onClick={() => navigate("/")}>
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

          {!isAuthenticated ? (
            <button style={s.navButton} onClick={() => navigate("/login")}>
              Войти
            </button>
          ) : (
            <div style={s.profileContainer}>
              <button style={s.navButton} onClick={() => navigate("/profile")}>
                Профиль
              </button>
              <span style={s.company}>{user?.company || "Нет названия"}</span>
            </div>
          )}

          <button style={s.navButton} onClick={() => navigate("/cart")}>
            Корзина
          </button>

          <button style={s.navButton} onClick={() => navigate("/")}>
            Каталог
          </button>
        </div>
      </header>

      <div style={s.searchContainer}>
        <input
          type="text"
          placeholder="Поиск по названию или артикулу..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={s.searchInput}
        />
      </div>

     
      <section style={s.catalogSection}>
        <div style={s.catalogWrapper}>
          <h2 style={s.galeryTitle}>Категории</h2>
          <div style={s.catalogGrid}>
            {[
              { src: "/komatsy.jpg", url: "/catalog/komatsu/" },
              { src: "/mst.jpg", url: "/catalog/mst/" },
              { src: "/CASE.jpg", url: "/catalog/case/" },
              { src: "/CAT.jpg", url: "/catalog/caterpillar/" },
              { src: "/terex.png", url: "/catalog/terex/" },
              { src: "/JCB.jpg", url: "/catalog/jcb/" },
              { src: "/bobcat.jpg", url: "/catalog/bobcat/" },
              { src: "/volvo.jpg", url: "/catalog/volvo/" },
              { src: "/hidromek.png", url: "/catalog/hidromek/" },
            ].map((item, index) => (
              <div
                key={index}
                style={{...s.catalogItem, cursor: "pointer", opacity: slug?.toLowerCase() === item.url.split("/")[2] ? 1 : 0.7}}
                onClick={() => navigate(item.url)}
              >
                <img src={item.src} alt={`category-${index}`} style={s.catalogImg} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={s.content}>
        <h1 style={s.title}>Каталог: {slug?.toUpperCase()}</h1>
        <div style={s.tableContainer}>
          <table style={s.table}>
            <thead>
              <tr style={s.tableHeaderRow}>
                <th style={s.tableHeader}>Артикул</th>
                <th style={s.tableHeader}>Название</th>
                <th style={s.tableHeader}>
                  <div style={s.priceHeaderText}>Крупный опт</div>
                  <div style={s.priceSubText}>от 500 000 ₽</div>
                </th>
                <th style={s.tableHeader}>
                  <div style={s.priceHeaderText}>Средний опт</div>
                  <div style={s.priceSubText}>от 200 000 ₽</div>
                </th>
                <th style={s.tableHeader}>
                  <div style={s.priceHeaderText}>Мелкий опт</div>
                  <div style={s.priceSubText}>от 100 000 ₽</div>
                </th>
                <th style={s.tableHeader}>
                  <div style={s.priceHeaderText}>Розница</div>
                  <div style={s.priceSubText}>без ограничений</div>
                </th>
                <th style={s.tableHeader}>Кол-во</th>
                <th style={s.tableHeader}></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => (
                  <tr
                    key={item.art}
                    ref={(el) => (itemRefs.current[item.art] = el)}
                    style={{
                      ...s.tableRow,
                      backgroundColor: index % 2 === 0 ? "#2a2a2a" : "#333333",
                    }}
                  >
                    <td style={s.tableCell}>{item.art}</td>
                    <td style={s.tableCell}>{item.name}</td>

                    {["price", "price1", "price2", "price3"].map((type) => (
                      <td style={s.tableCell} key={type}>
                        <div
                          style={{
                            fontWeight: currentLevelKey === type ? "bold" : "normal",
                            color: currentLevelKey === type ? "#ffcc00" : "#eee",
                          }}
                        >
                          {item[type].toLocaleString()} ₽
                        </div>
                        {currentLevelKey === type && nextLevelRemaining > 0 && (
                          <div style={s.nextLevelHint}>
                            До следующего уровня: {nextLevelRemaining.toLocaleString()} ₽
                          </div>
                        )}
                      </td>
                    ))}

                    <td style={s.tableCell}>{item.kl}</td>

                    <td style={s.actionCell}>
                      {!isInCart(item.art) ? (
                        <button
                          style={s.addButton}
                          onClick={() => addToCart(item)}
                          disabled={item.kl <= 0}
                        >
                          В корзину
                        </button>
                      ) : (
                        <div style={s.quantityContainer}>
                          <input
                            type="number"
                            value={cart[item.art].quantity}
                            onChange={(e) => updateQuantity(item.art, e.target.value)}
                            min="1"
                            max={item.kl}
                            style={s.quantityInput}
                          />
                          <button
                            style={s.removeButton}
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
                  <td colSpan="8" style={s.noDataCell}>
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

const styles = (mobile) => ({
  page: {
    backgroundColor: "#1c1c1c",
    color: "white",
    fontFamily: "Arial, sans-serif",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    flexDirection: mobile ? "column" : "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: mobile ? "10px" : "10px 40px",
    backgroundColor: "#2a2a2a",
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
    flexWrap: "wrap",
  },
  logoSection: { display: "flex", alignItems: "center", gap: mobile ? "10px" : "15px", cursor: "pointer" },
  logoImage: { width: mobile ? "100px" : "150px", height: "auto", objectFit: "contain" },
  logoText: { display: "flex", flexDirection: "column" },
  logoTitle: { margin: 0, color: "#ffcc00", fontSize: mobile ? "22px" : "30px" },
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
    fontSize: "14px",
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
  catalogSection: { 
    display: "flex", 
    justifyContent: "center", 
    width: "100%", 
    padding: mobile ? "20px 10px" : "30px 20px",
    backgroundColor: "#1c1c1c",
  },
  catalogWrapper: { 
    width: "100%",
    maxWidth: "1400px",
  },
  galeryTitle: {
    fontSize: mobile ? "20px" : "24px",
    marginBottom: "15px",
    textAlign: "left",
    color: "#ffcc00",
    fontWeight: "bold",
    margin: "0 0 15px 0",
  },
  catalogGrid: { 
    display: "grid", 
    gridTemplateColumns: mobile ? "repeat(auto-fit, minmax(120px, 1fr))" : "repeat(auto-fit, minmax(180px, 1fr))", 
    gap: mobile ? "10px" : "15px",
  },
  catalogItem: { 
    backgroundColor: "#2a2a2a", 
    borderRadius: "8px", 
    overflow: "hidden", 
    aspectRatio: "16/9",
    transition: "transform 0.2s, opacity 0.2s",
  },
  catalogImg: { 
    width: "100%", 
    height: "100%", 
    objectFit: "cover", 
    display: "block", 
    borderRadius: "8px",
  },
  title: {
    fontSize: mobile ? "20px" : "28px",
    marginBottom: "20px",
    color: "#ffcc00",
    textAlign: "left",
  },
  content: { 
    padding: mobile ? "15px 10px" : "30px 20px", 
    maxWidth: "1400px", 
    margin: "0 auto",
  },
  tableContainer: { 
    overflowX: "auto", 
    borderRadius: "10px", 
    border: "1px solid #444",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  table: { 
    width: "100%", 
    borderCollapse: "collapse", 
    backgroundColor: "#2a2a2a",
    fontSize: mobile ? "11px" : "13px",
  },
  tableHeaderRow: { backgroundColor: "#ffcc00" },
  tableHeader: {
    padding: mobile ? "12px 8px" : "15px 12px",
    textAlign: "left",
    fontWeight: "bold",
    color: "#1c1c1c",
    borderBottom: "2px solid #444",
    whiteSpace: "nowrap",
    fontSize: mobile ? "12px" : "13px",
  },
  priceHeaderText: {
    fontWeight: "bold",
    marginBottom: "3px",
  },
  priceSubText: { 
    fontSize: mobile ? "10px" : "11px", 
    fontWeight: "normal", 
    color: "#333",
    marginTop: "2px",
  },
  tableRow: { 
    borderBottom: "1px solid #444",
    transition: "background-color 0.2s",
  },
  tableCell: { 
    padding: mobile ? "8px 6px" : "12px 10px", 
    borderRight: "1px solid #444", 
    color: "#eee", 
    wordBreak: "break-word",
  },
  nextLevelHint: {
    color: "#4CAF50",
    fontSize: "10px",
    marginTop: "2px",
    fontWeight: "bold",
  },
  actionCell: { 
    padding: mobile ? "8px 4px" : "12px 8px", 
    borderRight: "1px solid #444", 
    minWidth: mobile ? "70px" : "90px",
  },
  noDataCell: { 
    padding: "30px", 
    textAlign: "center", 
    color: "#aaa",
    fontSize: "16px",
  },
  loading: { 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    height: "100vh", 
    color: "#ffcc00",
    fontSize: "18px",
  },
  addButton: { 
    backgroundColor: "#ffcc00", 
    border: "none", 
    padding: mobile ? "6px 8px" : "8px 12px", 
    borderRadius: "4px", 
    cursor: "pointer", 
    fontWeight: "bold", 
    color: "#1c1c1c", 
    width: "100%", 
    transition: "all 0.2s",
    fontSize: mobile ? "11px" : "12px",
  },
  quantityContainer: { 
    display: "flex", 
    alignItems: "center", 
    gap: "4px", 
    justifyContent: "space-between",
  },
  quantityInput: { 
    flex: 1,
    padding: "4px", 
    borderRadius: "3px", 
    border: "1px solid #555", 
    backgroundColor: "#1c1c1c", 
    color: "white", 
    textAlign: "center",
    fontSize: "12px",
  },
  removeButton: { 
    backgroundColor: "#ff4444", 
    border: "none", 
    borderRadius: "3px", 
    cursor: "pointer", 
    fontWeight: "bold", 
    color: "white", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    transition: "background-color 0.2s",
    width: mobile ? "24px" : "30px",
    height: mobile ? "24px" : "30px",
    fontSize: mobile ? "16px" : "18px",
  },
});