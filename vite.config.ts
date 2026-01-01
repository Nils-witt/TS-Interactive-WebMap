import {VitePWA} from "vite-plugin-pwa";
import {type InputOptions, type OutputOptions, rollup} from 'rollup'
import react from '@vitejs/plugin-react'

import typescript from '@rollup/plugin-typescript'
import {defineConfig} from "vite";

/**
 * Vite configuration with Tailwind and PWA plugin.
 * Additionally compiles the TypeScript service worker (src/sw-custom.ts) via Rollup
 * into dist/sw-custom.js so Workbox can import it at runtime.
 */
const CompileTsServiceWorker = () => ({
    name: 'compile-typescript-service-worker',
    async writeBundle() {
        const inputOptions: InputOptions = {
            input: 'src/sw-custom.ts',
            plugins: [
                typescript({tsconfig: "./tsconfig.rollup.json"})
            ],
            jsx: false

        }
        const outputOptions: OutputOptions = {
            file: 'dist/sw-custom.js',
            format: 'es',
        }
        const bundle = await rollup(inputOptions)
        await bundle.write(outputOptions)
        await bundle.close()
    }
})


export default defineConfig({
    plugins: [
        CompileTsServiceWorker(),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                importScripts: ['./sw-custom.js'],
                navigateFallbackDenylist: [/^\/(api|admin|vector|overlays)/]
            },
            includeAssets: [
                'icons/192.png',
                'icons/64.png',
                'icons/128.png',
                'icons/256.png',
                'icons/512.png',
                'icons/1024.png',
            ],
            devOptions: {
                enabled: false
            },
            manifest: {
                name: 'TS-Map',
                short_name: 'TS-Map',
                description: 'Interactive map application',
                theme_color: '#ffffff',
                // start_url: '/index.html',
                icons: [
                    {
                        "src": "icons/192.png",
                        "type": "image/png",
                        "sizes": "192x192"
                    },
                    {
                        "src": "icons/64.png",
                        "type": "image/png",
                        "sizes": "64x64"
                    },
                    {
                        "src": "icons/128.png",
                        "type": "image/png",
                        "sizes": "128x128"
                    },
                    {
                        "src": "icons/256.png",
                        "type": "image/png",
                        "sizes": "256x256"
                    },
                    {
                        "src": "icons/512.png",
                        "type": "image/png",
                        "sizes": "512x512"
                    },
                    {
                        "src": "icons/1024.png",
                        "type": "image/png",
                        "sizes": "1024x1024"
                    }
                ]
            }
        })
    ],
})
