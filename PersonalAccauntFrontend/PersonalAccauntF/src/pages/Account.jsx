import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const formatPrice = (value) => {
  const numericValue = Number(value ?? 0);
  const truncated = Math.trunc(numericValue * 100) / 100;
  return truncated.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const priceGroups = [
  { id: 30, key: "jcb", label: "JCB" },
  { id: 43, key: "terex", label: "Terex" },
  { id: 40, key: "komatsu", label: "Komatsu" },
  { id: 41, key: "case", label: "CASE" },
  { id: 38, key: "caterpillar", label: "Caterpillar" },
  { id: 44, key: "mst", label: "MST" },
  { id: 32, key: "bobcat", label: "Bobcat" },
  { id: 42, key: "volvo", label: "Volvo" },
  { id: 25, key: "hidromek", label: "Hidromek" },
  { id: 15, key: "mksm", label: "MKSM" },
  { id: 19, key: "lokust", label: "Lokust" },
];
import useCartTotals from "../hooks/useCartTotals";

export default function AccountPage() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [user, setUser] = useState(null);
  const [inns, setInns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInn, setSelectedInn] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAddInn, setShowAddInn] = useState(false);
  const [newInn, setNewInn] = useState("");
  const [addingInn, setAddingInn] = useState(false);
  const [deletingInn, setDeletingInn] = useState(null);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailName, setEmailName] = useState("");
  const [emailPhone, setEmailPhone] = useState("+7");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedPriceGroups, setSelectedPriceGroups] = useState([]);
  const [priceError, setPriceError] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const cartTotal = useCartTotals();

  useEffect(() => {
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.backgroundColor = "#1c1c1c";
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const userRes = await axios.get(`${window.location.origin}/api/me/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data);

        const innsRes = await axios.get(
          `${window.location.origin}/api/lookInn/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const innsList = Array.isArray(innsRes.data) ? innsRes.data : [];
        setInns(innsList);

        const ordersRes = await axios.get(
          `${window.location.origin}/api/history-orders/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setOrders(ordersRes.data.ord || []);
        setError("");
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setError("Ошибка при загрузке данных");
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndOrders();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleAddInn = async () => {
    if (!newInn.trim()) {
      setError("Введите ИНН");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      setAddingInn(true);
      await axios.post(
        `${window.location.origin}/api/add-inn/`,
        { inn: newInn },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const currentInns = Array.isArray(inns) ? inns : [];
      setInns([...currentInns, { inn: newInn, company: "Загрузка..." }]);
      setNewInn("");
      setShowAddInn(false);

      setTimeout(() => {
        axios
          .get(`${window.location.origin}/api/lookInn/`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            const innsList = Array.isArray(res.data) ? res.data : [];
            setInns(innsList);
          })
          .catch((err) => console.error("Ошибка при обновлении ИНН:", err));
      }, 2000);
    } catch (err) {
      console.error("Ошибка добавления ИНН:", err);
      setError(err.response?.data?.error || "Ошибка при добавлении ИНН");
    } finally {
      setAddingInn(false);
    }
  };

  const handleDeleteInn = async (innToDelete) => {
    if (!window.confirm(`Вы уверены, что хотите удалить ИНН ${innToDelete}?`)) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      setDeletingInn(innToDelete);
      await axios.delete(
        `${window.location.origin}/api/delete-inn/`,
        {
          data: { inn: innToDelete },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const currentInns = Array.isArray(inns) ? inns : [];
      setInns(currentInns.filter((item) => item.inn !== innToDelete));
      setError("");
    } catch (err) {
      console.error("Ошибка удаления ИНН:", err);
      setError(err.response?.data?.error || "Ошибка при удалении ИНН");
    } finally {
      setDeletingInn(null);
    }
  };

  const uniqueInns = [...new Set(orders.map((order) => order.binn))];
  const ordersForSelectedInn = selectedInn
    ? orders.filter((order) => order.binn === selectedInn)
    : [];

  const formatPhone = (val) => {
    if (!val) val = "+7";
    if (!val.startsWith("+7")) val = "+7" + val.replace(/\D/g, "").slice(1);
    return "+7" + val.slice(2).replace(/\D/g, "");
  };

  useEffect(() => {
    if (!user) return;
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
    setNameInput(user?.first_name || "");
    setNameSuccess("");
    setNameError("");
    setIsEditingName(false);
  }, [user]);

  const handleEmailPhoneChange = (e) => {
    setEmailPhone(formatPhone(e.target.value));
    setEmailError("");
    setEmailSuccess("");
  };

  const handleSendEmail = async () => {
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
        domen: location.origin,
      });

      setEmailSuccess("Спасибо! Ваше письмо отправлено. Мы свяжемся с вами в ближайшее время.");
      setEmailName("");
      setEmailPhone("+7");
      setEmailAddress("");
      setEmailMessage("");

      setTimeout(() => setShowEmailModal(false), 1500);
    } catch (err) {
      console.error("Ошибка при отправке письма:", err);
      setEmailError("Ошибка при отправке письма. Попробуйте еще раз.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleStartEditName = () => {
    setNameInput(user?.first_name || "");
    setNameError("");
    setNameSuccess("");
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setNameInput(user?.first_name || "");
    setNameError("");
    setNameSuccess("");
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError("Имя не может быть пустым");
      setNameSuccess("");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setNameError("Требуется авторизация");
      setNameSuccess("");
      return;
    }

    setNameSaving(true);
    setNameError("");
    setNameSuccess("");
    try {
      await axios.post(
        `${window.location.origin}/api/Rename-name/`,
        { name: trimmed },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUser((prev) => (prev ? { ...prev, first_name: trimmed } : prev));
      setNameSuccess("Имя успешно обновлено");
      setIsEditingName(false);
    } catch (err) {
      console.error("Ошибка обновления имени:", err);
      setNameError(
        err.response?.data?.error ||
          "Не удалось обновить имя. Попробуйте ещё раз."
      );
    } finally {
      setNameSaving(false);
    }
  };

  useEffect(() => {
    if (showPriceModal) {
      const allIds = priceGroups.map((group) => group.id);
      setSelectedPriceGroups(allIds);
      setPriceError("");
    }
  }, [showPriceModal]);

  const togglePriceGroup = (id) => {
    setPriceError("");
    setSelectedPriceGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleDownloadPrices = () => {
    if (selectedPriceGroups.length === 0) {
      setPriceError("Выберите хотя бы одну компанию");
      return;
    }
    const groupsParam = selectedPriceGroups.join(",");
    const url = `${window.location.origin}/generate-price?groups=${groupsParam}`;
    window.open(url, "_blank");
    setShowPriceModal(false);
  };

  const s = styles(isMobile);

  if (loading) {
    return (
      <div style={s.page}>
        <header style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.logoSection} onClick={() => navigate("/")}>
              <img src="/logo.png" alt="logo" style={s.logoImage} />
              {!isMobile && <h1 style={s.logoTitle}>ПЛЕЯДЫ</h1>}
            </div>
          </div>
          <button style={s.navButton} onClick={() => navigate("/")}>
            На главную
          </button>
        </header>
        <div style={s.loadingContainer}>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoSection} onClick={() => navigate("/")}>
            <img src="/logo.png" alt="logo" style={s.logoImage} />
            {!isMobile && <h1 style={s.logoTitle}>ПЛЕЯДЫ</h1>}
          </div>
        </div>

        <div style={s.headerRight}>
          {!isMobile && (
            <button
              onClick={() => setShowEmailModal(true)}
              title="Написать письмо"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              <img src="/email.png" alt="email" style={{ width: "55px", height: "55px" }} />
            </button>
          )}

          {!isMobile && (
            <a
              href="https://t.me/zapchasticpectex"
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <img src="/telega.png" alt="Telegram" style={{ width: "55px", height: "55px" }} />
            </a>
          )}

          <button
            style={s.navButton}
            onClick={() => navigate("/catalog/komatsu/")}
          >
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

          <button style={s.navButton} onClick={handleLogout}>
            Выход
          </button>
        </div>
      </header>

      <div style={s.container}>
        <div style={s.contentWrapper}>
          <section style={s.profileSection}>
            <div style={s.profileCard}>
              <h2 style={s.sectionTitle}>Мой профиль</h2>
              <div style={s.profileInfo}>
                <div style={s.infoRow}>
                  <span style={s.label}>Компания:</span>
                  <span style={s.value}>{user?.company || "Не указана"}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.label}>Email:</span>
                  <span style={s.value}>{user?.email || "Не указан"}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.label}>Телефон:</span>
                  <span style={s.value}>{user?.phone || "Не указан"}</span>
                </div>
                <div style={s.infoRow}>
                  <span style={s.label}>Имя:</span>
                  {!isEditingName ? (
                    <div style={s.nameValueContainer}>
                      <span style={s.value}>{user?.first_name || "Не указано"}</span>
                      <button
                        style={s.editIconButton}
                        onClick={handleStartEditName}
                        title="Изменить"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div style={s.nameEditContainer}>
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => {
                          setNameInput(e.target.value);
                          setNameError("");
                          setNameSuccess("");
                        }}
                        style={s.nameEditInput}
                        placeholder="Введите имя"
                        disabled={nameSaving}
                      />
                      <div style={s.nameActions}>
                        <button
                          style={s.nameSaveButton}
                          onClick={handleSaveName}
                          disabled={nameSaving}
                        >
                          {nameSaving ? "Сохранение..." : "Сохранить"}
                        </button>
                        <button
                          style={s.nameCancelButton}
                          onClick={handleCancelEditName}
                          disabled={nameSaving}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {nameError && <div style={s.nameErrorText}>{nameError}</div>}
                {nameSuccess && (
                  <div style={s.nameSuccessText}>{nameSuccess}</div>
                )}
              </div>
              <div style={s.profileActions}>
                <button
                  style={s.downloadPricesButton}
                  onClick={() => setShowPriceModal(true)}
                >
                  Скачать цены
                </button>
              </div>
            </div>
          </section>

          <section style={s.innsSection}>
            <div style={s.innsSectionHeader}>
              <h2 style={s.sectionTitle}>Мои ИНН</h2>
              <button
                style={s.addButton}
                onClick={() => setShowAddInn(!showAddInn)}
              >
                + Добавить ИНН
              </button>
            </div>

            {error && <div style={s.errorMessage}>{error}</div>}

            {showAddInn && (
              <div style={s.addInnForm}>
                <input
                  type="text"
                  placeholder="Введите ИНН"
                  value={newInn}
                  onChange={(e) => setNewInn(e.target.value)}
                  style={s.input}
                />
                <button
                  style={s.submitButton}
                  onClick={handleAddInn}
                  disabled={addingInn}
                >
                  {addingInn ? "Добавляется..." : "Добавить"}
                </button>
                <button
                  style={s.cancelButton}
                  onClick={() => setShowAddInn(false)}
                >
                  Отмена
                </button>
              </div>
            )}

            {inns.length === 0 ? (
              <p style={s.emptyMessage}>У вас нет добавленных ИНН</p>
            ) : (
              <div style={s.innsTableWrapper}>
                <table style={s.innsTable}>
                  <thead>
                    <tr style={s.tableHeader}>
                      <th style={s.innTableCell}>ИНН</th>
                      <th style={s.innTableCell}>Компания</th>
                      <th style={s.innTableCell}>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inns.map((item, index) => (
                      <tr key={index} style={s.innTableRow}>
                        <td style={s.innTableCell}>{item.inn}</td>
                        <td style={s.innTableCell}>{item.company || "-"}</td>
                        <td style={s.innTableCell}>
                          <button
                            onClick={() => handleDeleteInn(item.inn)}
                            disabled={deletingInn === item.inn}
                            style={{
                              ...s.deleteButton,
                              opacity: deletingInn === item.inn ? 0.6 : 1,
                            }}
                          >
                            {deletingInn === item.inn ? "Удаляется..." : "Удалить"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section style={s.ordersSection}>
            {!selectedOrder ? (
              <>
                <div style={s.ordersHeader}>
                  <h2 style={s.sectionTitle}>История заказов</h2>
                  {orders.length === 0 ? (
                    <p style={s.emptyMessage}>У вас нет заказов</p>
                  ) : (
                    <p style={s.ordersCount}>Всего заказов: {orders.length}</p>
                  )}
                </div>

                {selectedInn ? (
                  <>
                    <button
                      style={s.backButton}
                      onClick={() => setSelectedInn(null)}
                    >
                      ← Вернуться к списку ИНН
                    </button>

                    <div style={s.innDetails}>
                      <h3 style={s.innTitle}>ИНН: {selectedInn}</h3>
                      <p style={s.innSubtitle}>
                        {ordersForSelectedInn.length} заказов
                      </p>
                    </div>

                    <div style={s.ordersListCompact}>
                      {ordersForSelectedInn.map((order, index) => {
                        const totalSum =
                          order.item?.reduce(
                            (sum, item) => sum + parseFloat(item.price) * item.kol,
                            0
                          ) || 0;
                        const formattedOrderTotal = formatPrice(totalSum);

                        return (
                          <div
                            key={index}
                            style={s.orderCardCompact}
                            onClick={() => setSelectedOrder(order)}
                          >
                            <div style={s.orderCardCompactHeader}>
                              <div>
                                <h4 style={s.orderNumberCompact}>
                                  Заказ #{order.idorder}
                                </h4>
                                <p style={s.orderDateCompact}>
                                  {formatOrderDate(getOrderDate(order))}
                                </p>
                              </div>
                              <div
                                style={{
                                  ...s.statusBadge,
                                  backgroundColor: getStatusColor(order.st),
                                }}
                              >
                                {order.nst || order.st || "Не указан"}
                              </div>
                            </div>
                            <div style={s.orderCardCompactFooter}>
                              <span style={s.itemCountCompact}>
                                {order.item?.length || 0} товаров
                              </span>
                              <span style={s.totalCompact}>{formattedOrderTotal} ₽</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div style={s.innsList}>
                    {uniqueInns.map((inn, index) => {
                      const innOrdersCount = orders.filter(
                        (o) => o.binn === inn
                      ).length;
                      return (
                        <div
                          key={index}
                          style={s.innCard}
                          onClick={() => setSelectedInn(inn)}
                        >
                          <div style={s.innCardContent}>
                            <h3 style={s.innCardTitle}>ИНН: {inn}</h3>
                            <p style={s.innCardSubtitle}>
                              {innOrdersCount} заказов
                            </p>
                          </div>
                          <div style={s.innCardArrow}>→</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div>
                <button
                  style={s.backButton}
                  onClick={() => setSelectedOrder(null)}
                >
                  ← Вернуться к заказам
                </button>

                <div style={s.orderDetailCard}>
                  <div style={s.orderDetailHeader}>
                    <div>
                      <h2 style={s.orderDetailNumber}>
                        Заказ #{selectedOrder.idorder}
                      </h2>
                      <p style={s.orderDetailDate}>
                        {formatOrderDate(getOrderDate(selectedOrder))}
                      </p>
                    </div>
                    <div
                      style={{
                        ...s.statusBadge,
                        backgroundColor: getStatusColor(selectedOrder.st),
                      }}
                    >
                      {selectedOrder.nst || selectedOrder.st || "Не указан"}
                    </div>
                  </div>

                  <div style={s.orderDetailMeta}>
                    <div style={s.metaItem}>
                      <span style={s.metaLabel}>ID заказа:</span>
                      <span style={s.metaValue}>{selectedOrder.num}</span>
                    </div>
                    <div style={s.metaItem}>
                      <span style={s.metaLabel}>ИНН:</span>
                      <span style={s.metaValue}>{selectedOrder.binn}</span>
                    </div>
                    {selectedOrder.gpdt && (
                      <div style={s.metaItem}>
                        <span style={s.metaLabel}>Дата готовности:</span>
                        <span style={s.metaValue}>
                          {formatOrderDate(selectedOrder.gpdt)}
                        </span>
                      </div>
                    )}
                    {selectedOrder.pldt && selectedOrder.pldt !== selectedOrder.gpdt && (
                      <div style={s.metaItem}>
                        <span style={s.metaLabel}>Планируемая дата:</span>
                        <span style={s.metaValue}>
                          {formatOrderDate(selectedOrder.pldt)}
                        </span>
                      </div>
                    )}
                    {selectedOrder.dt && (
                      <div style={s.metaItem}>
                        <span style={s.metaLabel}>Дата создания:</span>
                        <span style={s.metaValue}>
                          {selectedOrder.dt.includes(" ") 
                            ? selectedOrder.dt 
                            : formatOrderDate(selectedOrder.dt)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={s.itemsList}>
                    <table style={s.table}>
                      <thead>
                        <tr style={s.tableHeader}>
                          <th style={s.tableCell}>№</th>
                          <th style={s.tableCell}>Название</th>
                          <th style={s.tableCell}>Артикул</th>
                          <th style={s.tableCell}>Кол-во</th>
                          <th style={s.tableCell}>Цена</th>
                          <th style={s.tableCell}>Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.item?.map((item, itemIndex) => {
                          const priceValue = parseFloat(item.price) || 0;
                          const total = priceValue * item.kol;
                          return (
                            <tr key={itemIndex} style={s.tableRow}>
                              <td style={{ ...s.tableCell, textAlign: "center" }}>{itemIndex + 1}</td>
                              <td style={s.tableCell}>{item.nm}</td>
                              <td style={s.tableCell}>{item.art}</td>
                              <td style={s.tableCell}>{item.kol}</td>
                              <td style={s.tableCell}>
                                {formatPrice(priceValue)} ₽
                              </td>
                              <td style={s.tableCell}>{formatPrice(total)} ₽</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div style={s.orderDetailFooter}>
                    <span style={s.orderDetailSummaryLabel}>
                      Общая сумма заказа:
                    </span>
                    <span style={s.orderDetailSummaryValue}>
                      {formatPrice(
                        selectedOrder.item?.reduce(
                          (sum, item) =>
                            sum + parseFloat(item.price) * item.kol,
                          0
                        ) || 0
                      )} ₽
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {showEmailModal && (
        <div style={s.modalOverlay} onClick={() => !emailLoading && setShowEmailModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Отправить письмо</h2>
            <p style={s.modalText}>Заполните поля ниже, и мы свяжемся с вами</p>

            {emailError && <div style={s.errorMessage}>{emailError}</div>}
            {emailSuccess && <div style={s.successMessage}>{emailSuccess}</div>}

            <input
              type="text"
              value={emailName}
              onChange={(e) => setEmailName(e.target.value)}
              style={s.modalInput}
              placeholder="Ваше имя *"
              disabled={emailLoading}
            />

            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
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
              onChange={(e) => setEmailMessage(e.target.value)}
              style={s.modalTextarea}
              placeholder="Ваше сообщение *"
              disabled={emailLoading}
            />

            <div style={s.modalButtons}>
              <button
                style={s.modalSend}
                onClick={handleSendEmail}
                disabled={emailLoading}
              >
                {emailLoading ? "Отправка..." : "Отправить"}
              </button>
              <button
                style={s.modalCancel}
                onClick={() => setShowEmailModal(false)}
                disabled={emailLoading}
              >
                Отмена
              </button>
            </div>

            <button
              style={s.modalClose}
              onClick={() => setShowEmailModal(false)}
              disabled={emailLoading}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {showPriceModal && (
        <div style={s.modalOverlay} onClick={() => setShowPriceModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>Скачать цены</h2>
            <p style={s.modalText}>
              Выберите компании, для которых нужно сформировать прайс-лист
            </p>

            {priceError && <div style={s.errorMessage}>{priceError}</div>}

            <div style={s.priceGroupsList}>
              {priceGroups.map((group) => (
                <label key={group.id} style={s.priceGroupItem}>
                  <input
                    type="checkbox"
                    checked={selectedPriceGroups.includes(group.id)}
                    onChange={() => togglePriceGroup(group.id)}
                    style={s.priceCheckbox}
                  />
                  <span style={s.priceGroupName}>{group.label}</span>
                </label>
              ))}
            </div>

            <div style={s.modalButtons}>
              <button
                style={s.modalSend}
                onClick={handleDownloadPrices}
              >
                Скачать
              </button>
              <button
                style={s.modalCancel}
                onClick={() => setShowPriceModal(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusColor(statusNumber) {
  
  if (statusNumber === 5) {
    return "#4caf50"; 
  }
  return "#ff9800"; 
}

function getOrderDate(order) {
  
  if (order.gpdt) return order.gpdt;
  if (order.pldt) return order.pldt;
  if (order.dt) {
    
    return order.dt.split(" ")[0];
  }
  return "Дата не указана";
}

function formatOrderDate(dateStr) {
  if (!dateStr || dateStr === "Дата не указана") return dateStr;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export const styles = (mobile) => ({
  page: { backgroundColor: "#1c1c1c", color: "white", fontFamily: "Arial, sans-serif", minHeight: "100vh", width: "100%", overflowX: "hidden" },
  header: { display: "flex", flexDirection: mobile ? "column" : "row", alignItems: "center", justifyContent: "space-between", padding: mobile ? "10px" : "10px 40px", backgroundColor: "#2a2a2a", gap: "10px", position: "relative" },
  headerLeft: { display: "flex", alignItems: "center", gap: "20px" },
  logoSection: { display: "flex", alignItems: "center", gap: mobile ? "10px" : "15px", cursor: "pointer" },
  logoImage: { width: mobile ? "100px" : "150px", height: "auto", objectFit: "contain" },
  logoTitle: { margin: 0, color: "#ffcc00", fontSize: mobile ? "22px" : "30px" },
  headerRight: { display: "flex", alignItems: "center", gap: mobile ? "8px" : "20px", flexWrap: "wrap" },
  navButton: { backgroundColor: "#ffcc00", border: "none", padding: mobile ? "8px 12px" : "8px 16px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", color: "#1c1c1c", whiteSpace: "nowrap", fontSize: mobile ? "12px" : "14px" },
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
  container: { maxWidth: "1200px", margin: "0 auto", padding: mobile ? "20px 10px" : "40px 20px", width: "100%" },
  contentWrapper: { display: "flex", flexDirection: "column", gap: mobile ? "20px" : "30px" },
  profileSection: { width: "100%" },
  profileCard: { backgroundColor: "#2a2a2a", borderRadius: "12px", padding: mobile ? "20px" : "30px", border: "1px solid #444", boxShadow: "0 4px 18px rgba(0,0,0,0.35)" },
  sectionTitle: { fontSize: mobile ? "20px" : "28px", marginBottom: "20px", color: "#ffcc00", margin: "0 0 20px 0" },
  profileInfo: { display: "flex", flexDirection: "column", gap: "12px" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: mobile ? "flex-start" : "center", flexDirection: mobile ? "column" : "row", gap: "4px", paddingBottom: "10px", borderBottom: "1px solid #444" },
  label: { fontWeight: "bold", color: "#ffcc00", fontSize: "14px" },
  value: { color: "#ccc", fontSize: "14px" },
  innsSection: { width: "100%" },
  innsSectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: mobile ? "wrap" : "nowrap", gap: "10px" },
  addButton: { backgroundColor: "#ffcc00", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", color: "#1c1c1c", fontSize: "14px" },
  addInnForm: { backgroundColor: "#2a2a2a", borderRadius: "10px", padding: "20px", marginBottom: "20px", display: "flex", gap: "10px", flexWrap: mobile ? "wrap" : "nowrap" },
  profileActions: { marginTop: "16px", display: "flex", justifyContent: "flex-start" },
  downloadPricesButton: { backgroundColor: "#4caf50", border: "none", padding: "10px 18px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", color: "#fff", fontSize: "14px" },
  nameValueContainer: { display: "flex", alignItems: "center", gap: "8px" },
  editIconButton: { 
    backgroundColor: "transparent", 
    border: "1px solid #666", 
    color: "#ffcc00", 
    padding: "4px", 
    borderRadius: "4px", 
    cursor: "pointer", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center",
    width: "24px",
    height: "24px",
    transition: "all 0.2s",
    flexShrink: 0,
  },
  nameEditContainer: { display: "flex", flexDirection: "column", gap: "10px", width: "100%" },
  nameEditButton: { backgroundColor: "#444", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" },
  nameEditInput: { width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #555", backgroundColor: "#1c1c1c", color: "#fff" },
  nameActions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  nameSaveButton: { backgroundColor: "#ffcc00", border: "none", padding: "8px 14px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", color: "#1c1c1c" },
  nameCancelButton: { backgroundColor: "#666", border: "none", padding: "8px 14px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", color: "#fff" },
  nameErrorText: { marginTop: "6px", color: "#f66", fontSize: "13px" },
  nameSuccessText: { marginTop: "6px", color: "#66ff99", fontSize: "13px" },
  input: { flex: 1, minWidth: "200px", padding: "10px 15px", borderRadius: "5px", border: "1px solid #444", backgroundColor: "#1c1c1c", color: "#fff", fontSize: "14px", outline: "none" },
  submitButton: { backgroundColor: "#4caf50", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", color: "#fff", fontSize: "14px" },
  cancelButton: { backgroundColor: "#666", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", color: "#fff", fontSize: "14px" },
  deleteButton: { backgroundColor: "#f44336", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", color: "#fff", fontSize: "12px" },
  innsTableWrapper: { overflowX: "auto", marginBottom: "20px" },
  innsTable: { width: "100%", borderCollapse: "collapse", backgroundColor: "#2a2a2a", borderRadius: "10px", overflow: "hidden", border: "1px solid #444" },
  innTableCell: { padding: mobile ? "10px 8px" : "15px 20px", textAlign: "left", color: "#ccc", borderBottom: "1px solid #444", fontSize: mobile ? "12px" : "14px" },
  innTableRow: { borderBottom: "1px solid #444" },
  ordersSection: { width: "100%" },
  ordersHeader: { marginBottom: "20px" },
  ordersCount: { color: "#ccc", fontSize: "14px", margin: "10px 0 0 0" },
  emptyMessage: { color: "#999", fontSize: "16px", textAlign: "center", padding: "40px 20px", backgroundColor: "#2a2a2a", borderRadius: "10px" },
  errorMessage: { backgroundColor: "#c33", color: "white", padding: "15px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" },
  backButton: { backgroundColor: "#666", border: "none", padding: "10px 20px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", color: "#fff", fontSize: "14px", marginBottom: "20px" },
  innsList: { display: "flex", flexDirection: "column", gap: "15px" },
  innCard: { backgroundColor: "#2a2a2a", borderRadius: "10px", padding: "20px", border: "1px solid #444", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" },
  innCardContent: { flex: 1 },
  innCardTitle: { margin: "0 0 5px 0", fontSize: "18px", color: "#ffcc00", fontWeight: "bold" },
  innCardSubtitle: { margin: 0, fontSize: "14px", color: "#999" },
  innCardArrow: { fontSize: "24px", color: "#ffcc00", fontWeight: "bold" },
  innDetails: { backgroundColor: "#2a2a2a", borderRadius: "10px", padding: "20px", border: "1px solid #ffcc00", marginBottom: "20px" },
  innTitle: { margin: "0 0 10px 0", fontSize: "22px", color: "#ffcc00", fontWeight: "bold" },
  innSubtitle: { margin: 0, fontSize: "14px", color: "#999" },
  ordersListCompact: { display: "flex", flexDirection: "column", gap: "12px" },
  orderCardCompact: { backgroundColor: "#2a2a2a", borderRadius: "10px", padding: "16px", border: "1px solid #444", cursor: "pointer", boxShadow: "0 3px 12px rgba(0,0,0,0.3)" },
  orderCardCompactHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" },
  orderNumberCompact: { margin: "0 0 5px 0", fontSize: "16px", color: "#ffcc00", fontWeight: "bold" },
  orderDateCompact: { margin: 0, fontSize: "12px", color: "#999" },
  statusBadge: { padding: "5px 12px", borderRadius: "5px", fontSize: "12px", fontWeight: "bold", color: "white", margin: 0 },
  orderCardCompactFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #444", paddingTop: "10px" },
  itemCountCompact: { fontSize: "12px", color: "#ccc" },
  totalCompact: { fontSize: "14px", fontWeight: "bold", color: "#ffcc00" },
  orderDetailCard: { backgroundColor: "#2a2a2a", borderRadius: "10px", overflow: "hidden", border: "1px solid #444" },
  orderDetailHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px", backgroundColor: "#333", borderBottom: "1px solid #444" },
  orderDetailNumber: { margin: "0 0 5px 0", fontSize: "24px", color: "#ffcc00", fontWeight: "bold" },
  orderDetailDate: { margin: 0, fontSize: "12px", color: "#999" },
  orderDetailMeta: { display: "flex", gap: "30px", padding: "20px", backgroundColor: "#333", borderBottom: "1px solid #444", flexWrap: mobile ? "wrap" : "nowrap" },
  metaItem: { display: "flex", flexDirection: "column", gap: "5px" },
  metaLabel: { fontSize: "12px", color: "#999", fontWeight: "bold" },
  metaValue: { fontSize: "16px", color: "#ffcc00", fontWeight: "bold" },
  itemsList: { padding: "20px", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: mobile ? "12px" : "14px" },
  tableHeader: { backgroundColor: "#1c1c1c", borderBottom: "2px solid #ffcc00" },
  tableCell: { padding: mobile ? "8px 5px" : "12px", textAlign: "left", color: "#ccc", borderBottom: "1px solid #444" },
  tableRow: { borderBottom: "1px solid #444" },
  orderDetailFooter: { padding: "20px", backgroundColor: "#333", borderTop: "1px solid #444", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "15px", fontSize: "16px" },
  orderDetailSummaryLabel: { fontWeight: "bold", color: "#ffcc00" },
  orderDetailSummaryValue: { fontWeight: "bold", color: "#ffcc00", fontSize: "18px" },
  loadingContainer: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", fontSize: "18px", color: "#ccc" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modal: { backgroundColor: "#2a2a2a", padding: "30px", borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", maxWidth: "400px", width: "90%", position: "relative", colorScheme: "dark" },
  modalTitle: { margin: "0 0 15px 0", fontSize: "24px", color: "#ffcc00", fontWeight: "bold" },
  modalText: { color: "#ccc", fontSize: "14px", marginBottom: "20px" },
  modalInput: { width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "6px", border: "1px solid #444", backgroundColor: "#1c1c1c", color: "white", fontSize: "16px", boxSizing: "border-box", colorScheme: "dark" },
  modalTextarea: { width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "6px", border: "1px solid #444", backgroundColor: "#1c1c1c", color: "white", fontSize: "16px", boxSizing: "border-box", minHeight: "100px", fontFamily: "Arial, sans-serif", colorScheme: "dark" },
  modalButtons: { display: "flex", gap: "10px", justifyContent: "space-between" },
  modalSend: { flex: 1, backgroundColor: "#ffcc00", color: "#1c1c1c", border: "none", padding: "12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
  modalCancel: { flex: 1, backgroundColor: "#444", color: "white", border: "none", padding: "12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" },
  modalClose: { position: "absolute", top: "10px", right: "10px", backgroundColor: "transparent", border: "none", color: "#ffcc00", fontSize: "28px", cursor: "pointer", fontWeight: "bold" },
  successMessage: { color: "limegreen", fontSize: "14px", marginBottom: "20px" },
  priceGroupsList: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px", marginTop: "10px" },
  priceGroupItem: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "8px 10px", borderRadius: "6px", backgroundColor: "#1c1c1c" },
  priceCheckbox: { marginRight: "8px" },
  priceGroupName: { color: "#fff", fontSize: "14px", fontWeight: "500", flex: 1 },
  priceGroupId: { color: "#999", fontSize: "12px" },

});



//data_end (Машина выйхала ) 
//gpdt 42 ( должны ) (готов не гов наверное 8 ) 
//pldt 40 ( Мы хоти 5 числа лпновая (сращу появляется) 