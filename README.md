# CharityOrg - Online Donation & Charity Management System

A production-ready, full-stack application built with **Spring Boot 3 (Java 25)** and **React 18 + Vite**. It features a robust Role-Based Access Control (RBAC), JWT authentication, 2FA (OTP via Email), Razorpay integration, dynamic AI Chatbot, and full financial transparency capabilities for campaigns.

## 🚀 Features
- **RBAC:** Secure routing and views for `ADMIN`, `CAMPAIGN_MANAGER`, `DONOR`, and `VOLUNTEER`.
- **Security:** Spring Security stateless JWTs stored securely via HttpOnly cookies. Passwords hashed using BCrypt.
- **2FA OTP:** Custom OTP verification flow via Email to secure authentication.
- **Payment Processing:** Integrated Razorpay checkout flow with secure signature verification.
- **Transparency:** Audit logs, fund allocation tracking, and automated 80G tax receipt generation.
- **AI Chatbot:** Real-time chatbot for queries (rules-based FAQ falling back to DB context).
- **Responsive UI:** Glassmorphism design system using raw CSS, fully responsive and accessible.

## 🛠️ Tech Stack
- **Backend:** Java 25, Spring Boot 3.x, Spring Security, Spring Data JPA, MySQL, iText PDF, Spring Mail, Lombok.
- **Frontend:** React, Vite, React Router DOM, Axios, Material Icons, Recharts, React Hot Toast.
- **Database:** MySQL.

## 📦 Run Instructions

### 1. Database Setup
1. Log in to MySQL (`mysql -u root -p`).
2. Source the `schema.sql`: `source v:/DonationManagement/database/schema.sql`.
3. Source the `seed_data.sql`: `source v:/DonationManagement/database/seed_data.sql`.
   *(Seed accounts include: admin@charity.org, manager@charity.org, volunteer@charity.org, donor@charity.org. Passwords are `Admin@12345678`)*

### 2. Backend Setup
1. Open `v:/DonationManagement/charity-backend` in Eclipse or any IDE.
2. Update `src/main/resources/application.properties` with your MySQL credentials, Gmail SMTP App Password, and Razorpay API Keys.
3. Build and Run the `CharityApplication.java` (Server runs on `http://localhost:8080`).

### 3. Frontend Setup
1. Navigate to the frontend directory: `cd v:/DonationManagement/charity-frontend`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. Access the app via `http://localhost:5173`.

## 🔒 Security Posture
- All API calls are filtered and protected (`@PreAuthorize` / `JwtAuthFilter`).
- Global exceptions are handled gracefully with `ApiResponse<T>`.
- Audit logs track crucial system events with IP and entity association.
