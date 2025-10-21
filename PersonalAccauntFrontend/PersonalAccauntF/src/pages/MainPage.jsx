import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function MainPage() {
  const navigate = useNavigate();
  const catalogRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        await axios.get(`${url}/api/verify/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const res = await axios.get(`${url}/api/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (error) {
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
                {user?.company ? (
                  <span style={s.company}>{user.company}</span>
                ) : (
                  <span style={s.company}>Нет названия</span>
                )}
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

      
      <section style={s.hero}>
        <div style={s.heroContent}>
          <h2 style={s.heroTitle}>ЗАПЧАСТИ ДЛЯ СПЕЦТЕХНИКИ</h2>
          <p style={s.heroText}>ЛЮБАЯ ДЕТАЛЬ В ЛЮБУЮ ТОЧКУ РОССИИ</p>

          <div style={s.buttons}>
            <button style={s.button} onClick={scrollToCatalog}>
              Каталог
            </button>
            <button style={s.button}>Обратный звонок</button>
          </div>

          <div style={s.photoBanner}>
            <img src={heroImages[currentSlide]} alt={`slide-${currentSlide}`} style={s.sliderImage} />
            <button style={s.navButtonLeft} onClick={prevSlide}>
              ❮
            </button>
            <button style={s.navButtonRight} onClick={nextSlide}>
              ❯
            </button>
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
                <img src={item.src} alt={`item-${index + 1}`} style={s.catalogImg} />
              </div>
            ))}
          </div>
        </div>
      </section>
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
  headerLeft: { display: "flex", alignItems: "center", gap: "20px" },
  logoSection: { display: "flex", alignItems: "center", gap: mobile ? "10px" : "15px", cursor: "pointer" },
  logoImage: { width: mobile ? "100px" : "150px", height: "auto", objectFit: "contain" },
  logoText: { display: "flex", flexDirection: "column" },
  logoTitle: { margin: 0, color: "#ffcc00", fontSize: mobile ? "22px" : "30px" },
  headerRight: { display: "flex", alignItems: "center", gap: "20px" },
  phoneSection: { display: "flex", flexDirection: "column", alignItems: "flex-end", color: "white", fontSize: "14px" },
  phoneSub: { color: "#ccc", fontSize: "12px" },
  promoButton: { backgroundColor: "#ffcc00", border: "none", padding: "8px 16px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", color: "#1c1c1c" },
  nav: { display: "flex", alignItems: "center", gap: "20px" },
  profileContainer: { display: "flex", flexDirection: "column", alignItems: "center", position: "relative" },
  navButton: { backgroundColor: "#ffcc00", border: "none", padding: "8px 16px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", color: "#1c1c1c", whiteSpace: "nowrap" },
  company: { fontSize: "11px", color: "#ffcc00", fontWeight: "500", textAlign: "center", whiteSpace: "nowrap", position: "absolute", top: "100%", marginTop: "4px", left: "50%", transform: "translateX(-50%)" },
  hero: { textAlign: "center", marginBottom: "60px" },
  heroContent: { width: "100%", maxWidth: "1200px", margin: "0 auto", padding: mobile ? "30px 10px" : "60px 20px 40px", position: "relative" },
  heroTitle: { fontSize: mobile ? "24px" : "40px", marginBottom: "10px" },
  heroText: { color: "#ccc", fontSize: mobile ? "14px" : "18px", marginBottom: "20px" },
  buttons: { display: "flex", flexDirection: mobile ? "column" : "row", justifyContent: "center", gap: "10px", marginBottom: "30px" },
  button: { backgroundColor: "#ffcc00", border: "none", padding: mobile ? "10px 14px" : "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: mobile ? "14px" : "16px", fontWeight: "bold" },
  photoBanner: { position: "relative", width: "100%", height: mobile ? "200px" : "600px", backgroundColor: "#444", borderRadius: "10px", overflow: "hidden" },
  sliderImage: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px", transition: "opacity 0.5s ease-in-out" },
  navButtonLeft: { position: "absolute", top: "50%", left: "10px", transform: "translateY(-50%)", backgroundColor: "rgba(0,0,0,0.4)", color: "white", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", fontSize: "20px" },
  navButtonRight: { position: "absolute", top: "50%", right: "10px", transform: "translateY(-50%)", backgroundColor: "rgba(0,0,0,0.4)", color: "white", border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", fontSize: "20px" },
  dots: { position: "absolute", bottom: "15px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px" },
  dot: { width: "12px", height: "12px", borderRadius: "50%", cursor: "pointer", transition: "background-color 0.3s ease" },
  catalogSection: { display: "flex", justifyContent: "center", width: "100%", marginBottom: "60px" },
  catalog: { width: "1200px", maxWidth: "95%" },
  catalogTitle: { fontSize: "28px", marginBottom: "20px", textAlign: "left" },
  catalogGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" },
  catalogItem: { backgroundColor: "#2a2a2a", borderRadius: "10px", overflow: "hidden", cursor: "pointer", aspectRatio: "16/9" },
  catalogImg: { width: "100%", height: "100%", objectFit: "cover", display: "block", borderRadius: "10px" },
});
