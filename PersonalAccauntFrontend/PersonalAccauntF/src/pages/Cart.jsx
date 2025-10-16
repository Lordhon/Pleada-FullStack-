import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PrivateEndpoint from "../func/privateendpoint.jsx";

import CryptoJS from "crypto-js";

function getKey() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; 
    const digest = CryptoJS.MD5(dateStr).toString();
    return digest;
}
const  url= 'http://localhost/'

export default function CartPage() {
    const navigate = useNavigate();
    const [cart, setCart] = useState({});
    const [showQuickOrder, setShowQuickOrder] = useState(false);
    const [phone, setPhone] = useState("+7");
    const [code, setCode] = useState("");
    const [awaitingCode, setAwaitingCode] = useState(false);

    const priceChecks = {
        price: 500000,
        price1: 200000,
        price2: 100000,
        price3: 0
    };

    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) setCart(JSON.parse(savedCart));

        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.backgroundColor = "#1c1c1c";
    }, []);

    const updateQuantity = (art, quantity) => {
        if (!quantity) return;
        let q = parseInt(quantity);
        if (isNaN(q) || q < 1) return;

        setCart(prev => {
            const maxStock = prev[art].kl;
            if (q > maxStock) q = maxStock;

            const updated = { ...prev, [art]: { ...prev[art], quantity: q } };
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
        });
    };

    const removeItem = (art) => {
        setCart(prev => {
            const updated = { ...prev };
            delete updated[art];
            localStorage.setItem("cart", JSON.stringify(updated));
            return updated;
        });
    };

    const cartItems = Object.values(cart);

    const calculateSum = (priceKey) => {
        return cartItems.reduce((sum, item) => sum + item[priceKey] * item.quantity, 0);
    };

    const retailSum = calculateSum('price3');
    let priceKey = 'price3';
    let levelName = 'Розница';
    let currentSum = retailSum;

    if (currentSum >= priceChecks.price2) {
        priceKey = 'price2';
        levelName = 'Мелкий опт';
        currentSum = calculateSum('price2');

        if (currentSum >= priceChecks.price1) {
            priceKey = 'price1';
            levelName = 'Средний опт';
            currentSum = calculateSum('price1');

            if (currentSum >= priceChecks.price) {
                priceKey = 'price';
                levelName = 'Крупный опт';
                currentSum = calculateSum('price');
            }
        }
    }

    const dynamicPrices = {};
    cartItems.forEach(item => {
        dynamicPrices[item.art] = item[priceKey];
    });

    const totalCartSum = currentSum;
    const currentPriceLevel = levelName;
    const totalSavings = retailSum - totalCartSum;

    const handleCheckout = () => {
        const token = localStorage.getItem("token");
        if (!token) setShowQuickOrder(true);
        else handleAuthenticatedOrder();
    };

    const handleQuickOrder = async () => {
        try {
            const cartWithSum = {
                items: cart,
                totalSum: totalCartSum,
                priceLevel: currentPriceLevel
            };

            const payload = awaitingCode
                ? { phone, cart: cartWithSum, code }
                : { phone, cart: cartWithSum };

            const res = await fetch(`${url}order/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
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

            const orderItems = cartItems.map(item => ({
                art: item.art,
                name: item.name,
                price: dynamicPrices[item.art],
                quantity: item.quantity,
                sum: dynamicPrices[item.art] * item.quantity
            }));

            const orderData = {
                user: { phone: phone },
                orderItems,
                totalSum: totalCartSum,
                priceLevel: currentPriceLevel,
                savings: totalSavings,
                orderDate: new Date().toISOString(),

            };
            
            await fetch(`${url}api/order-line/`,{
                    method: "POST",
                    headers:{
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(orderData),
                });
            
            


            console.log("JSON заказа (быстрый заказ):", JSON.stringify(orderData, null, 2));

            localStorage.setItem("currentOrder", JSON.stringify(orderData));
            localStorage.setItem("orderPhone", phone);
            if (data.token) localStorage.setItem("token", data.token);

            setShowQuickOrder(false);
            setAwaitingCode(false);
            navigate("/checkout");

        } catch (err) {
            console.error(err);
            alert(awaitingCode ? "Неверный код подтверждения" : "Не удалось отправить код подтверждения");
        }
    };

    const handleAuthenticatedOrder = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Токен не найден. Пожалуйста, авторизуйтесь.");
                return;
            }

            const cartWithSum = {
                items: cart,
                totalSum: totalCartSum,
                priceLevel: currentPriceLevel
            };

            const res = await fetch(`${url}api/order/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ cart: cartWithSum })
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

            const data = await res.json();
            const userPhone = data.phone;

            const orderItems = cartItems.map(item => ({
                art: item.art,
                name: item.name,
                price: dynamicPrices[item.art],
                quantity: item.quantity,
                sum: dynamicPrices[item.art] * item.quantity
            }));

            const orderData = {
                user: { phone: userPhone },
                items: orderItems,
                totalSum: totalCartSum,
                priceLevel: currentPriceLevel,
                savings: totalSavings,
                orderDate: new Date().toISOString(),

            };


            console.log("JSON заказа (авторизованный):", JSON.stringify(orderData, null, 2));

            localStorage.setItem("currentOrder", JSON.stringify(orderData));
            localStorage.setItem("orderPhone", data.phone);

            navigate("/checkout");
        } catch (err) {
            console.error(err);
            alert("Не удалось оформить заказ. Попробуйте еще раз.");
        }
    };

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <div style={styles.container}>
                    <div style={styles.headerContent}>
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
                        <PrivateEndpoint safeMode />
                    </div>
                </div>
            </header>

            <div style={styles.container}>
                <h1 style={styles.title}>Ваша корзина</h1>

                {cartItems.length === 0 ? (
                    <div style={styles.empty}>Корзина пуста</div>
                ) : (
                    <>
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                <tr>
                                    <th style={styles.th}>Артикул</th>
                                    <th style={styles.th}>Название</th>
                                    <th style={styles.th}>Цена (₽)</th>
                                    <th style={styles.th}>Количество</th>
                                    <th style={styles.th}>Сумма (₽)</th>
                                    <th style={styles.th}>Экономия</th>
                                    <th style={styles.th}>На складе</th>
                                    <th style={styles.th}></th>
                                </tr>
                                </thead>
                                <tbody>
                                {cartItems.map(item => {
                                    const dynamicPrice = dynamicPrices[item.art];
                                    const sumItem = dynamicPrice * item.quantity;
                                    const save = item.price3 * item.quantity - sumItem;

                                    return (
                                        <tr key={item.art} style={styles.tr}>
                                            <td style={styles.td}>{item.art}</td>
                                            <td style={styles.td}>{item.name}</td>
                                            <td style={styles.td}>{dynamicPrice.toLocaleString()}</td>
                                            <td style={styles.td}>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    min="1"
                                                    max={item.kl}
                                                    onChange={(e) => updateQuantity(item.art, e.target.value)}
                                                    style={styles.input}
                                                />
                                            </td>
                                            <td style={styles.td}>{sumItem.toLocaleString()}</td>
                                            <td style={{ ...styles.td, color: save > 0 ? "#0f0" : "#ccc" }}>
                                                {save > 0 ? `-${save.toLocaleString()}` : "-"}
                                            </td>
                                            <td style={styles.td}>{item.kl}</td>
                                            <td style={styles.td}>
                                                <button onClick={() => removeItem(item.art)} style={styles.removeBtn}>×</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        <div style={styles.summary}>
                            <h3 style={styles.summaryTitle}>Итого к оплате: {totalCartSum.toLocaleString()} ₽</h3>
                            <div style={styles.currentLevel}>
                                Текущий уровень цен: <strong>{currentPriceLevel}</strong>
                            </div>
                            {totalSavings > 0 && (
                                <div style={styles.savings}>
                                    Ваша экономия: <strong style={{ color: "#0f0" }}>{totalSavings.toLocaleString()} ₽</strong>
                                </div>
                            )}
                        </div>

                        <button style={styles.checkoutBtn} onClick={handleCheckout}>
                            Оформить заказ
                        </button>
                    </>
                )}
            </div>

            {showQuickOrder && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3>Быстрый заказ</h3>
                        {!awaitingCode ? (
                            <>
                                <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "15px" }}>
                                    Введите номер телефона для получения кода подтверждения
                                </p>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => {
                                        let val = e.target.value;
                                        if (!val.startsWith("+7")) val = "+7";
                                        val = "+7" + val.slice(2).replace(/\D/g, "");
                                        setPhone(val);
                                    }}
                                    maxLength={12}
                                    placeholder="+7XXXXXXXXXX"
                                    style={styles.phoneInput}
                                />
                            </>
                        ) : (
                            <>
                                <p style={{ fontSize: "14px", color: "#aaa", marginBottom: "15px" }}>
                                    Введите код подтверждения, отправленный на {phone}
                                </p>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    maxLength={6}
                                    style={styles.phoneInput}
                                />
                            </>
                        )}

                        <div style={{ marginTop: "15px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                            <button style={styles.modalBtn} onClick={handleQuickOrder}>
                                {!awaitingCode ? "Отправить код" : "Подтвердить код"}
                            </button>
                            <button style={styles.modalBtnCancel} onClick={() => { setShowQuickOrder(false); setAwaitingCode(false); }}>
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: { margin: 0, padding: 0, fontFamily: "Arial, sans-serif", color: "white", backgroundColor: "#1c1c1c", minHeight: "100vh" },
    header: { backgroundColor: "#2a2a2a", width: "100%", position: "sticky", top: 0, zIndex: 1000, boxShadow: "0 2px 10px rgba(0,0,0,0.3)" },
    container: { maxWidth: "1400px", margin: "0 auto", padding: "0 20px" },
    headerContent: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0", height: "80px" },
    logoSection: { display: "flex", alignItems: "center", gap: "20px" },
    logoImage: { width: "150px", height: "auto", objectFit: "contain" },
    logoText: { display: "flex", flexDirection: "column" },
    logoTitle: { margin: 0, color: "#ffcc00", fontSize: "24px", fontWeight: "bold" },
    logoSub: { fontSize: "12px", color: "#aaa", marginTop: "2px" },
    title: { fontSize: "32px", margin: "40px 0 30px", color: "#ffcc00", fontWeight: "bold" },
    empty: { fontSize: "18px", color: "#aaa", textAlign: "center", padding: "60px 20px" },
    tableWrapper: { overflowX: "auto", backgroundColor: "#2a2a2a", borderRadius: "8px", marginBottom: "30px" },
    table: { width: "100%", borderCollapse: "collapse", backgroundColor: "#2a2a2a", color: "white" },
    th: { padding: "15px 12px", textAlign: "left", borderBottom: "2px solid #444", fontWeight: "bold", fontSize: "14px", color: "#ffcc00" },
    tr: { borderBottom: "1px solid #333" },
    td: { padding: "15px 12px", fontSize: "14px", verticalAlign: "middle" },
    input: { width: "70px", padding: "8px", borderRadius: "4px", border: "1px solid #555", backgroundColor: "#1c1c1c", color: "white", fontSize: "14px", textAlign: "center" },
    removeBtn: { backgroundColor: "#ff4444", color: "white", border: "none", padding: "6px 12px", cursor: "pointer", borderRadius: "4px", fontSize: "18px", fontWeight: "bold", transition: "all 0.3s ease" },
    summary: { marginTop: "30px", backgroundColor: "#2a2a2a", padding: "25px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.2)" },
    summaryTitle: { margin: "0 0 15px 0", fontSize: "24px", color: "#fff" },
    currentLevel: { fontSize: "16px", marginBottom: "10px", color: "#ffcc00" },
    savings: { fontSize: "18px", marginBottom: "15px", fontWeight: "bold" },
    checkoutBtn: { marginTop: "30px", backgroundColor: "#ffcc00", color: "#1c1c1c", padding: "15px 40px", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px", fontWeight: "bold", transition: "all 0.3s ease", boxShadow: "0 4px 15px rgba(255, 204, 0, 0.3)" },
    modalOverlay: { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.7)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 },
    modal: { backgroundColor: "#2a2a2a", padding: "25px", borderRadius: "8px", width: "350px", textAlign: "center", color: "white" },
    phoneInput: { width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #555", backgroundColor: "#1c1c1c", color: "white", fontSize: "16px", textAlign: "center" },
    modalBtn: { backgroundColor: "#ffcc00", color: "#1c1c1c", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", transition: "all 0.3s ease" },
    modalBtnCancel: { backgroundColor: "#555", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", transition: "all 0.3s ease" }
};
