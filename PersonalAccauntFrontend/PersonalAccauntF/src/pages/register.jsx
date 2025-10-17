import React, { useState } from 'react';
import axios from "axios";
import { useNavigate } from "react-router-dom";

const  url= location.origin
function Register() {
    const [formData, setFormData] = useState({ email: '', password: '', inn: '', phone_number: '' });
    const [step, setStep] = useState(1);
    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCodeChange = (e) => {
        setCode(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${url}/api/register/`, formData);
            console.log('Success:', response.data);
            setStep(2);
        } catch (error) {
            if (error.response) {
                console.log('Server responded with:', error.response.data);
                setMessage('Ошибка регистрации. Проверьте данные.');
                if (error.response.data.password){
                    setMessage(error.response.data.password.join(' '));

                }else {
                    setMessage('Ошибка . Проверте данные ');
                }
            } else {
                console.log('Error', error.message);
                setMessage('Произошла ошибка. Попробуйте позже.');
            }
        }
    };

    const handleCodeSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${url}/api/account/activate-code/`, { email: formData.email, code });
            console.log('Code verified:', response.data);
            setMessage('Регистрация подтверждена!');
            navigate("/login");
        } catch (error) {
            if (error.response) {
                console.log('Server responded with:', error.response.data);
                setMessage('Неверный код. Попробуйте снова.');
            } else {
                console.log('Error', error.message);
                setMessage('Произошла ошибка. Попробуйте позже.');
            }
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#f5f5f5'
        }}>
            {step === 1 && (
                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        background: '#fff',
                        padding: '30px',
                        borderRadius: '10px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        width: '300px'
                    }}
                >
                    <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Регистрация</h2>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Пароль"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    <input
                        type="text"
                        name="inn"
                        placeholder="ИНН"
                        value={formData.inn}
                        onChange={handleChange}
                        required
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (!val.startsWith('+7')) {
                                setFormData({ ...formData, phone_number: '+7' + val.replace(/\D/g, '') });
                            } else {
                                setFormData({ ...formData, phone_number: val });
                            }
                        }}
                        placeholder="+7 (XXX) XXX-XX-XX"
                        required
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />

                    <button type="submit" style={{
                        padding: '10px',
                        border: 'none',
                        borderRadius: '5px',
                        background: '#4CAF50',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}>Зарегистрироваться</button>

                    {message && <p style={{ color: 'red' }}>{message}</p>}

                    <p
                        style={{
                            fontSize: "14px",
                            textAlign: "center",
                            marginTop: "10px",
                            cursor: "pointer",
                            color: "#007BFF"
                        }}
                        onClick={() => navigate("/login")}
                    >
                         Войти
                    </p>
                </form>
            )}

            {step === 2 && (
                <form
                    onSubmit={handleCodeSubmit}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        background: '#fff',
                        padding: '30px',
                        borderRadius: '10px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        width: '300px'
                    }}
                >
                    <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Подтверждение кода</h2>
                    <input
                        type="text"
                        name="code"
                        placeholder="Введите код"
                        value={code}
                        onChange={handleCodeChange}
                        required
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                    <button type="submit" style={{
                        padding: '10px',
                        border: 'none',
                        borderRadius: '5px',
                        background: '#4CAF50',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}>Подтвердить</button>

                    {message && <p style={{ color: 'green' }}>{message}</p>}

                    <p
                        style={{
                            fontSize: "14px",
                            textAlign: "center",
                            marginTop: "10px",
                            cursor: "pointer",
                            color: "#007BFF"
                        }}
                        onClick={() => navigate("/login")}
                    >
                        Уже есть аккаунт? Войти
                    </p>
                </form>
            )}
        </div>
    );
}

export default Register;
