import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {registerSW} from "virtual:pwa-register";

import App from './App'

import './css/index.scss'

import 'maplibre-gl/dist/maplibre-gl.css'; // See notes below

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';


if (window.location.pathname === '/') {
    window.location.pathname = '/index.html';
}

navigator.serviceWorker.addEventListener("message", (event: MessageEvent<{ cmd: string }>) => {
    if (event.data.cmd === "reload") {
        console.log("Reloading page due to service worker update");
        window.location.reload();
    }
});

const intervalMS = 60 * 60 * 1000

try {
    registerSW({
        onRegisteredSW(swUrl: string, r: ServiceWorkerRegistration | undefined) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions,@typescript-eslint/no-misused-promises
            r && setInterval(async () => {
                if (r.installing || !navigator)
                    return

                if (('connection' in navigator) && !navigator.onLine)
                    return

                const resp = await fetch(swUrl, {
                    cache: 'no-store',
                    headers: {
                        'cache': 'no-store',
                        'cache-control': 'no-cache',
                    },
                })

                if (resp?.status === 200)
                    await r.update()
            }, intervalMS)
        }
    })
} catch (e) {
    console.error(e)
}


createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App/>
    </StrictMode>,
)
