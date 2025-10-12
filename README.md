# Arrive - Facial Recognition Attendance System

Arrive is a modern MERN-stack solution for secure, reliable attendance tracking using facial recognition, geolocation, and automated notifications.

---

## Features

- Face recognition verification via face-api.js
- Firebase-based authentication
- Teacher session creation with subject, date/time, and map/geolocation
- Time-window restricted attendance marking
- Real-time dashboards for teachers and students
- Automatic email alerts for low attendance (Nodemailer + SMTP)
- Scalable storage of biometric and session data in MongoDB Atlas

---

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB Atlas account
- Gmail account (app password) or SMTP provider

### Installation

1. Clone the repo

    ```
    git clone https://github.com/MohdSaadMa07/Arrive.git
    cd arrive
    ```

2. Install dependencies

    ```
    cd client && npm install
    cd ../server && npm install
    ```

3. Set up `.env` in `server` directory

    ```
    MONGO_URI=...
    PORT=5000
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=465
    SMTP_SECURE=true
    SMTP_USER=your_gmail@gmail.com
    SMTP_PASSWORD=your_app_password
    ```

4. Place face-api.js models in `client/public/models/`

5. Run development servers

    ```
    cd server && npm start
    cd ../client && npm run dev
    ```

---

## Usage

- Teachers: Create account, Create sessions, view/manage student attendance, send notices
- Students: Create account, Login, mark attendance with face verification
- Sessions, summaries, and attendance reports are shown in dashboards

---

## Technologies

- React, face-api.js, Leaflet maps
- Node.js, Express, JWT
- MongoDB Atlas & Mongoose
- Nodemailer (SMTP Email)
- Firebase Authentication

---

## License

MIT License
