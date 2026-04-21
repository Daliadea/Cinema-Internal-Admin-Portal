# CineVillage Full Stack Application

IS3108 Assignment 2 by Aiken Lim Wenen (A0308904).

This repository contains two connected applications for the CineVillage cinema system:

- `admin/` - Express + EJS internal admin portal
- `client/` - React + Vite customer-facing web app

## Requirements

- Node.js 18 or higher
- MongoDB running locally on `mongodb://127.0.0.1:27017`

## Setup

1. Start MongoDB.

   ```bash
   mongod
   ```

2. Install dependencies for both apps.

   ```bash
   cd admin
   npm install

   cd ../client
   npm install
   ```

3. Start the admin portal.

   ```bash
   cd admin
   npm start
   ```

   The admin portal runs at `http://localhost:3000`.

4. Start the customer app.

   ```bash
   cd client
   npm run dev
   ```

   The customer app runs at `http://localhost:5173`.

## Key URLs

- Admin portal: `http://localhost:3000`
- Staff registration: `http://localhost:3000/auth/register`
- Customer app: `http://localhost:5173`
- API base: `http://localhost:3000/api`

## Features

- Staff authentication and admin dashboard
- Customer registration and login with JWT
- Movie browsing and booking flow
- Live seat map in the admin portal
- QR code tickets for customer bookings
- Customer management and booking history views
- Booking statistics and revenue summaries

## Project Structure

- `admin/` contains the server, models, routes, views, and static assets for the internal portal.
- `client/` contains the React frontend for browsing movies, selecting seats, and viewing tickets.

## Notes

- The older `README.txt` contains assignment-specific notes and extra feature details.
- If you update the project structure or scripts, keep this README in sync.