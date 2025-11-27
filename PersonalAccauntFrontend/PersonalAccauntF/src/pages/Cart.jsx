import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CryptoJS from "crypto-js";

const url = location.origin;

function formatPhone(val) {
  if (!val.startsWith("+7")) val = "+7";
  return "+7" + val.slice(2).replace(/\D/g, "");
}
const formatPrice = (value) => {
  const numericValue = Number(value ?? 0);
  const truncated = Math.trunc(numericValue * 100) / 100;
  return truncated.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

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
  const [orderMessage, setOrderMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailName, setEmailName] = useState("");
  const [emailPhone, setEmailPhone] = useState("+7");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const notifyCartUpdate = () => window.dispatchEvent(new Event("cartUpdated"));

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
    if (!token) return;

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
        } else {
          localStorage.removeItem("token");
          setUser(null);
          setIsAuthenticated(false);
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

  const cartItems = Object.values(cart);
  const cartTotalCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

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

  const updateQuantity = (art, quantity) => {
    let q = parseInt(quantity);
    if (isNaN(q) || q < 1) return;

    setCart((prev) => {
      const maxStock = prev[art]?.kl || 1;
      if (q > maxStock) q = maxStock;
      const updated = { ...prev, [art]: { ...prev[art], quantity: q } };
      localStorage.setItem("cart", JSON.stringify(updated));
      notifyCartUpdate();
      return updated;
    });
  };

  const removeItem = (art) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[art];
      localStorage.setItem("cart", JSON.stringify(updated));
      notifyCartUpdate();
      return updated;
    });
  };

  const handleCheckout = () => {
    if (!isAuthenticated) setShowQuickOrder(true);
    else handleAuthenticatedOrder();
  };

  const closeQuickOrderModal = () => {
    if (isLoading) return;
    setShowQuickOrder(false);
    setAwaitingCode(false);
    setCode("");
    setPhone("+7");
    setOrderMessage("");
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

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const fullName =
      user?.fio ||
      user?.name ||
      user?.first_name ||
      user?.username ||
      user?.company ||
      "";
    if (fullName) setEmailName(fullName);
    if (user?.email) setEmailAddress(user.email);
    if (user?.phone) setEmailPhone(formatPhone(user.phone));
  }, [isAuthenticated, user]);

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
      await fetch(`${url}/api/email-send/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: emailName,
          email: emailAddress,
          phone: emailPhone,
          message: emailMessage,
          domen: location.origin,
        }),
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

  const handleQuickOrder = async () => {
    try {
      setIsLoading(true);
      setOrderMessage("");

      const payload = awaitingCode
        ? { phone: formatPhone(phone), code, cart }
        : { phone: formatPhone(phone), cart };

      const resOrder = await fetch(`${url}/api/order/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resOrder.ok) {
        const text = await resOrder.text();
        throw new Error(`Ошибка order: ${resOrder.status} ${text}`);
      }

      const data = await resOrder.json();

      if (!awaitingCode && data.verification_required) {
        setAwaitingCode(true);
        setOrderMessage("Код подтверждения отправлен на телефон");
        return;
      }

    
      if (awaitingCode || isAuthenticated) {
        const orderItems = cartItems.map((item) => ({
          art: item.art,
          name: item.name,
          quantity: item.quantity,
          price: dynamicPrices[item.art],
        }));

        const orderData = {
          user: { phone: formatPhone(phone) },
          items: orderItems,
          totalSum: totalCartSum,
          priceLevel: currentPriceLevel,
          savings: totalSavings,
          orderDate: new Date().toISOString(),
          domen: location.origin
        };

        const resLine = await fetch(`${url}/api/order-line/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });

        if (!resLine.ok) {
          const text = await resLine.text();
          throw new Error(`Ошибка order-line: ${resLine.status} ${text}`);
        }

       
        const lineData = await resLine.json();
        const orderNumber = lineData?.idapp || lineData?.id || "—";

        localStorage.setItem(
          "orderSuccess",
          JSON.stringify({
            orderNumber,
            totalSum: totalCartSum,
            priceLevel: currentPriceLevel,
            savings: totalSavings,
          })
        );

        setCart({});
        localStorage.removeItem("cart");
        notifyCartUpdate();

        navigate("/order-success");
      }

    } catch (err) {
      console.error(err);
      setOrderMessage(
        awaitingCode
          ? "✗ Неверный код подтверждения. Попробуйте еще раз"
          : "✗ Не удалось оформить заказ"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticatedOrder = async () => {
    try {
      setIsLoading(true);
      setOrderMessage("");

      const token = localStorage.getItem("token");
      if (!token) return setOrderMessage("Пожалуйста, авторизуйтесь");

      const orderItems = cartItems.map((item) => ({
        art: item.art,
        name: item.name,
        quantity: item.quantity,
        price: dynamicPrices[item.art],
      }));

      const orderData = {
        user: {
          phone: user?.phone || user?.phone_number || "+7",
          inn: user?.inn || "",
          id_user: user?.id || " ",
          company: user?.company || " ",
        },
        items: orderItems,
        totalSum: totalCartSum,
        priceLevel: currentPriceLevel,
        savings: totalSavings,
        orderDate: new Date().toISOString(),
        domen: location.origin
      };

      const resLine = await fetch(`${url}/api/order-line/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!resLine.ok) {
        const text = await resLine.text();
        throw new Error(`Ошибка order-line: ${resLine.status} ${text}`);
      }

      
      const lineData = await resLine.json();
      const orderNumber = lineData?.idapp || lineData?.id || "—";

      const resz = await fetch(`${url}/api/order/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cart }),
      });

      if (!resz.ok) {
        if (resz.status === 401) {
          setOrderMessage("Сессия истекла. Пожалуйста, авторизуйтесь заново.");
          localStorage.removeItem("token");
          return;
        }
        const text = await resz.text();
        throw new Error(`Ошибка запроса: ${resz.status} ${text}`);
      }

     
      localStorage.setItem(
        "orderSuccess",
        JSON.stringify({
          orderNumber,
          totalSum: totalCartSum,
          priceLevel: currentPriceLevel,
          savings: totalSavings,
        })
      );

      setCart({});
      localStorage.removeItem("cart");
      notifyCartUpdate();

    
      navigate("/order-success");

    } catch (err) {
      console.error(err);
      setOrderMessage("Не удалось оформить заказ. Попробуйте еще раз.");
    } finally {
      setIsLoading(false);
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
          <button style={{ ...s.promoButton, marginTop: "10px" }} onClick={() => navigate("/promo")}>
            Акции
          </button>
        )}

        <div style={s.headerRight}>
          {!isMobile && (
            <div style={s.phoneSection}>
              <button style={s.iconButton} onClick={() => setShowEmailModal(true)} title="Написать письмо">
                <img src="/email.png" alt="email" style={s.headerIcon} />
              </button>

              <a href="https://t.me/zapchasticpectex" style={s.headerPhotoLink}>
                <img src="/telega.png" alt="promo banner" style={s.headerPhoto} />
              </a>
              <div style={s.phoneContent}>
                <div>+7 930 665-32-71</div>
                <div>zakaz@zpnn.ru</div>
                <span style={s.phoneSub}>для связи по вопросам и заказам</span>
              </div>
            </div>
          )}
          <nav style={s.nav}>
            {!isAuthenticated ? (
              <button style={s.navButton} onClick={() => navigate("/login")}>Войти</button>
            ) : (
              <div style={s.profileContainer}>
                <button style={s.navButton} onClick={() => navigate("/profile")}>Профиль</button>
                {user?.company && <span style={s.company}>{user.company}</span>}
              </div>
            )}
            <div style={{ position: "relative" }}>
              <button style={s.navButton} onClick={() => navigate("/cart")}>Корзина</button>
              {cartTotalCount > 0 && (
                <div style={s.cartBadge}>
                  <div style={s.cartCount}>{cartTotalCount}</div>
                </div>
              )}
            </div>
            <button style={s.navButton} onClick={() => navigate("/")}>Каталог</button>
          </nav>

          {isMobile && (
            <div style={s.mobileContactBlock}>
              <div style={s.mobileIconsContainer}>
                <button style={s.mobileIconButton} onClick={() => setShowEmailModal(true)} title="Написать письмо">
                  <img src="/email.png" alt="email" style={s.mobileTelegramIcon} />
                </button>
                <a href="https://t.me/zapchasticpectex" style={s.mobileTelegramLink}>
                  <img src="/telega.png" alt="Telegram" style={s.mobileTelegramIcon} />
                </a>
              </div>
              <div style={s.mobilePhoneText}>+7 930 665-32-71</div>
              <div style={s.mobileEmailText}>zakaz@zpnn.ru</div>
            </div>
          )}
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
                  <th style={s.th}>№</th>
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
                {cartItems.map((item, index) => {
                  const dynamicPrice = dynamicPrices[item.art];
                  const sumItem = dynamicPrice * item.quantity;
                  const save = item.price3 * item.quantity - sumItem;
                  return (
                    <tr key={item.art}>
                      <td style={{ ...s.td, textAlign: "center" }}>{index + 1}</td>
                      <td style={s.td}>{item.art}</td>
                      <td style={s.td}>{item.name}</td>
                      <td style={s.td}>{formatPrice(dynamicPrice)}</td>
                      <td style={s.td}>
                        <input
                          type="number"
                          value={item.quantity}
                          min="1"
                          max={item.kl}
                          onChange={(e) => updateQuantity(item.art, e.target.value)}
                          style={{
                            ...s.input,
                            width: isMobile ? "50px" : "70px",
                          }}
                        />
                      </td>
                      <td style={s.td}>{formatPrice(sumItem)}</td>
                      <td style={{ ...s.td, color: save > 0 ? "#0f0" : "#ccc" }}>
                        {save > 0 ? `-${formatPrice(save)}` : "-"}
                      </td>
                      <td style={s.td}>{item.kl}</td>
                      <td style={s.td}>
                        <button onClick={() => removeItem(item.art)} style={s.removeBtn}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={s.cartNotice}>
              Цены действительны на условиях 100% предоплаты
            </div>

            <div style={s.summary}>
              <h3 style={s.summaryTitle}>Итого: {formatPrice(totalCartSum)} ₽</h3>
              <div style={s.currentLevel}>
                Уровень цен: <strong>{currentPriceLevel}</strong>
              </div>
              {totalSavings > 0 && (
                <div style={s.savings}>
                  Экономия: <strong style={{ color: "#0f0" }}>{formatPrice(totalSavings)} ₽</strong>
                </div>
              )}
            </div>

            <button style={s.checkoutBtn} onClick={handleCheckout}>Оформить заказ</button>

            {orderMessage && (
              <div style={{ marginTop: "20px", color: "#0f0", fontWeight: "bold", textAlign: "center", whiteSpace: "pre-line" }}>
                {orderMessage}
              </div>
            )}
          </div>
        )}
      </div>

      
      {showQuickOrder && (
        <div style={s.quickOrderOverlay} onClick={closeQuickOrderModal}>
          <div style={s.quickOrderModal} onClick={(e) => e.stopPropagation()}>
            <button
              style={s.modalClose}
              onClick={closeQuickOrderModal}
              disabled={isLoading}
            >
              ×
            </button>
            <h2 style={s.modalTitle}>Быстрый заказ</h2>
            {!awaitingCode ? (
              <>
                <label style={s.label}>Ваш телефон:</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (XXX) XXX-XX-XX"
                  style={s.modalInput}
                />
                <p style={s.helperText}>На номер будет отправлен код подтверждения</p>
              </>
            ) : (
              <>
                <label style={s.label}>Код подтверждения:</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Введите код"
                  style={s.modalInput}
                />
              </>
            )}
            <div style={s.quickOrderButtons}>
              <button
                onClick={handleQuickOrder}
                disabled={isLoading}
                style={{ ...s.modalBtn, ...(isLoading ? s.modalBtnDisabled : {}) }}
              >
                {isLoading ? "Загрузка..." : awaitingCode ? "Подтвердить" : "Отправить код"}
              </button>
              <button
                onClick={closeQuickOrderModal}
                disabled={isLoading}
                style={s.modalBtnCancel}
              >
                Отмена
              </button>
            </div>
            {orderMessage && (
              <div style={s.quickOrderMessage}>
                {orderMessage}
              </div>
            )}
          </div>
        </div>
      )}

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
    flexDirection: mobile ? "column" : "row",
    width: mobile ? "100%" : "auto",
  },
  phoneSection: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "12px",
    color: "white",
    fontSize: "14px",
  },
  phoneContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  phoneSub: {
    color: "#ccc",
    fontSize: "12px",
    marginTop: "2px",
  },
  headerPhotoLink: {
    display: "flex",
    textDecoration: "none",
  },
  headerPhoto: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    objectFit: "cover",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  headerIcon: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    objectFit: "cover",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  iconButton: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    display: "flex",
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
  nav: {
    display: "flex",
    alignItems: "center",
    gap: mobile ? "10px" : "20px",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  navButton: {
    backgroundColor: "#ffcc00",
    border: "none",
    padding: mobile ? "8px 12px" : "8px 16px",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#1c1c1c",
    fontSize: mobile ? "12px" : "14px",
    whiteSpace: "nowrap",
  },
  cartBadge: {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff4444",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  },
  cartCount: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#fff",
    lineHeight: 1,
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
    padding: mobile ? "0 12px" : "0 20px",
  },
  title: {
    fontSize: mobile ? "24px" : "32px",
    margin: mobile ? "24px 0 20px" : "40px 0 30px",
    color: "#ffcc00",
    fontWeight: "bold",
    textAlign: mobile ? "center" : "left",
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
    fontSize: mobile ? "12px" : "14px",
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
  cartNotice: {
    fontSize: mobile ? "13px" : "16px",
    color: "#fff",
    marginTop: "20px",
    marginBottom: "10px",
    textAlign: "left",
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
  modal: {
    backgroundColor: "#2a2a2a",
    padding: "30px",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
    width: "90%",
    maxWidth: "400px",
    position: "relative",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  quickOrderOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  quickOrderModal: {
    backgroundColor: "#2a2a2a",
    padding: mobile ? "20px" : "30px",
    borderRadius: "12px",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.55)",
    width: "100%",
    maxWidth: "420px",
    position: "relative",
  },
  modalTitle: {
    margin: "0 0 20px 0",
    color: "#ffcc00",
    fontSize: "24px",
    fontWeight: "bold",
  },
  modalText: {
    color: "#ccc",
    fontSize: "14px",
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#fff",
    fontWeight: "500",
  },
  modalInput: {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    border: "1px solid #555",
    borderRadius: "4px",
    backgroundColor: "#1c1c1c",
    color: "white",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  helperText: {
    fontSize: "12px",
    color: "#aaa",
    margin: "0 0 20px 0",
  },
  modalButtons: {
    display: "flex",
    gap: "10px",
    justifyContent: "space-between",
  },
  quickOrderButtons: {
    display: "flex",
    gap: "10px",
    flexDirection: mobile ? "column" : "row",
    justifyContent: "space-between",
    marginTop: "10px",
  },
  modalBtn: {
    flex: 1,
    backgroundColor: "#ffcc00",
    color: "#1c1c1c",
    padding: "12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  modalBtnDisabled: {
    backgroundColor: "#999",
    cursor: "not-allowed",
    opacity: 0.6,
  },
  modalBtnCancel: {
    flex: 1,
    backgroundColor: "#555",
    color: "white",
    padding: "12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
  quickOrderMessage: {
    marginTop: "15px",
    color: "#0f0",
    fontSize: "14px",
    textAlign: "center",
    whiteSpace: "pre-line",
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