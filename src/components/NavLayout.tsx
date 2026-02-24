import {type JSX, useEffect, useState} from 'react';
import {AppBar, Box, Tab, Tabs, Toolbar, Typography} from '@mui/material';
import {Outlet, useLocation, useNavigate} from 'react-router-dom';
import {DarkToggle} from './DarkToggle.tsx';

interface NavRoute {
    path: string;
    label: string;
}

const NAV_ROUTES: NavRoute[] = [
    {path: '/map', label: 'Map'},
    {path: '/locations', label: 'Map Locations'},
    {path: '/photo', label: 'Photo'},
];

export function NavLayout(): JSX.Element {
    const location = useLocation();
    const navigate = useNavigate();

    const currentTab = NAV_ROUTES.findIndex(r => location.pathname.startsWith(r.path));

    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        try {
            const stored = localStorage.getItem('theme');
            if (stored === 'light' || stored === 'dark') return stored;
        } catch {/* ignore */}
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        try {
            localStorage.setItem('theme', theme);
        } catch {/* ignore */}
    }, [theme]);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', height: '100vh'}}>
            <AppBar position="static" color="primary">
                <Toolbar>
                    <Typography variant="h6" sx={{mr: 3, fontWeight: 700, whiteSpace: 'nowrap'}}>
                        TS Map
                    </Typography>
                    <Tabs
                        value={currentTab === -1 ? false : currentTab}
                        onChange={(_, v: number) => navigate(NAV_ROUTES[v].path)}
                        textColor="inherit"
                        indicatorColor="secondary"
                        sx={{flexGrow: 1}}
                    >
                        {NAV_ROUTES.map(r => (
                            <Tab key={r.path} label={r.label} sx={{textTransform: 'none'}}/>
                        ))}
                    </Tabs>
                    <DarkToggle
                        theme={theme}
                        onToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                    />
                </Toolbar>
            </AppBar>
            <Box sx={{flex: 1, minHeight: 0, overflow: 'hidden'}}>
                <Outlet/>
            </Box>
        </Box>
    );
}
