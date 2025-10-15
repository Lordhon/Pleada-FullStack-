import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

function ActivateUser() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [message, setMessage] = useState("");
    const hasActivated = useRef(false);

    useEffect(() => {
        if (!token) {
            setMessage("Токен не найден в URL");
            return;
        }

        if (hasActivated.current) return;
        hasActivated.current = true;

        axios.get(`http://localhost/api/activate/${token}/`).then((res) => setMessage(res.data.message))
            .catch((err) => {
                if (err.response) setMessage(err.response.data.error || "Ошибка активации");
                else setMessage("Ошибка сети");
            });
    }, [token]);

    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <div style={{ padding: "30px", borderRadius: "10px", width: "400px", textAlign: "center" }}>
                {message ? <p>{message}</p> : <p>Активация аккаунта...</p>}
            </div>
        </div>
    );
}

export default ActivateUser;
