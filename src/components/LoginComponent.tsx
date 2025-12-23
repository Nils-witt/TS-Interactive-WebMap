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
import {TextField, Typography} from "@mui/material";
import Button from "@mui/material/Button";

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
            <Typography>Login</Typography>

            <TextField variant={'outlined'} label={'username'} type="text" disabled={props.locked}
                       onChange={(e) => setUsername(e.target.value)}/>
            <TextField variant={'outlined'} label={'Password'} type="password" disabled={props.locked}
                       onChange={(e) => setPassword(e.target.value)}/>
            <Button variant="outlined" color="primary" type="submit"
                    onClick={() => props.handleLogin(username, password)}>Login</Button>
            {props.error && <p className="error-message">{props.error}</p>}
        </form>
    );
}