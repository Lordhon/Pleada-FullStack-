import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { styles } from "./MainPage";

export default function PromoPage({ onEmailClick }) {
  const navigate = useNavigate();
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [itemNames, setItemNames] = useState({});
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.backgroundColor = "#1c1c1c";
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const verifyAndFetchUser = async () => {
      try {
        await fetch(`${window.location.origin}/api/verify/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const res = await fetch(`${window.location.origin}/api/me/`, {
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
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${window.location.origin}/api/discounts/`);
      if (!response.ok) throw new Error("Ошибка загрузки акций");
      const data = await response.json();
      setDiscounts(data.list || []);
      setError(null);
      // Загружаем названия артикулов после загрузки скидок
      if (data.list) {
        loadArticleNames(data.list);
      }
    } catch (err) {
      setError(err.message);
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadArticleNames = async (discountsList) => {
    const names = {};
    for (const discount of discountsList) {
      if (discount.lsart) {
        const articles = discount.lsart.split(",").map(a => a.trim());
        for (const art of articles) {
          if (!names[art]) {
            try {
              const response = await fetch(`${window.location.origin}/api/search-help/?q=${art}`);
              if (response.ok) {
                const data = await response.json();
                // API возвращает массив, ищем точный артикул
                if (Array.isArray(data)) {
                  const foundItem = data.find(item => item.art === art);
                  names[art] = foundItem ? foundItem.name : (data[0]?.name || art);
                } else {
                  names[art] = data.name || art;
                }
              } else {
                names[art] = art;
              }
            } catch (err) {
              console.error(`Ошибка загрузки артикула ${art}:`, err);
              names[art] = art;
            }
          }
        }
      }
    }
    setItemNames(names);
  };

  const s = styles(isMobileView);
  const promoStyles = promoStyles_func(isMobileView);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#1c1c1c" }}>
      <Header 
        isMobile={isMobileView} 
        isAuthenticated={isAuthenticated} 
        userCompany={user?.company}
        onEmailClick={onEmailClick}
      />

      <div style={promoStyles.container}>
        <h1 style={promoStyles.title}>Действующие акции</h1>

        {loading && (
          <div style={promoStyles.message}>
            <p>Загрузка акций...</p>
          </div>
        )}

        {error && (
          <div style={promoStyles.error}>
            <p>Ошибка: {error}</p>
            <button onClick={fetchDiscounts} style={promoStyles.retryButton}>
              Попробовать снова
            </button>
          </div>
        )}

        {!loading && !error && discounts.length === 0 && (
          <div style={promoStyles.message}>
            <p>На данный момент нет активных акций</p>
          </div>
        )}

        {!loading && !error && discounts.length > 0 && (
          <div style={promoStyles.discountsGrid}>
            {discounts.map((discount) => (
              <div key={discount.id} style={promoStyles.discountCard}>
                <div style={promoStyles.cardTop}>
                  <div style={promoStyles.discountHeader}>
                    <span style={promoStyles.discountPercent}>{discount.dispr}%</span>
                  </div>
                  <div style={promoStyles.discountDates}>
                    <p style={promoStyles.dateLabel}>Действует до</p>
                    <p style={promoStyles.dateText}>{formatDate(discount.edt)}</p>
                  </div>
                </div>

                <div style={promoStyles.discountBody}>
                  {discount.allart === 1 ? (
                    <p style={promoStyles.discountText}>Скидка на все артикулы</p>
                  ) : discount.lsart ? (
                    <>
                      <p style={promoStyles.discountText}>Скидка на артикулы:</p>
                      <div style={promoStyles.articlesList}>
                        {discount.lsart.split(",").map((art) => {
                          const artTrimmed = art.trim();
                          const name = itemNames[artTrimmed];
                          return (
                            <div key={artTrimmed} style={promoStyles.articleItem}>
                              <span style={promoStyles.articleCode}>{artTrimmed}</span>
                              {name && (
                                <span style={promoStyles.articleName}>{name}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : null}
                </div>

                <div 
                  style={promoStyles.codeButton} 
                  onClick={() => {
                    const code = discount.dcode;
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(code).then(() => {
                        setCopiedId(discount.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }).catch(() => {
                        // Fallback для старых браузеров
                        fallbackCopy(code, discount.id);
                      });
                    } else {
                      fallbackCopy(code, discount.id);
                    }
                  }} 
                  title="Нажмите для копирования"
                >
                  {copiedId === discount.id ? '✓ Скопировано' : discount.dcode}
                </div>
              </div>
            ))}
          </div>
        )}


      </div>
    </div>
  );
}

const formatDate = (dateString) => {
  if (!dateString) return "неизвестно";
  const [year, month, day] = dateString.split("-");
  return `${day}.${month}.${year}`;
};

const fallbackCopy = (text, id) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    // Показываем уведомление
    const button = document.querySelector(`[data-code-id="${id}"]`);
    if (button) {
      button.textContent = '✓ Скопировано';
      setTimeout(() => {
        button.textContent = text;
      }, 2000);
    }
  } catch (err) {
    console.error("Ошибка копирования:", err);
  }
  document.body.removeChild(textarea);
};

const promoStyles_func = (mobile) => ({
  container: {
    flex: 1,
    padding: mobile ? "20px 12px" : "40px",
    maxWidth: mobile ? "100%" : "1200px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },
  title: {
    fontSize: mobile ? "24px" : "32px",
    color: "#ffcc00",
    marginBottom: "30px",
    textAlign: "center",
    fontWeight: "bold",
  },
  discountsGrid: {
    display: "grid",
    gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
    gap: mobile ? "15px" : "20px",
    marginBottom: "30px",
  },
  discountCard: {
    backgroundColor: "#2a2a2a",
    border: "none",
    borderRadius: "8px",
    padding: mobile ? "20px" : "30px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    transition: "transform 0.2s, box-shadow 0.2s",
    position: "relative",
    minHeight: mobile ? "140px" : "160px",
    paddingBottom: mobile ? "70px" : "80px",
    display: "flex",
    flexDirection: "column",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "10px",
    gap: "15px",
  },
  discountHeader: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: "0",
    paddingBottom: "0",
    borderBottom: "none",
    flex: 1,
  },
  codeContainer: {
    display: "none",
  },
  codeLabel: {
    display: "none",
  },
  discountPercent: {
    fontSize: mobile ? "32px" : "40px",
    fontWeight: "bold",
    color: "#ffcc00",
  },
  discountCode: {
    display: "none",
  },
  discountBody: {
    color: "#ffffff",
    flex: 1,
    minHeight: "0",
  },
  discountText: {
    margin: "4px 0",
    fontSize: mobile ? "15px" : "20px",
    color: "#ccc",
    fontWeight: "500",
  },
  articlesList: {
    margin: "8px 0",
    display: "flex",
    flexDirection: "column",
    gap: mobile ? "6px" : "8px",
  },
  articleItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: mobile ? "8px" : "12px",
    padding: mobile ? "6px" : "8px",
    backgroundColor: "rgba(255, 204, 0, 0.08)",
    borderRadius: "4px",
    borderLeft: "3px solid #ffcc00",
  },
  articleCode: {
    color: "#ffcc00",
    fontWeight: "bold",
    fontSize: mobile ? "13px" : "15px",
    minWidth: "fit-content",
    fontFamily: "monospace",
  },
  articleName: {
    color: "#ddd",
    fontSize: mobile ? "12px" : "14px",
    fontWeight: "400",
  },
  articleList: {
    display: "none",
  },
  discountDates: {
    position: "relative",
    bottom: "auto",
    left: "auto",
    right: "auto",
    marginTop: "0",
    paddingTop: "0",
    borderTop: "none",
    textAlign: "right",
    flexShrink: 0,
  },
  dateLabel: {
    margin: "0",
    fontSize: mobile ? "10px" : "11px",
    color: "#aaa",
    lineHeight: 1,
  },
  dateText: {
    margin: "2px 0 0 0",
    fontSize: mobile ? "12px" : "15px",
    color: "#ffcc00",
    lineHeight: 1.2,
    fontWeight: "bold",
  },
  codeButton: {
    position: "absolute",
    bottom: mobile ? "15px" : "20px",
    left: mobile ? "20px" : "30px",
    right: mobile ? "20px" : "30px",
    backgroundColor: "#ffcc00",
    border: "none",
    color: "#1c1c1c",
    padding: mobile ? "10px 15px" : "12px 18px",
    borderRadius: "6px",
    fontWeight: "bold",
    fontSize: mobile ? "14px" : "20px",
    cursor: "pointer",
    textAlign: "center",
    userSelect: "none",
    transition: "all 0.3s ease",
  },
  message: {
    textAlign: "center",
    color: "#aaa",
    padding: "40px 20px",
    fontSize: mobile ? "14px" : "16px",
  },
  error: {
    backgroundColor: "#4a2a2a",
    border: "2px solid #ff4444",
    borderRadius: "8px",
    padding: "20px",
    color: "#ff8888",
    textAlign: "center",
    marginBottom: "20px",
  },
  retryButton: {
    backgroundColor: "#ff4444",
    border: "none",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: "10px",
  },
  backButton: {
    backgroundColor: "#ffcc00",
    border: "none",
    padding: mobile ? "10px 20px" : "12px 24px",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#1c1c1c",
    fontSize: mobile ? "14px" : "16px",
    display: "block",
    margin: "20px auto 0",
  },
});