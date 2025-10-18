import {ApiProvider} from "../dataProviders/ApiProvider";
import {type ReactElement, useEffect, useState} from "react";


import '../login.scss'

export function LoginPage(): ReactElement {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
        setLoading(true);
        ApiProvider.getInstance().login(username, password).catch(() => {
            setError("Login failed");
            setLoading(false);
        });
    }

    useEffect(() => {
        ApiProvider.getInstance().testLogin();
    }, [])


    return (
        <div className="login-container">
            <form className="login-form">
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
                    <button type="button" onClick={handleLogin} disabled={loading}>Login</button>
                </div>
                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
}