import tailwindcss from '@tailwindcss/vite'
import {VitePWA} from "vite-plugin-pwa";
import { rollup, InputOptions, OutputOptions } from 'rollup'

import rollupPluginTypescript from '@rollup/plugin-typescript'
import { nodeResolve } from '@rollup/plugin-node-resolve'


const CompileTsServiceWorker = () => ({
    name: 'compile-typescript-service-worker',
    async writeBundle(_options, _outputBundle) {
        const inputOptions: InputOptions = {
            input: 'src/sw-custom.ts',
            plugins: [rollupPluginTypescript(), nodeResolve()],
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

export default {
    plugins: [
        tailwindcss(),
        CompileTsServiceWorker(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                importScripts: ['./sw-custom.js'],
            //    globIgnores: ['**'],
            },
            includeAssets: ['icons/192.png', 'icons/512.png'],
            devOptions: {
                enabled: true
            },
            manifest: {
                name: 'TacMap',
                short_name: 'TacMap',
                description: 'TacMap',
                theme_color: '#ffffff',
                icons: [
                    {
                        "src": "icons/192.png",
                        "type": "image/png",
                        "sizes": "192x192"
                    },
                    {
                        "src": "icons/512.png",
                        "type": "image/png",
                        "sizes": "512x512"
                    }
                ]
            }
        })
    ]
}