/*
 * LoginComponent.tsx
 * ---------------
 * Modernized login form: card layout with header, inputs, remember-me and error handling.
 */

import {type ReactElement, useState} from "react";

import './css/login.scss'
import { useAuth } from "react-oidc-context";

export interface LoginComponentProps {
    handleLogin: (username: string, password: string) => void,
    locked: boolean,
    error: string | null,
}

export function LoginComponent(props: LoginComponentProps): ReactElement {
    const auth = useAuth();
    
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");


    const startSSO = () => {
        console.log("Starting SSO login");
        void auth.signinRedirect()
    }


    return (
        <div className="login-card">
            <div className="login-card-header">
                <h1>Welcome!</h1>
                <p className="muted">Sign in to continue</p>
            </div>

            <form className="login-form" onSubmit={(e) => {
                e.preventDefault();
                props.handleLogin(username, password);
            }}>

                <label className="input-group">
                    <span className="input-label">Username</span>
                    <input
                        className="text-input"
                        type="text"
                        placeholder="you@example.com"
                        disabled={props.locked}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </label>

                <label className="input-group">
                    <span className="input-label">Password</span>
                    <input
                        className="text-input"
                        type="password"
                        placeholder="Enter your password"
                        disabled={props.locked}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>

                <div className="login-actions">
                    <button type="submit" disabled={props.locked} className="primary">Sign in</button>
                </div>

                <div className="login-actions">
                    <button type="button" disabled={props.locked} className="primary" onClick={startSSO}>SSO</button>
                </div>

                {props.error && <p className="error-message">{props.error}</p>}
            </form>

            <div className="login-card-footer">
                <small className="muted">&#169; 2025 - 2026 Nils Witt <a href={'https://github.com/Nils-witt/TS-Interactive-WebMap'}>GitHub</a></small>
            </div>
        </div>
    );
}