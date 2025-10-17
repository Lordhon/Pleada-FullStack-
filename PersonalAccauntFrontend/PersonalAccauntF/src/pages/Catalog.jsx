import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PrivateEndpoint from "../func/privateendpoint.jsx";
const  url= location.origin;
export default function CatalogPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);

    const priceChecks = {
        price: 500000,
        price1: 200000,
        price2: 100000,
        price3: 0,
    };


    useEffect(() => {
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.backgroundColor = "#1c1c1c";
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
            .then(setItems)
            .catch((err) => console.error("Ошибка загрузки:", err))
            .finally(() => setLoading(false));
    }, [slug]);

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


    const {
        currentLevel,
        nextLevelRemaining,
        dynamicPrices,
        totalCartSum,
        currentLevelKey,
    } = (() => {
        const cartItems = Object.values(cart);
        const calculateSum = (priceKey) => cartItems.reduce((sum, item) => sum + item[priceKey] * item.quantity, 0);

        let levelKey = "price3";
        let levelName = "Розница";
        let currentSum = calculateSum("price3");

        if (currentSum >= priceChecks.price2) {
            levelKey = "price2";
            levelName = "Мелкий опт";
            currentSum = calculateSum("price2");

            if (currentSum >= priceChecks.price1) {
                levelKey = "price1";
                levelName = "Средний опт";
                currentSum = calculateSum("price1");

                if (currentSum >= priceChecks.price) {
                    levelKey = "price";
                    levelName = "Крупный опт";
                    currentSum = calculateSum("price");
                }
            }
        }

        const dynamicPricesObj = {};
        cartItems.forEach((item) => {
            dynamicPricesObj[item.art] = item[levelKey];
        });

        let nextRemaining = 0;
        if (levelKey === "price3") nextRemaining = priceChecks.price2 - currentSum;
        else if (levelKey === "price2") nextRemaining = priceChecks.price1 - currentSum;
        else if (levelKey === "price1") nextRemaining = priceChecks.price - currentSum;
        nextRemaining = nextRemaining > 0 ? nextRemaining : 0;

        return {
            currentLevel: levelName,
            nextLevelRemaining: nextRemaining,
            dynamicPrices: dynamicPricesObj,
            totalCartSum: currentSum,
            currentLevelKey: levelKey,
        };
    })();

    if (loading) return <div style={styles.loading}>Загрузка...</div>;

    return (
        <div style={styles.page}>
            <header style={styles.header}>

                <div
                    style={{ ...styles.logoSection, cursor: "pointer" }}
                    onClick={() => navigate("/")}
                >
                    <img src="/logo.png" alt="logo" style={styles.logoImage} />
                    <div style={styles.logoText}>
                        <h1 style={styles.logoTitle}>ПЛЕЯДЫ</h1>
                        <span style={styles.logoSub}>ГРУППА КОМПАНИЙ</span>
                    </div>
                </div>


                <PrivateEndpoint />
            </header>

            <section style={styles.content}>
                <h1 style={styles.title}>Каталог: {slug?.toUpperCase()}</h1>
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.tableHeader}>Артикул</th>
                            <th style={styles.tableHeader}>Название</th>
                            <th style={styles.tableHeader}>Крупный опт</th>
                            <th style={styles.tableHeader}>Средний опт</th>
                            <th style={styles.tableHeader}>Мелкий опт</th>
                            <th style={styles.tableHeader}>Розница</th>
                            <th style={styles.tableHeader}>Кол-во</th>
                            <th style={styles.tableHeader}></th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.length > 0 ? (
                            items.map((item, index) => (
                                <tr
                                    key={item.art}
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
                                                        marginTop: "4px",
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
                                                style={styles.addButton}
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
                                                    style={styles.quantityInput}
                                                />
                                                <button
                                                    style={styles.removeButton}
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

                <div style={{ marginTop: "20px", color: "#ffcc00" }}>
                    <h3>Текущий уровень цен: {currentLevel}</h3>
                    <h3>Сумма корзины: {totalCartSum.toLocaleString()} ₽</h3>
                    {nextLevelRemaining > 0 && (
                        <h4 style={{ color: "#4CAF50" }}>
                            До следующего уровня осталось: {nextLevelRemaining.toLocaleString()} ₽
                        </h4>
                    )}
                </div>
            </section>
        </div>
    );
}

const styles = {
    page: { backgroundColor: "#1c1c1c", color: "white", fontFamily: "Arial, sans-serif", minHeight: "100vh" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 30px", backgroundColor: "#2a2a2a", height: "80px" },
    logoSection: { display: "flex", alignItems: "center", gap: "20px" },
    logoImage: { width: "150px", height: "auto", objectFit: "contain" },
    logoText: { display: "flex", flexDirection: "column" },
    logoTitle: { margin: 0, color: "#ffcc00", fontSize: "30px" },
    logoSub: { fontSize: "14px", color: "#aaa" },
    content: { padding: "40px 30px", maxWidth: "1400px", margin: "0 auto" },
    title: { fontSize: "32px", marginBottom: "30px", color: "#ffcc00", textAlign: "center" },
    tableContainer: { overflowX: "auto", borderRadius: "10px", border: "1px solid #444" },
    table: { width: "100%", borderCollapse: "collapse", backgroundColor: "#2a2a2a" },
    tableHeaderRow: { backgroundColor: "#ffcc00" },
    tableHeader: { padding: "15px 8px", textAlign: "left", fontWeight: "bold", color: "#1c1c1c", borderBottom: "2px solid #444" },
    tableRow: { borderBottom: "1px solid #444" },
    tableCell: { padding: "12px 8px", borderRight: "1px solid #444", color: "#eee" },
    actionCell: { padding: "8px", borderRight: "1px solid #444", width: "120px" },
    noDataCell: { padding: "40px", textAlign: "center", color: "#aaa" },
    loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", color: "#ffcc00" },
    addButton: { backgroundColor: "#ffcc00", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", color: "#1c1c1c", width: "100%" },
    quantityContainer: { display: "flex", alignItems: "center", gap: "4px", justifyContent: "space-between" },
    quantityInput: { width: "60px", padding: "4px", borderRadius: "3px", border: "1px solid #555", backgroundColor: "#1c1c1c", color: "white", textAlign: "center" },
    removeButton: { backgroundColor: "#ff4444", border: "none", width: "25px", height: "25px", borderRadius: "3px", cursor: "pointer", fontWeight: "bold", color: "white", display: "flex", alignItems: "center", justifyContent: "center" },
};
