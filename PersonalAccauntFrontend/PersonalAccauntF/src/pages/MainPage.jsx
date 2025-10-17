import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PrivateEndpoint from "../func/privateendpoint.jsx";

export default function MainPage() {
    const navigate = useNavigate();
    const mainPhoto = "/Komatsu1.jpg";
    const catalogRef = useRef(null);

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
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.backgroundColor = "#1c1c1c";
    }, []);

    const scrollToCatalog = () => {
        catalogRef.current.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div style={styles.page}>
            
            <header style={styles.header}>
                <div
                    style={styles.logoSection}
                    onClick={() => navigate("/")}
                >
                    <img src="/logo.png" alt="logo" style={styles.logoImage} />
                    <div style={styles.logoText}>
                        <h1 style={styles.logoTitle}>ПЛЕЯДЫ</h1>
                        <span style={styles.logoSub}>ГРУППА КОМПАНИЙ</span>
                    </div>
                </div>

               
                <div style={styles.phoneSection}>
                         +7 930 665-32-71
                    <span style={styles.phoneSub}>
                        для связи по вопросам и заказам
                    </span>
                </div>

                <PrivateEndpoint />
            </header>

            
            <section style={styles.hero}>
                <div style={styles.heroContent}>
                    <h2 style={styles.heroTitle}>ЗАПЧАСТИ ДЛЯ СПЕЦТЕХНИКИ</h2>
                    <p style={styles.heroText}>ЛЮБАЯ ДЕТАЛЬ В ЛЮБУЮ ТОЧКУ РОССИИ</p>

                    <div style={styles.buttons}>
                        <button style={styles.button} onClick={scrollToCatalog}>
                            Перейти в каталог
                        </button>
                        <button style={styles.button}>Обратный звонок</button>
                    </div>

                    <div style={styles.photoBanner}>
                        {mainPhoto ? (
                            <img
                                src={mainPhoto}
                                alt="main"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "10px",
                                }}
                            />
                        ) : (
                            <span style={{ color: "#aaa" }}>photo</span>
                        )}
                    </div>
                </div>
            </section>

            
            <section style={styles.catalogSection} ref={catalogRef}>
                <div style={styles.catalog}>
                    <h3 style={styles.catalogTitle}>Каталог</h3>
                    <div style={styles.catalogGrid}>
                        {catalogItems.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    ...styles.catalogItem,
                                    paddingTop: "56.25%",
                                    position: "relative",
                                }}
                                onClick={() => navigate(item.url)}
                            >
                                <img
                                    src={item.src}
                                    alt={`item-${index + 1}`}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: "10px",
                                    }}
                                />
                            </div>
                        ))}
                    </div>
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
        width: "100%",
        overflowX: "hidden",
    },
    header: {
        backgroundColor: "#2a2a2a",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 30px",
        height: "80px",
    },
    logoSection: {
        display: "flex",
        alignItems: "center",
        gap: "20px",
        minHeight: "100%",
        cursor: "pointer",
    },
    logoImage: {
        width: "150px",
        height: "auto",
        objectFit: "contain",
    },
    logoText: { display: "flex", flexDirection: "column" },
    logoTitle: { margin: 0, color: "#ffcc00", fontSize: "30px" },
    logoSub: { fontSize: "14px", color: "#aaa" },

    phoneSection: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        marginRight: "20px",
    },
    phoneNumber: {
        color: "#ffcc00",
        fontSize: "18px",
        fontWeight: "bold",
        textDecoration: "none",
    },
    phoneSub: {
        color: "#ccc",
        fontSize: "12px",
        marginTop: "2px",
    },

    button: {
        backgroundColor: "#ffcc00",
        border: "none",
        padding: "8px 16px",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
    },
    hero: { textAlign: "center", marginBottom: "60px" },
    heroContent: {
        width: "1200px",
        maxWidth: "95%",
        margin: "0 auto",
        padding: "60px 20px 40px",
    },
    heroTitle: { fontSize: "40px", marginBottom: "10px" },
    heroText: { color: "#ccc", marginBottom: "30px" },
    buttons: {
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        marginBottom: "40px",
    },
    photoBanner: {
        width: "100%",
        height: "600px",
        backgroundColor: "#444",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderRadius: "10px",
    },
    catalogSection: {
        display: "flex",
        justifyContent: "center",
        width: "100%",
        marginBottom: "60px",
    },
    catalog: { width: "1200px", maxWidth: "95%" },
    catalogTitle: { fontSize: "28px", marginBottom: "20px", textAlign: "left" },
    catalogGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
    },
    catalogItem: {
        backgroundColor: "#2a2a2a",
        borderRadius: "10px",
        color: "#bbb",
        cursor: "pointer",
        overflow: "hidden",
    },
};
