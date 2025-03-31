# Payments escrow smart contract on solana

This is a small sample project, that implements a rental escrow smart contract on the Solana blockchain, designed for an Airbnb-like applications. It facilitates secure payment handling between guests and hosts using Wrapped SOL (WSOL).

## Overview
- Purpose: Guests deposit payments into an escrow smart contract, which holds funds in a Program Derived Address (PDA) vault until the booking period ends. Hosts can then withdraw the payment.

- Key features:
  - Guests initiate bookings with a unique booking_id, specifying start_date, end_date, host_pk, and amount.
  - Funds are locked in a vault PDA until after the end_date, ensuring security.
  - Hosts withdraw funds post-booking using the booking_id and guest's public key.
  - Tests to validate functionality and security.

## Smart contract details
  - Booking (BookInstruction)
    - Creates a booking_payment PDA and a booking_payment_vault PDA.
    - Transfers WSOL from the guest to the vault.
    - Validates dates, amounts, and booking state.
  - Withdrawal Process (HostWithdraw):
    - Transfers funds from the vault to the host after the end_date.
    - Closes the vault account, reclaiming rent.
    - Enforces signer and timing constraints.

## Frontend
  - Since this is minimal app, state (booking id generation, guest/host booking records) is managed by the frontend and stored in the browser's local storage. 





<!-- # React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md)
  uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast
  Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or
  `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```

# legacy-react-vite-tailwindtailwind -->
