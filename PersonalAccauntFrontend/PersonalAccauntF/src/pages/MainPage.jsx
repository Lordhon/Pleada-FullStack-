import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrivateEndpoint from "../func/privateendpoint.jsx";

export default function MainPage() {
  const navigate = useNavigate();
  const catalogRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  const scrollToCatalog = () => {
    catalogRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const s = styles(isMobile);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.logoSection} onClick={() => navigate("/")}>
          <img src="/logo.png" alt="logo" style={s.logoImage} />
          {!isMobile && (
            <div style={s.logoText}>
              <h1 style={s.logoTitle}>ПЛЕЯДЫ</h1>
              <span style={s.logoSub}>ГРУППА КОМПАНИЙ</span>
            </div>
          )}
        </div>

        {!isMobile && (
          <div style={s.phoneSection}>
            +7 930 665-32-71
            <span style={s.phoneSub}>для связи по вопросам и заказам</span>
          </div>
        )}

        <PrivateEndpoint />
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
            <img
              src="/Komatsu1.jpg"
              alt="main"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "10px",
              }}
            />
          </div>
        </div>
      </section>

      <section style={s.catalogSection} ref={catalogRef}>
        <div style={s.catalog}>
          <h3 style={s.catalogTitle}>Каталог</h3>
          <div style={s.catalogGrid}>
            {catalogItems.map((item, index) => (
              <div
                key={index}
                style={s.catalogItem}
                onClick={() => navigate(item.url)}
              >
                <img
                  src={item.src}
                  alt={`item-${index + 1}`}
                  style={s.catalogImg}
                />
              </div>
            ))}
          </div>
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
    width: "100%",
    overflowX: "hidden",
  },
  header: {
    backgroundColor: "#2a2a2a",
    display: "flex",
    flexDirection: mobile ? "column" : "row",
    justifyContent: mobile ? "center" : "space-between",
    alignItems: "center",
    padding: mobile ? "10px" : "10px 30px",
    gap: mobile ? "10px" : "0",
    height: mobile ? "auto" : "80px",
    textAlign: "center",
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: mobile ? "center" : "flex-start",
    gap: mobile ? "10px" : "20px",
    cursor: "pointer",
  },
  logoImage: {
    width: mobile ? "100px" : "150px",
    height: "auto",
    objectFit: "contain",
  },
  logoText: { display: "flex", flexDirection: "column" },
  logoTitle: {
    margin: 0,
    color: "#ffcc00",
    fontSize: mobile ? "22px" : "30px",
  },
  logoSub: { fontSize: "12px", color: "#aaa" },
  phoneSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: mobile ? "center" : "flex-end",
    marginRight: mobile ? "0" : "20px",
  },
  phoneSub: {
    color: "#ccc",
    fontSize: "12px",
  },
  hero: { textAlign: "center", marginBottom: "60px" },
  heroContent: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    padding: mobile ? "30px 10px" : "60px 20px 40px",
  },
  heroTitle: {
    fontSize: mobile ? "24px" : "40px",
    marginBottom: "10px",
  },
  heroText: {
    color: "#ccc",
    fontSize: mobile ? "14px" : "18px",
    marginBottom: "20px",
  },
  buttons: {
    display: "flex",
    flexDirection: mobile ? "column" : "row",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "30px",
  },
  button: {
    backgroundColor: "#ffcc00",
    border: "none",
    padding: mobile ? "10px 14px" : "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: mobile ? "14px" : "16px",
    fontWeight: "bold",
  },
  photoBanner: {
    width: "100%",
    height: mobile ? "200px" : "600px",
    backgroundColor: "#444",
    borderRadius: "10px",
    overflow: "hidden",
  },
  catalogSection: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
    marginBottom: "60px",
  },
  catalog: { width: "1200px", maxWidth: "95%" },
  catalogTitle: {
    fontSize: "28px",
    marginBottom: "20px",
    textAlign: "left",
  },
  catalogGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },
  catalogItem: {
    backgroundColor: "#2a2a2a",
    borderRadius: "10px",
    overflow: "hidden",
    cursor: "pointer",
    aspectRatio: "16/9",
  },
  catalogImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    borderRadius: "10px",
  },
});
