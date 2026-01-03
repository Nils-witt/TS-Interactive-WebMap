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
            devOptions: {
                enabled: false
            },
            manifest: {
                name: 'TS-Map',
                short_name: 'TS-Map',
                description: 'Interactive map application',
                theme_color: '#0B1220',
                start_url: '/index.html',
                display: 'fullscreen',
                background_color: '#0B1220',
                orientation: 'natural',
                icons: [
                    {
                        "src": "icons/manifest-icon-192.maskable.png",
                        "sizes": "192x192",
                        "type": "image/png",
                        "purpose": "any"
                    },
                    {
                        "src": "icons/manifest-icon-192.maskable.png",
                        "sizes": "192x192",
                        "type": "image/png",
                        "purpose": "maskable"
                    },
                    {
                        "src": "icons/manifest-icon-512.maskable.png",
                        "sizes": "512x512",
                        "type": "image/png",
                        "purpose": "any"
                    },
                    {
                        "src": "icons/manifest-icon-512.maskable.png",
                        "sizes": "512x512",
                        "type": "image/png",
                        "purpose": "maskable"
                    }
                ]
            }
        })
    ],
})
