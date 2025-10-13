import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from "vite-tsconfig-paths";
import {reactRouter} from "@react-router/dev/vite";

export default {
    plugins: [
        tailwindcss(),
        reactRouter(),
        tsconfigPaths()
    ]
}