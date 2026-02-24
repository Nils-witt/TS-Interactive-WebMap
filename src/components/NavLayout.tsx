import { type JSX } from 'react';
import { AppBar, Box, SvgIcon, Toolbar, Typography } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { Utilities } from '../Utilities.ts';

// @ts-expect-error Custom plugin to compile this line correctly not recognized by TypeScript
import APPICON from '../svg/ts-interactive-webmap-icon.svg?react';

interface NavRoute {
    path: string;
    label: string;
}

const NAV_ROUTES: NavRoute[] = [
    { path: '/map', label: 'Map' },
    { path: '/locations', label: 'Locations' },
    { path: '/photo', label: 'Photo' },
];

const USER_ACTIONS: { label: string, onClick: () => void }[] = [
    { label: 'Settings', onClick: () => console.log('Open settings') },
    { label: 'Logout', onClick: () => Utilities.logout() },
];

export function NavLayout(): JSX.Element {
    const navigate = useNavigate();

    const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
    const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };
    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

            <AppBar position="static" color="primary">
                <Container maxWidth="xl">
                    <Toolbar disableGutters>
                        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                        <SvgIcon component={APPICON} inheritViewBox sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
                        <Typography
                            variant="h6"
                            noWrap
                            component="a"
                            href="#app-bar-with-responsive-menu"
                            sx={{
                                mr: 2,
                                display: { xs: 'none', md: 'flex' },
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                letterSpacing: '.3rem',
                                color: 'inherit',
                                textDecoration: 'none',
                            }}
                        >
                            Webmap
                        </Typography>

                        <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                            <IconButton
                                size="large"
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleOpenNavMenu}
                                color="inherit"
                            >
                                <MenuIcon />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={anchorElNav}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'left',
                                }}
                                open={Boolean(anchorElNav)}
                                onClose={handleCloseNavMenu}
                                sx={{ display: { xs: 'block', md: 'none' } }}
                            >
                                {NAV_ROUTES.map((r) => (
                                    <MenuItem key={r.path} onClick={() => { void navigate(r.path); handleCloseNavMenu(); }}>
                                        <Typography sx={{ textAlign: 'center' }}>{r.label}</Typography>
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
                        <SvgIcon component={APPICON} inheritViewBox sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
                        <Typography
                            variant="h5"
                            noWrap
                            component="a"
                            href="#app-bar-with-responsive-menu"
                            sx={{
                                mr: 2,
                                display: { xs: 'flex', md: 'none' },
                                flexGrow: 1,
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                letterSpacing: '.3rem',
                                color: 'inherit',
                                textDecoration: 'none',
                            }}
                        >

                        </Typography>
                        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
                            {NAV_ROUTES.map((r) => (
                                <Button
                                    key={r.path}
                                    onClick={() => { void navigate(r.path); handleCloseNavMenu(); }}
                                    sx={{ my: 2, color: 'white', display: 'block' }}
                                >
                                    {r.label}
                                </Button>
                            ))}
                        </Box>
                        <Box sx={{ flexGrow: 0 }}>
                            <Tooltip title="Open settings">
                                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                                    <Avatar alt="D" />
                                </IconButton>
                            </Tooltip>
                            <Menu
                                sx={{ mt: '45px' }}
                                id="menu-appbar"
                                anchorEl={anchorElUser}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={Boolean(anchorElUser)}
                                onClose={handleCloseUserMenu}
                            >

                                {USER_ACTIONS.map(r => (
                                    <MenuItem key={r.label} onClick={() => { r.onClick(); handleCloseUserMenu(); }}>
                                        <Typography sx={{ textAlign: 'center' }}>{r.label}</Typography>
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>
                    </Toolbar>
                </Container>
            </AppBar>
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <Outlet />
            </Box>
        </Box>
    );
}
