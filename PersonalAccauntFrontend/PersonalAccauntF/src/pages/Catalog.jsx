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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailName, setEmailName] = useState("");
  const [emailPhone, setEmailPhone] = useState("+7");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  const productPhotos = [
    "/qw.png",
    "/w.png",
    "/e.png",
    "/r.png",
    "/u.png",
    "/y.png",
  ];

  const priceChecks = {
    price: 500000,
    price1: 200000,
    price2: 100000,
    price3: 0,
  };

  const itemRefs = useRef({});
  const searchWrapperRef = useRef(null);

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
      itemRefs.current[highlightArt].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      itemRefs.current[highlightArt].style.backgroundColor = "#008000";
      setTimeout(() => {
        if (itemRefs.current[highlightArt]) {
          itemRefs.current[highlightArt].style.backgroundColor = "";
        }
      }, 2000);
    }
  }, [items]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatPhone = (val) => {
    if (!val.startsWith("+7")) val = "+7";
    return "+7" + val.slice(2).replace(/\D/g, "");
  };

  const handleEmailNameChange = (e) => {
    setEmailName(e.target.value);
    setEmailError("");
    setEmailSuccess("");
  };

  const handleEmailPhoneChange = (e) => {
    setEmailPhone(formatPhone(e.target.value));
    setEmailError("");
    setEmailSuccess("");
  };

  const handleEmailAddressChange = (e) => {
    setEmailAddress(e.target.value);
    setEmailError("");
    setEmailSuccess("");
  };

  const handleEmailMessageChange = (e) => {
    setEmailMessage(e.target.value);
    setEmailError("");
    setEmailSuccess("");
  };

  const handleEmailSubmit = async () => {
    setEmailError("");
    setEmailSuccess("");

    if (!emailName.trim()) {
      setEmailError("Пожалуйста, введите ваше имя");
      return;
    }

    if (!emailAddress.trim()) {
      setEmailError("Пожалуйста, введите вашу почту");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      setEmailError("Пожалуйста, введите корректный адрес почты");
      return;
    }

    const cleaned = emailPhone.replace(/\D/g, "");
    if (!/^7\d{10}$/.test(cleaned)) {
      setEmailError("Пожалуйста, введите корректный номер телефона (+7 и 10 цифр)");
      return;
    }

    if (!emailMessage.trim()) {
      setEmailError("Пожалуйста, введите сообщение");
      return;
    }

    setEmailLoading(true);
    try {
      await axios.post(`${window.location.origin}/api/email-send/`, {
        name: emailName,
        email: emailAddress,
        phone: emailPhone,
        message: emailMessage,
      });
      setEmailSuccess("Спасибо! Ваше письмо отправлено. Мы свяжемся с вами в ближайшее время.");
      setEmailName("");
      setEmailPhone("+7");
      setEmailAddress("");
      setEmailMessage("");
    } catch {
      setEmailError("Ошибка при отправке письма. Попробуйте еще раз.");
    } finally {
      setEmailLoading(false);
    }
  };

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

  const filteredSuggestions = searchQuery
    ? items
        .filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.art.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 8)
    : [];

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
              <button style={s.iconButton} onClick={() => setShowEmailModal(true)} title="Написать письмо">
                <img src="/email.png" alt="email" style={s.headerIcon} />
              </button>

              <a href="/qwwerwer" style={s.headerPhotoLink}>
                <img src="/telega.png" alt="promo banner" style={s.headerPhoto} />
              </a>
              
              <div style={s.phoneContent}>
                <div>+7 930 665-32-71</div>
                <div>zakaz@zpnn.ru</div>
                <span style={s.phoneSub}>для связи по вопросам и заказам</span>
              </div>
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

          {isMobile && (
            <div style={s.mobileContactBlock}>
              <div style={s.mobileIconsContainer}>
                <button style={s.mobileIconButton} onClick={() => setShowEmailModal(true)} title="Написать письмо">
                  <img src="/email.png" alt="email" style={s.mobileTelegramIcon} />
                </button>
                <a href="https://t.me/your_telegram" style={s.mobileTelegramLink}>
                  <img src="/telega.png" alt="Telegram" style={s.mobileTelegramIcon} />
                </a>
              </div>
              <div style={s.mobilePhoneText}>+7 930 665-32-71</div>
              <div style={s.mobileEmailText}>zakaz@zpnn.ru</div>
            </div>
          )}
        </div>
      </header>

      <div style={s.searchContainer}>
        <div
          ref={searchWrapperRef}
          style={{ position: "relative", width: "100%", maxWidth: "400px" }}
        >
          <input
            type="text"
            placeholder="Поиск по названию или артикулу..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            style={s.searchInput}
          />

          {showSuggestions && searchQuery && filteredSuggestions.length > 0 && (
            <div style={s.suggestionsBox}>
              {filteredSuggestions.map((item) => (
                <div
                  key={item.art}
                  style={s.suggestionItem}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchQuery(item.name);
                    setShowSuggestions(false);

                    const el = itemRefs.current[item.art];
                    if (el) {
                      setTimeout(() => {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });

                        el.style.backgroundColor = "#008000";
                        setTimeout(() => {
                          if (el) el.style.backgroundColor = "";
                        }, 900);
                      }, 50);
                    }
                  }}
                >
                  <div style={{ fontWeight: "bold", color: "#ffcc00" }}>{item.name}</div>
                  <div style={{ fontSize: "13px" }}>{item.art}</div>
                </div>
              ))}
            </div>
          )}
        </div>
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
              { src: "/mksm.jpg", url: "/catalog/mksm/" },
              { src: "/locust.png", url: "/catalog/lokust/" },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  ...s.catalogItem,
                  cursor: "pointer",
                  opacity:
                    slug?.toLowerCase() === item.url.split("/")[2] ? 1 : 0.7,
                }}
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

      <section style={s.productsSection}>
        <div style={s.productsGallery}>
          {productPhotos.map((photo, index) => (
            <img key={index} src={photo} alt={`product-${index}`} style={s.productPhoto} />
          ))}
        </div>
      </section>

      {showEmailModal && (
        <div style={s.modalOverlay} onClick={() => !emailLoading && setShowEmailModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Отправить письмо</h2>
            <p style={s.modalText}>Заполните поля ниже, и мы свяжемся с вами</p>

            <input
              type="text"
              value={emailName}
              onChange={handleEmailNameChange}
              style={s.modalInput}
              placeholder="Ваше имя *"
              disabled={emailLoading}
            />
            <input
              type="email"
              value={emailAddress}
              onChange={handleEmailAddressChange}
              style={s.modalInput}
              placeholder="Ваша почта *"
              disabled={emailLoading}
            />
            <input
              type="tel"
              value={emailPhone}
              onChange={handleEmailPhoneChange}
              style={s.modalInput}
              placeholder="Номер телефона *"
              disabled={emailLoading}
            />
            <textarea
              value={emailMessage}
              onChange={handleEmailMessageChange}
              style={{...s.modalInput, minHeight: "100px", fontFamily: "Arial, sans-serif"}}
              placeholder="Ваше сообщение *"
              disabled={emailLoading}
            />

            {emailError && <div style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>{emailError}</div>}
            {emailSuccess && <div style={{ color: "limegreen", fontSize: "14px", marginBottom: "10px" }}>{emailSuccess}</div>}

            <div style={s.modalButtons}>
              <button style={s.modalSubmitBtn} onClick={handleEmailSubmit} disabled={emailLoading}>
                {emailLoading ? "Отправка..." : "Отправить"}
              </button>
              <button style={s.modalCancelBtn} onClick={() => setShowEmailModal(false)} disabled={emailLoading}>
                Отмена
              </button>
            </div>

            <button style={s.modalClose} onClick={() => setShowEmailModal(false)} disabled={emailLoading}>×</button>
          </div>
        </div>
      )}
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
    flexDirection: mobile ? "column" : "row",
    width: mobile ? "100%" : "auto",
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
    alignItems: "center",
    gap: "10px",
    color: "white",
    fontSize: "14px",
  },
  phoneContent: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.2,
  },
  phoneSub: {
    color: "#ccc",
    fontSize: "12px",
    marginTop: "2px",
  },
  mobileContactBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    paddingTop: "12px",
    borderTop: "1px solid #444",
    justifyContent: "center",
  },
  mobileIconsContainer: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  mobileIconButton: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    display: "flex",
  },
  mobileTelegramLink: {
    display: "flex",
    textDecoration: "none",
  },
  mobileTelegramIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  mobilePhoneText: {
    color: "#ffcc00",
    fontWeight: "bold",
    fontSize: "14px",
    textAlign: "center",
  },
  mobileEmailText: {
    color: "#ccc",
    fontSize: "12px",
    textAlign: "center",
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
  iconButton: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    display: "flex",
  },
  headerIcon: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    objectFit: "cover",
    cursor: "pointer",
    transition: "transform 0.2s",
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
  suggestionsBox: {
    position: "absolute",
    top: "105%",
    left: 0,
    right: 0,
    backgroundColor: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "6px",
    maxHeight: "250px",
    overflowY: "auto",
    zIndex: 999,
    boxShadow: "0 6px 20px rgba(0,0,0,0.6)",
  },
  suggestionItem: {
    padding: "8px 10px",
    borderBottom: "1px solid #444",
    cursor: "pointer",
    color: "white",
    transition: "background 0.12s",
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
  tableHeaderRow: {
    backgroundColor: "#ffcc00",
  },
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
  productsSection: {
    display: "flex",
    justifyContent: "center",
    padding: "60px 20px",
    backgroundColor: "#1c1c1c",
    width: "100%",
  },
  productsGallery: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: mobile ? "15px" : "25px",
    maxWidth: "1400px",
  },
  productPhoto: {
    width: mobile ? "120px" : "200px",
    height: mobile ? "120px" : "200px",
    objectFit: "cover",
    borderRadius: "8px",
  },
  headerPhotoLink: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
  },
  headerPhoto: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    objectFit: "cover",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
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
});