import globals from "globals";
import tseslint from "typescript-eslint";
import {defineConfig} from "eslint/config";
import js from '@eslint/js'

export default defineConfig([
    {ignores: ['dist', 'vite.config.ts']},
    {
        files: ["src/**/*.{js,ts}"],
        languageOptions: {globals: globals.browser},
        extends: [
            js.configs.recommended,
        ],
        rules: {
            // 'no-console': 'warn'
            'semi': ['error', 'always'],
            'quotes': ['error', 'single'],
            'indent': ['error', 4],
        }
    },
    tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },
    tseslint.configs.stylistic
]);