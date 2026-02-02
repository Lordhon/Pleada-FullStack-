import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useCartTotals from "../hooks/useCartTotals";

export default function Header({ isMobile, isAuthenticated, userCompany, onEmailClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const cartTotal = useCartTotals();
  const isCartPage = location.pathname === "/cart";
  const isProfilePage = location.pathname === "/profile";
  const isPromoPage = location.pathname === "/promo";

  const s = headerStyles(isMobile);

  return (
    <header style={s.header}>
      {!isMobile ? (
        <div style={s.headerLeft}>
          <div style={s.logoSection} onClick={() => navigate("/")} title="На главную">
            <img src="/logo.png" alt="logo" style={s.logoImage} />
            <div style={s.logoText}>
              <h1 style={s.logoTitle}>ПЛЕЯДЫ</h1>
            </div>
          </div>
          <button style={s.promoButtonWithIcon} onClick={() => navigate("/promo")}>
            Акции <span style={{ marginLeft: 6 }}></span>
          </button>
        </div>
      ) : (
        <>
          <div style={s.headerTopRow}>
            <div style={s.logoSection} onClick={() => navigate("/")} title="На главную">
              <img src="/logo.png" alt="logo" style={s.logoImage} />
            </div>
          </div>
          <div style={s.mobileButtonsRow}>
            <button style={s.promoButtonWithIcon} onClick={() => navigate("/promo")}>
              Акции <span style={{ marginLeft: 6 }}></span>
            </button>
            
            {!isAuthenticated ? (
              <button style={s.navButton} onClick={() => navigate("/login")}>
                Войти
              </button>
            ) : (
              <div style={s.profileContainer}>
                <button style={s.navButton} onClick={() => navigate("/profile")}>
                  Профиль
                </button>
                <span style={s.company}>{userCompany || "Нет названия"}</span>
              </div>
            )}

            {!isCartPage && !isPromoPage && (
              <div style={{ position: "relative" }}>
                <button style={s.navButton} onClick={() => navigate("/cart")}>
                  Корзина
                </button>
                {cartTotal > 0 && (
                  <div style={s.cartBadge}>
                    <div style={s.cartCount}>{cartTotal}</div>
                  </div>
                )}
              </div>
            )}

            {isCartPage && (
              <button style={s.navButton} onClick={() => navigate("/")}>
                Каталог
              </button>
            )}

            {isPromoPage && (
              <>
                <button style={s.navButton} onClick={() => navigate("/")}>
                  Каталог
                </button>
                <div style={{ position: "relative" }}>
                  <button style={s.navButton} onClick={() => navigate("/cart")}>
                    Корзина
                  </button>
                  {cartTotal > 0 && (
                    <div style={s.cartBadge}>
                      <div style={s.cartCount}>{cartTotal}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div style={s.headerRight}>
        {!isMobile && (
          <>
            <div style={s.phoneSection}>
              <button
                style={s.iconButton}
                onClick={onEmailClick}
                title="Написать письмо"
              >
                <img src="/email.png" alt="email" style={s.headerIcon} />
              </button>
              <a href="https://t.me/zapchasticpectex" style={s.headerPhotoLink}>
                <img src="/telega.png" alt="Telegram" style={s.headerPhoto} />
              </a>
              <div style={s.phoneContent}>
                <div>+7 930 665-32-71</div>
                <div>zakaz@zpnn.ru</div>
                <span style={s.phoneSub}>для связи по вопросам и заказам</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {!isAuthenticated ? (
                <button style={s.navButton} onClick={() => navigate("/login")}>
                  Войти
                </button>
              ) : (
                <div style={s.profileContainer}>
                  <button style={s.navButton} onClick={() => navigate("/profile")}>
                    Профиль
                  </button>
                  <span style={s.company}>{userCompany || "Нет названия"}</span>
                </div>
              )}

              {!isCartPage && !isPromoPage && (
                <div style={{ position: "relative" }}>
                  <button style={s.navButton} onClick={() => navigate("/cart")}>
                    Корзина
                  </button>
                  {cartTotal > 0 && (
                    <div style={s.cartBadge}>
                      <div style={s.cartCount}>{cartTotal}</div>
                    </div>
                  )}
                </div>
              )}

              {isCartPage && (
                <button style={s.navButton} onClick={() => navigate("/")}>
                  Каталог
                </button>
              )}

              {isPromoPage && (
                <>
                  <button style={s.navButton} onClick={() => navigate("/")}>
                    Каталог
                  </button>
                  <div style={{ position: "relative" }}>
                    <button style={s.navButton} onClick={() => navigate("/cart")}>
                      Корзина
                    </button>
                    {cartTotal > 0 && (
                      <div style={s.cartBadge}>
                        <div style={s.cartCount}>{cartTotal}</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {isMobile && (
          <>
            <div style={s.mobileDivider}></div>
            <div style={s.mobileIconsRow}>
              <button
                style={s.mobileIconButton}
                onClick={onEmailClick}
                title="Написать письмо"
              >
                <img src="/email.png" alt="email" style={s.mobileTelegramIcon} />
              </button>
              <a
                href="https://t.me/zapchasticpectex"
                style={s.mobileTelegramLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/telega.png" alt="Telegram" style={s.mobileTelegramIcon} />
              </a>
            </div>
            <div style={s.mobileContactsContainer}>
              <a
                href="tel:+79306653271"
                style={{ ...s.mobilePhoneText, textDecoration: "none" }}
              >
                +7 930 665-32-71
              </a>
              <a
                href="mailto:zakaz@zpnn.ru"
                style={{ ...s.mobileEmailText, textDecoration: "none" }}
              >
                zakaz@zpnn.ru
              </a>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

const headerStyles = (mobile) => ({
  header: {
    display: "flex",
    flexDirection: mobile ? "column" : "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: mobile ? "10px 12px" : "10px 40px",
    backgroundColor: "#2a2a2a",
    gap: mobile ? "10px" : "12px",
    position: "relative",
    boxShadow: mobile ? "0 4px 16px rgba(0,0,0,0.35)" : "none",
    width: "100%",
    boxSizing: "border-box",
  },
  headerTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: mobile ? "center" : "space-between",
    width: "100%",
    gap: mobile ? "8px" : "12px",
    flexWrap: "nowrap",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    width: "auto",
    justifyContent: "flex-start",
    flexWrap: "nowrap",
  },
  mobileButtonsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    marginTop: mobile ? 8 : 0,
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: mobile ? 8 : 15,
    cursor: "pointer",
    flexShrink: 0,
    minWidth: 0,
  },
  logoImage: {
    width: mobile ? "80px" : "150px",
    height: "auto",
    objectFit: "contain",
    flexShrink: 0,
  },
  logoText: { display: "flex", flexDirection: "column" },
  logoTitle: { margin: 0, color: "#ffcc00", fontSize: mobile ? "22px" : "30px" },
  headerRight: {
    display: "flex",
    flexDirection: mobile ? "column" : "row",
    alignItems: mobile ? "flex-end" : "center",
    gap: mobile ? 8 : 20,
    flexWrap: "nowrap",
    justifyContent: mobile ? "flex-end" : "center",
    width: mobile ? "100%" : "auto",
  },
  phoneSection: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    color: "white",
    fontSize: 14,
  },
  phoneContent: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
  phoneSub: { color: "#ccc", fontSize: 12 },
  mobileDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#444",
    margin: "8px 0",
  },
  mobileIconsRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  mobileIconButton: {
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
    display: "flex",
  },
  mobileTelegramLink: { display: "flex", textDecoration: "none" },
  mobileTelegramIcon: {
    width: mobile ? 44 : 40,
    height: mobile ? 44 : 40,
    borderRadius: "50%",
    objectFit: "cover",
  },
  mobileContactsContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    width: "100%",
    textAlign: "center",
  },
  mobilePhoneText: { color: "#ffcc00", fontWeight: "bold", fontSize: 13 },
  mobileEmailText: { color: "#ccc", fontSize: 11 },
  headerPhotoLink: { display: "flex", textDecoration: "none" },
  headerPhoto: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    objectFit: "cover",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  headerIcon: {
    width: 60,
    height: 60,
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
  promoButtonWithIcon: {
    backgroundColor: "#ffcc00",
    border: "none",
    padding: mobile ? "6px 12px" : "8px 16px",
    borderRadius: 5,
    cursor: "pointer",
    fontWeight: "bold",
    color: "#1c1c1c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    whiteSpace: "nowrap",
    fontSize: mobile ? 12 : 14,
    flexShrink: 0,
  },
  navButton: {
    backgroundColor: "#ffcc00",
    border: "none",
    padding: mobile ? "6px 12px" : "8px 16px",
    borderRadius: 5,
    cursor: "pointer",
    fontWeight: "bold",
    color: "#1c1c1c",
    whiteSpace: "nowrap",
    fontSize: mobile ? 12 : 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff4444",
    borderRadius: "50%",
    width: 20,
    height: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
  },
  cartCount: { fontSize: 12, fontWeight: "bold", color: "#fff", lineHeight: 1 },
  profileContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
  },
  company: {
    fontSize: 11,
    color: "#ffcc00",
    fontWeight: 500,
    textAlign: "center",
    whiteSpace: "nowrap",
    position: "absolute",
    top: "100%",
    marginTop: 4,
    left: "50%",
    transform: "translateX(-50%)",
  },
});