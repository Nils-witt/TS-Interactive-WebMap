import type {Route} from "./+types/home";

import '../login.scss'
import {ApiProvider} from "../dataProviders/ApiProvider";
import {useEffect, useState} from "react";
import {DataProvider} from "../dataProviders/DataProvider";
import {useNavigate} from "react-router";

export function meta({}: Route.MetaArgs) {
    return [
        {title: "Login"},
        {name: "description", content: "Welcome to React Router!"},
    ];
}

export default function LoginPage() {
    let navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
        console.log("Login clicked");
        console.log("Username:", username);
        console.log("Password:", password);
        setLoading(true);
        ApiProvider.getInstance().login(username, password).then(result => {
            navigate('/')
        }).catch(error => {
            console.error("Login failed:", error);
            setError("Login failed");
            setLoading(false);
        });
    }

    useEffect(() => {
        ApiProvider.getInstance().testLogin();
    },[])


    return (
        <form className="login-form">
            <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)}/>
            <input type="password" placeholder="password" onChange={(e) => setPassword(e.target.value)}/>
            <button type="button" onClick={handleLogin} disabled={loading}>Login</button>
        </form>
    );
}
