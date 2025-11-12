import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";



export default function MainPage() {
  
  const navigate = useNavigate();
  const catalogRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [callbackPhone, setCallbackPhone] = useState("+7");
  const [callbackName, setCallbackName] = useState("");
  const [callbackLoading, setCallbackLoading] = useState(false);
  const [callbackError, setCallbackError] = useState("");
  const [callbackSuccess, setCallbackSuccess] = useState("");

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailName, setEmailName] = useState("");
  const [emailPhone, setEmailPhone] = useState("+7");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  const catalogItems = [
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
  ];

  const productPhotos = [
    "/qw.png",
    "/w.png",
    "/e.png",
    "/r.png",
    "/u.png",
    "/y.png",
  ];

  const heroImages = ["/slide1.jpg", "/slide2.jpg", "/slide3.jpg", "/slide4.jpg"];
  const [currentSlide, setCurrentSlide] = useState(0);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroImages.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.backgroundColor = "#1c1c1c";
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const url = window.location.origin;

    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      return;
    }

    const verifyAndFetchUser = async () => {
      try {
        await axios.get(`${url}/api/verify/`, { headers: { Authorization: `Bearer ${token}` } });
        const res = await axios.get(`${url}/api/me/`, { headers: { Authorization: `Bearer ${token}` } });
        
        setUser(res.data);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        
        setUser(null);
      }
    };

    verifyAndFetchUser();
    const intervalId = setInterval(verifyAndFetchUser, 300000);
    return () => clearInterval(intervalId);
  }, []);

  const scrollToCatalog = () => catalogRef.current.scrollIntoView({ behavior: "smooth" });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const res = await axios.get(`${window.location.origin}/api/search/?q=${encodeURIComponent(searchQuery)}`);
      if (res.data.art) {
        navigate(`/catalog/${res.data.company_slug}?highlight=${res.data.art}`);
      } else {
        setSearchMessage("Товар не найден");
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 5000);
      }
    } catch {
      setSearchMessage("Ошибка поиска");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 5000);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await axios.get(`${window.location.origin}/api/search-help/?q=${encodeURIComponent(searchQuery)}`);
        setSearchSuggestions(res.data);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Ошибка получения подсказок:", err);
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [searchQuery]);

  const formatPhone = (val) => {
    if (!val.startsWith("+7")) val = "+7";
    return "+7" + val.slice(2).replace(/\D/g, "");
  };

  const handleCallbackPhoneChange = (e) => {
    setCallbackPhone(formatPhone(e.target.value));
    setCallbackError("");
    setCallbackSuccess("");
  };

  const handleCallbackNameChange = (e) => {
    setCallbackName(e.target.value);
    setCallbackError("");
    setCallbackSuccess("");
  };

  const handleCallbackSubmit = async () => {
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
      });
      setCallbackSuccess("Спасибо! Мы вам перезвоним в ближайшее время.");
      setCallbackPhone("+7");
      setCallbackName("");
    } catch {
      setCallbackError("Ошибка при отправке данных. Попробуйте еще раз.");
    } finally {
      setCallbackLoading(false);
    }
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

  const s = styles(isMobile);

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
            <button style={s.promoButton} onClick={() => navigate("/promo")}>Акции</button>
          )}
        </div>

        {isMobile && (
          <button style={{ ...s.promoButton, marginTop: "10px" }} onClick={() => navigate("/promo")}>Акции</button>
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

          {!isAuthenticated ? (
            <button style={s.navButton} onClick={() => navigate("/login")}>Войти</button>
          ) : (
            <div style={s.profileContainer}>
              <button style={s.navButton} onClick={() => navigate("/profile")}>Профиль</button>
              <span style={s.company}>{user?.company || "Нет названия"}</span>
            </div>
          )}

          <button style={s.navButton} onClick={() => navigate("/cart")}>Корзина</button>

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
              <div style={s.mobileContactsContainer}>
                <div style={s.mobilePhoneText}>+7 930 665-32-71</div>
                <div style={s.mobileEmailText}>zakaz@zpnn.ru</div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div style={s.searchContainer}>
        <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "400px" }}>
          <div style={{ display: "flex", width: "100%" }}>
            <input
              type="text"
              placeholder="Поиск по названию или артикулу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={s.searchInput}
              onFocus={() => searchSuggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            <button type="submit" style={{ ...s.promoButton, marginLeft: "5px" }}>Найти</button>
          </div>

          <div style={{ ...s.searchMessage, opacity: showMessage ? 1 : 0, transition: "opacity 0.5s" }}>
            {searchMessage}
          </div>

          {showSuggestions && searchSuggestions.length > 0 && (
            <ul style={s.suggestionsList}>
              {searchSuggestions.map((item) => (
                <li
                  key={item.art}
                  style={s.suggestionItem}
                  onMouseDown={() => {
                    navigate(`/catalog/${item.company_slug}?highlight=${item.art}`);
                    setShowSuggestions(false);
                  }}
                >
                  {item.art} - {item.name} ({item.company_name})
                </li>
              ))}
            </ul>
          )}
        </form>
      </div>

      <section style={s.hero}>
        <div style={s.heroContent}>
          <h2 style={s.heroTitle}>ЗАПЧАСТИ ДЛЯ СПЕЦТЕХНИКИ</h2>
          <p style={s.heroText}>ЛЮБАЯ ДЕТАЛЬ В ЛЮБУЮ ТОЧКУ РОССИИ</p>
          <div style={s.buttons}>
            <button style={s.button} onClick={scrollToCatalog}>Каталог</button>
            <button style={s.button} onClick={() => setShowCallbackModal(true)}>Обратный звонок</button>
          </div>
          <div style={s.photoBanner}>
            <img src={heroImages[currentSlide]} alt={`slide-${currentSlide}`} style={s.sliderImage} />
            <button style={s.navButtonLeft} onClick={prevSlide}>❮</button>
            <button style={s.navButtonRight} onClick={nextSlide}>❯</button>
            <div style={s.dots}>
              {heroImages.map((_, i) => (
                <span
                  key={i}
                  style={{ ...s.dot, backgroundColor: i === currentSlide ? "#ffcc00" : "#555" }}
                  onClick={() => setCurrentSlide(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={s.catalogSection} ref={catalogRef}>
        <div style={s.catalog}>
          <h3 style={s.catalogTitle}>Каталог</h3>
          <div style={s.catalogGrid}>
            {catalogItems.map((item, index) => (
              <div key={index} style={s.catalogItem} onClick={() => navigate(item.url)}>
                <img src={item.src} alt={`item-${index}`} style={s.catalogImg} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={s.productsSection}>
        <div style={s.productsGallery}>
          {productPhotos.map((photo, index) => (
            <img key={index} src={photo} alt={`product-${index}`} style={s.productPhoto} />
          ))}
        </div>
      </section>

      {showCallbackModal && (
        <div style={s.modalOverlay} onClick={() => !callbackLoading && setShowCallbackModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Обратный звонок</h2>
            <p style={s.modalText}>Введите ваше имя и номер телефона, и мы вам перезвоним</p>

            <input
              type="text"
              value={callbackName}
              onChange={handleCallbackNameChange}
              style={s.modalInput}
              placeholder="Имя"
              disabled={callbackLoading}
            />
            <input
              type="tel"
              value={callbackPhone}
              onChange={handleCallbackPhoneChange}
              style={s.modalInput}
              placeholder="Номер телефона"
              disabled={callbackLoading}
            />

            {callbackError && <div style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>{callbackError}</div>}
            {callbackSuccess && <div style={{ color: "limegreen", fontSize: "14px", marginBottom: "10px" }}>{callbackSuccess}</div>}

            <div style={s.modalButtons}>
              <button style={s.modalSubmitBtn} onClick={handleCallbackSubmit} disabled={callbackLoading}>
                {callbackLoading ? "Отправка..." : "Отправить"}
              </button>
              <button style={s.modalCancelBtn} onClick={() => setShowCallbackModal(false)} disabled={callbackLoading}>
                Отмена
              </button>
            </div>

            <button style={s.modalClose} onClick={() => setShowCallbackModal(false)} disabled={callbackLoading}>×</button>
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

export const styles = (mobile) => ({
  page: { backgroundColor: "#1c1c1c", color: "white", fontFamily: "Arial, sans-serif", minHeight: "100vh", width: "100%", overflowX: "hidden" },
  header: { display: "flex", flexDirection: mobile ? "column" : "row", alignItems: "center", justifyContent: "space-between", padding: mobile ? "10px" : "10px 40px", backgroundColor: "#2a2a2a", gap: "10px", position: "relative" },
  headerLeft: { display: "flex", alignItems: "center", gap: "20px" },
  logoSection: { display: "flex", alignItems: "center", gap: mobile ? "10px" : "15px", cursor: "pointer" },
  logoImage: { width: mobile ? "100px" : "150px", height: "auto", objectFit: "contain" },
  logoText: { display: "flex", flexDirection: "column" },
  logoTitle: { margin: 0, color: "#ffcc00", fontSize: mobile ? "22px" : "30px" },
  headerRight: { display: "flex", alignItems: "center", gap: mobile ? "8px" : "20px", flexWrap: "wrap", justifyContent: "center" },
  
  phoneSection: { display: "flex", flexDirection: "row", alignItems: "center", gap: "12px", color: "white", fontSize: "14px" },
  phoneContent: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  phoneSub: { color: "#ccc", fontSize: "12px" },
  
  mobileContactBlock: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "100%", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #444" },
  mobileIconsContainer: { display: "flex", gap: "8px", alignItems: "center" },
  mobileIconButton: { background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" },
  mobileTelegramLink: { display: "flex", textDecoration: "none" },
  mobileTelegramIcon: { width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" },
  mobileContactsContainer: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" },
  mobilePhoneText: { color: "#ffcc00", fontWeight: "bold", fontSize: "13px" },
  mobileEmailText: { color: "#ccc", fontSize: "11px" },
  
  headerPhotoLink: { display: "flex", textDecoration: "none" },
  headerPhoto: { width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", cursor: "pointer", transition: "transform 0.2s" },
  headerIcon: { width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", cursor: "pointer", transition: "transform 0.2s" },
  iconButton: { background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" },
  promoButton: { backgroundColor: "#ffcc00", border: "none", padding: "8px 16px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", color: "#1c1c1c" },
  navButton: { backgroundColor: "#ffcc00", border: "none", padding: mobile ? "8px 12px" : "8px 16px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", color: "#1c1c1c", whiteSpace: "nowrap", fontSize: mobile ? "12px" : "14px" },
  profileContainer: { display: "flex", flexDirection: "column", alignItems: "center", position: "relative" },
  company: { fontSize: "11px", color: "#ffcc00", fontWeight: "500", textAlign: "center", whiteSpace: "nowrap", position: "absolute", top: "100%", marginTop: "4px", left: "50%", transform: "translateX(-50%)" },
  searchContainer: { display: "flex", justifyContent: "center", padding: "15px 10px", backgroundColor: "#222" },
  searchInput: { width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #444", backgroundColor: "#1c1c1c", color: "white", fontSize: "14px" },
  searchMessage: { color: "#ffcc00", marginTop: "5px", fontSize: "14px", textAlign: "center" },
  suggestionsList: { listStyle: "none", padding: "5px", margin: "5px 0 0 0", backgroundColor: "#333", borderRadius: "5px", maxHeight: "200px", overflowY: "auto" },
  suggestionItem: { padding: "8px", cursor: "pointer", borderBottom: "1px solid #444", color: "white" },
  hero: { textAlign: "center", marginBottom: "60px" },
  heroContent: { width: "100%", maxWidth: "1200px", margin: "0 auto", padding: mobile ? "30px 10px" : "60px 20px 40px", position: "relative" },
  heroTitle: { fontSize: mobile ? "24px" : "40px", marginBottom: "10px" },
  heroText: { color: "#ccc", fontSize: mobile ? "14px" : "18px", marginBottom: "20px" },
  buttons: { display: "flex", flexDirection: mobile ? "column" : "row", justifyContent: "center", gap: "10px", marginBottom: "30px" },
  button: { backgroundColor: "#ffcc00", border: "none", padding: mobile ? "10px 14px" : "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: mobile ? "14px" : "16px", fontWeight: "bold" },
  photoBanner: { position: "relative", width: "100%", height: mobile ? "200px" : "600px", backgroundColor: "#444", borderRadius: "10px", overflow: "hidden" },
  sliderImage: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px", transition: "opacity 0.5s" },
  navButtonLeft: { position: "absolute", top: "50%", left: "10px", transform: "translateY(-50%)", backgroundColor: "rgba(0,0,0,0.4)", color: "white", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", fontSize: "20px" },
  navButtonRight: { position: "absolute", top: "50%", right: "10px", transform: "translateY(-50%)", backgroundColor: "rgba(0,0,0,0.4)", color: "white", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", fontSize: "20px" },
  dots: { position: "absolute", bottom: "15px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px" },
  dot: { width: "12px", height: "12px", borderRadius: "50%", cursor: "pointer", transition: "background-color 0.3s" },
  catalogSection: { display: "flex", justifyContent: "center", width: "100%", marginBottom: "60px" },
  catalog: { width: "1200px", maxWidth: "95%" },
  catalogTitle: { fontSize: "28px", marginBottom: "20px", textAlign: "left" },
  catalogGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" },
  catalogItem: { backgroundColor: "#2a2a2a", borderRadius: "10px", overflow: "hidden", cursor: "pointer", aspectRatio: "16/9" },
  catalogImg: { width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "10px" },
  productsSection: { display: "flex", justifyContent: "center", padding: "60px 20px", backgroundColor: "#1c1c1c", width: "100%" },
  productsGallery: { display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: mobile ? "15px" : "25px", maxWidth: "1400px" },
  productPhoto: { width: mobile ? "120px" : "200px", height: mobile ? "120px" : "200px", objectFit: "cover", borderRadius: "8px" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#2a2a2a", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", maxWidth: "400px", width: "90%", position: "relative" },
  modalTitle: { margin: "0 0 15px 0", fontSize: "24px", color: "#ffcc00", fontWeight: "bold" },
  modalText: { color: "#ccc", fontSize: "14px", marginBottom: "20px" },
  modalInput: { width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "6px", border: "1px solid #444", backgroundColor: "#1c1c1c", color: "white", fontSize: "16px", boxSizing: "border-box" },
  modalButtons: { display: "flex", gap: "10px", justifyContent: "space-between" },
  modalSubmitBtn: { flex: 1, backgroundColor: "#ffcc00", color: "#1c1c1c", border: "none", padding: "12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
  modalCancelBtn: { flex: 1, backgroundColor: "#444", color: "white", border: "none", padding: "12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
  modalClose: { position: "absolute", top: "10px", right: "10px", backgroundColor: "transparent", border: "none", color: "#ffcc00", fontSize: "28px", cursor: "pointer", fontWeight: "bold" },
});