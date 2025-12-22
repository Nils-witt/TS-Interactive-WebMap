/*
 * LoginPage.tsx
 * ---------------
 * Simple login page component used for authentication UI.
 * Purpose: present login form and handle user credentials, delegate to Utilities or ApiProvider.
 * Exports: default LoginPage component
 * Notes: Authentication flow may be app-specific; this component focuses on UI and local validation.
 */

import {ApiProvider} from "../dataProviders/ApiProvider";
import {type ReactElement, useEffect, useState} from "react";


import '../login.scss'

export function LoginPage(): ReactElement {
    const apiProvider = ApiProvider.getInstance();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
        setLoading(true);
        apiProvider.login(username, password).catch(() => {
            setError("Login failed");
            setLoading(false);
        });
    }

    useEffect(() => {
        void apiProvider.testLogin();
    }, [])


    return (
        <div className="login-container">
            <form className="login-form" onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
            }}>
                <div>
                    <h1>Login</h1>
                </div>
                <div className={"login-row"}>
                    <label>Username:</label>
                    <input type="text" onChange={(e) => setUsername(e.target.value)}/>
                </div>
                <div className={"login-row"}>
                    <label>Password:</label>
                    <input type="password" onChange={(e) => setPassword(e.target.value)}/>
                </div>
                <div className={"login-row"}>
                    <button type="submit" onClick={handleLogin} disabled={loading}>Login</button>
                </div>
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
}