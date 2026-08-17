# Little Steps — Trusted 24×7 Child Care Platform

Little Steps is a full-stack MERN (MongoDB, Express, React, Node.js) web application that connects parents with trusted, verified childcare providers — individual caregivers and daycare centers — available around the clock.

Built as part of a MERN Stack internship with **Unified Mentor**, under the *Family & Care Management* domain.

🔗 **Live App:** https://little-steps-one.vercel.app  
🔗 **Backend API:** https://little-steps-mq5a.onrender.com

## Features

- 🔐 Role-based authentication (Parent / Provider) using JWT
- 🔍 Search and filter childcare providers by type and location
- 👶 Provider profiles — business info, experience, hourly rate, availability
- 📅 Full booking flow — request, accept, reject, and track bookings
- 📊 Dedicated dashboards for parents ("My Bookings") and providers ("Requests")
- 🌗 Signature 24-hour "AvailabilityArc" ring UI to visualize round-the-clock care

## Tech Stack

**Frontend:** React (Vite), Tailwind CSS  
**Backend:** Node.js, Express.js  
**Database:** MongoDB (Atlas)  
**Auth:** JWT, bcrypt.js  
**Deployment:** Vercel (frontend), Render (backend)

## Project Structure
Little-Steps/
├── client/ # React frontend (Vite + Tailwind)
│ └── src/
│ ├── App.jsx # Main application component
│ └── ...
└── server/ # Express backend
├── controllers/
├── models/ # User, Provider, Booking schemas
├── routes/
└── middleware/ # JWT auth middleware


## Getting Started (Local Setup)

```bash
# Clone the repo
git clone https://github.com/Touqir-creator/Little-Steps.git

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

Create a `.env` file inside `server/` with:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret


Run the backend:
```bash
cd server
npm start
```

Run the frontend:
```bash
cd client
npm run dev
```

## Author

**Syed Touqir**
