import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { styles } from "./MainPage";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

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

  const s = styles(isMobile);

  return (
    <div
      style={{
        ...s.page,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <div
        style={{
          ...s.modal,
          maxWidth: "800px",
          width: "100%",
          padding: "30px",
          marginTop: "20px",
        }}
      >
        <h1
          style={{
            ...s.modalTitle,
            textAlign: "center",
            marginBottom: "30px",
            fontSize: isMobile ? "24px" : "28px",
          }}
        >
          Согласие на обработку персональных данных
        </h1>

        <div
          style={{
            color: "#ffffff",
            lineHeight: "1.6",
            fontSize: isMobile ? "14px" : "16px",
          }}
        >
          <p style={{ marginBottom: "20px" }}>
            Настоящим я даю свое согласие на обработку моих персональных данных
            в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ "О
            персональных данных".
          </p>

          <h2 style={{ color: "#ffcc00", marginTop: "25px", marginBottom: "15px" }}>
            1. Персональные данные
          </h2>
          <p style={{ marginBottom: "15px" }}>
            Под персональными данными понимается любая информация, относящаяся
            к прямо или косвенно определенному или определяемому физическому
            лицу (субъекту персональных данных).
          </p>
          <p style={{ marginBottom: "20px" }}>
            Персональные данные, которые будут использоваться, включают в себя:
            фамилию, имя, отчество, адрес электронной почты, номер телефона,
            ИНН и другие данные, предоставленные при регистрации и использовании
            сервиса.
          </p>

          <h2 style={{ color: "#ffcc00", marginTop: "25px", marginBottom: "15px" }}>
            2. Цели обработки
          </h2>
          <p style={{ marginBottom: "15px" }}>
            Персональные данные будут использоваться для следующих целей:
          </p>
          <ul style={{ marginLeft: "20px", marginBottom: "20px" }}>
            <li style={{ marginBottom: "10px" }}>
              Регистрация и идентификация пользователя на сайте
            </li>
            <li style={{ marginBottom: "10px" }}>
              Обработка заказов и предоставление услуг
            </li>
            <li style={{ marginBottom: "10px" }}>
              Связь с пользователем по вопросам использования сервиса
            </li>
            <li style={{ marginBottom: "10px" }}>
              Отправка уведомлений и информационных сообщений
            </li>
            <li style={{ marginBottom: "10px" }}>
              Улучшение качества предоставляемых услуг
            </li>
          </ul>

          <h2 style={{ color: "#ffcc00", marginTop: "25px", marginBottom: "15px" }}>
            3. Способы обработки
          </h2>
          <p style={{ marginBottom: "20px" }}>
            Обработка персональных данных осуществляется с использованием
            средств автоматизации и без использования таких средств, включая
            сбор, запись, систематизацию, накопление, хранение, уточнение
            (обновление, изменение), извлечение, использование, передачу
            (распространение, предоставление, доступ), обезличивание, блокирование,
            удаление, уничтожение персональных данных.
          </p>

          <h2 style={{ color: "#ffcc00", marginTop: "25px", marginBottom: "15px" }}>
            4. Срок действия согласия
          </h2>
          <p style={{ marginBottom: "20px" }}>
            Согласие действует с момента предоставления персональных данных до
            момента отзыва согласия субъектом персональных данных.
          </p>

          <h2 style={{ color: "#ffcc00", marginTop: "25px", marginBottom: "15px" }}>
            5. Права субъекта персональных данных
          </h2>
          <p style={{ marginBottom: "15px" }}>
            Субъект персональных данных имеет право:
          </p>
          <ul style={{ marginLeft: "20px", marginBottom: "20px" }}>
            <li style={{ marginBottom: "10px" }}>
              Получать информацию, касающуюся обработки его персональных данных
            </li>
            <li style={{ marginBottom: "10px" }}>
              Требовать уточнения персональных данных, их блокирования или
              уничтожения
            </li>
            <li style={{ marginBottom: "10px" }}>
              Отозвать согласие на обработку персональных данных
            </li>
            <li style={{ marginBottom: "10px" }}>
              Обжаловать действия или бездействие оператора в уполномоченный
              орган по защите прав субъектов персональных данных
            </li>
          </ul>

          <p style={{ marginTop: "30px", fontStyle: "italic", color: "#cccccc" }}>
            Нажимая кнопку "Зарегистрироваться", вы подтверждаете, что
            ознакомились с настоящим согласием и даете согласие на обработку
            ваших персональных данных в указанных целях.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          style={{
            ...s.modalSubmitBtn,
            marginTop: "30px",
            width: "100%",
          }}
        >
          Вернуться назад
        </button>
      </div>
    </div>
  );
}

