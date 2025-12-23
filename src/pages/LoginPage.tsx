import {type JSX, useEffect, useState} from "react";
import {LoginComponent} from "../components/LoginComponent.tsx";
import {ApiProvider} from "../dataProviders/ApiProvider.ts";

import './css/login.scss'

export function LoginPage(): JSX.Element {
    const apiProvider = ApiProvider.getInstance();

    const [error, setError] = useState<string| null>(null);
    const [locked, setLocked] = useState(false);

    const handleLogin = (username: string, password: string) => {
        setLocked(true);
        setError(null);
        apiProvider.login(username, password).catch(() => {
            setError("Login failed");
            setLocked(false);
        });
    }

    useEffect(() => {
        void apiProvider.testLogin();
    }, [])

    return <div className="login-container"><LoginComponent locked={locked} handleLogin={handleLogin} error={error}/></div>;
}