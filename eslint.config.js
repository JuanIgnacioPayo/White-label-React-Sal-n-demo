import globals from "globals";
import eslint from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';

export default [
  eslint.configs.recommended,
  eslintReact.configs.recommended, // Use recommended config from @eslint-react
  {
    files: ["**/*.{js,jsx}"], // Apply to JS and JSX files
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser, // Include browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        localStorage: "readonly",
        alert: "readonly",
        URLSearchParams: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        navigator: "readonly",
        location: "readonly"
      },
    },
    settings: {
      react: {
        version: 'detect'
      }, // Detect React version automatically
    },
    rules: {
      // Add or override specific rules here if needed
      // For example, to handle unused React variables
      'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
      'react/jsx-uses-react': 'off', // Not needed with new JSX transform
      'no-unused-vars': ['warn', { 'varsIgnorePattern': '^(React|_)$' }], // Ignore React and underscore-prefixed vars
      // Other rules can be added from eslintReact.configs.recommended if desired
    },
  },
];
