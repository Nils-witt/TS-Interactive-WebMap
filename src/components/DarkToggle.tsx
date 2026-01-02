import {type ReactElement} from 'react';

import './css/login-toggle.scss';

export interface DarkToggleProps {
    theme: 'light' | 'dark',
    onToggle: () => void,
}

export function DarkToggle({theme, onToggle}: DarkToggleProps): ReactElement {
    const isDark = theme === 'dark';

    return (
        <button
            className={`dark-toggle ${isDark ? 'is-dark' : 'is-light'}`}
            onClick={onToggle}
            aria-pressed={isDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
            type="button"
        >
            <span className="toggle-track" aria-hidden>
                <span className="toggle-knob">
                    {isDark ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" />
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                            <path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zM1 13h3v-2H1v2zm10 9h2v-3h-2v3zm7.03-2.03l1.79 1.79 1.79-1.79-1.79-1.79-1.79 1.79zM20 11v2h3v-2h-3zM13 1h-2v3h2V1zm-1 6a5 5 0 100 10 5 5 0 000-10z" fill="currentColor" />
                        </svg>
                    )}
                </span>
            </span>
        </button>
    );
}
