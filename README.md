# Toy World - React JS

A React + Vite conversion of the Toy World multi-page website.

## Run in VS Code

1. Install Node.js (LTS) if it is not already installed: https://nodejs.org/
2. Extract this ZIP file.
3. Open the `Toy-World-React` folder in VS Code.
4. Open **Terminal → New Terminal**.
5. Run:

   ```bash
   npm install
   npm run dev
   ```

6. In a second terminal, start the API:

   ```bash
   npm run server
   ```

7. Open the local URL shown in the first terminal (usually http://localhost:5173).

Do not use the Live Server extension for this React project. Use `npm run dev`.

## Pages
- Home
- Products (with search)
- Offers
- About Us
- Contact
- Sign In (demo only)
- Cart (saved in browser localStorage)

The local API serves products, saves contact messages and creates demo orders. Its data is stored in `server/data.json`. Sign-in remains a front-end demonstration, and checkout does not process real payments.
