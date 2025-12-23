/*
 * LoginComponent.tsx
 * ---------------
 * Simple login page component used for authentication UI.
 * Purpose: present login form and handle user credentials, delegate to Utilities or ApiProvider.
 * Exports: default LoginComponent component
 * Notes: Authentication flow may be app-specific; this component focuses on UI and local validation.
 */

import {type ReactElement, useState} from "react";


import './css/login.scss'

export interface LoginComponentProps {
    handleLogin: (username: string, password: string) => void,
    locked: boolean,
    error: string | null,
}

export function LoginComponent(props: LoginComponentProps): ReactElement {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    return (

        <form className="login-form" onSubmit={(e) => {
            e.preventDefault();
            props.handleLogin(username, password);
        }}>
            <div>
                <h1>Login</h1>
            </div>
            <div className={"login-row"}>
                <label>Username:</label>
                <input type="text" disabled={props.locked} onChange={(e) => setUsername(e.target.value)}/>
            </div>
            <div className={"login-row"}>
                <label>Password:</label>
                <input type="password" disabled={props.locked} onChange={(e) => setPassword(e.target.value)}/>
            </div>
            <div className={"login-row"}>
                <button type="submit" onClick={() => props.handleLogin(username, password)}
                        disabled={props.locked}>Login
                </button>
            </div>
            {props.error && <p className="error-message">{props.error}</p>}
        </form>
    );
}