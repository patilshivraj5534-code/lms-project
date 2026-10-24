# Learning Management System (LMS) - Project Documentation

## 1. Project Overview
The **Learning Management System (LMS)** is a comprehensive platform designed to provide a structured and seamless learning experience. It allows instructors to create and manage courses, and students to enroll in courses, watch video lessons, and track their progress. The system ensures a logical learning flow through sequential lesson unlocking and real-time progress persistence.

---

## 2. Technology Stack

### Backend
- **Language:** Java 17
- **Framework:** Spring Boot 4.0.6
- **Security:** Spring Security with JWT (JSON Web Token)
- **Database:** MySQL (Hosted on Aiven Cloud)
- **ORM:** Spring Data JPA (Hibernate)
- **Utilities:** Lombok, Maven

### Frontend
- **Framework:** React 19 (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.0
- **State Management:** React Context API (Auth Context)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Networking:** Axios
- **Video Player:** React YouTube (YouTube IFrame API)

---

## 3. System Architecture
The application follows a standard **Client-Server Architecture**:
1. **Frontend (Client):** A single-page application (SPA) built with React that interacts with the backend via RESTful APIs.
2. **Backend (Server):** A Spring Boot application that handles business logic, security, and database interactions.
3. **Database:** A relational MySQL database for persisting users, courses, enrollments, and progress.

---

## 4. Key Features

### 🔐 Authentication & Security
- **JWT Authentication:** Secure login and registration system using Access and Refresh tokens.
- **Role-Based Access Control:** Separate roles for `STUDENT`, `INSTRUCTOR`, and `ADMIN`.
- **Password Hashing:** BCrypt encryption for secure password storage.

### 📚 Course Management
- **Curriculum Structure:** Courses are organized into **Sections**, which contain **Videos/Lessons**.
- **Instructor Dashboard:** Dedicated interface for instructors to create, update, and manage course content.
- **Course Status:** Support for `DRAFT` and `PUBLISHED` states.

### 🎓 Student Learning Path
- **Enrollment System:** Students can browse the catalog and enroll in courses.
- **Sequential Unlocking:** Lessons must be watched in order; the next lesson is unlocked only after the current one is completed.
- **Progress Tracking:** Real-time tracking of watch time and completion status.
- **Resume Capability:** Students can resume lessons from their last watched position.

---

## 5. Database Schema (ERD)

### Main Entities:
| Entity | Description | Key Fields |
| :--- | :--- | :--- |
| **User** | System users (Students/Instructors) | `id`, `name`, `email`, `password_hash`, `role` |
| **Course** | Learning modules | `id`, `title`, `description`, `thumbnail_url`, `instructor_id` |
| **Section** | Logical groupings within a course | `id`, `title`, `order_index`, `course_id` |
| **Video** | Individual lessons | `id`, `title`, `youtube_id`, `duration`, `order_index` |
| **Enrollment** | Maps students to courses | `id`, `user_id`, `subject_id`, `created_at` |
| **VideoProgress** | Tracks student progress per video | `id`, `user_id`, `video_id`, `last_position`, `is_completed` |

---

## 6. API Endpoints (REST)

### Auth Endpoints
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Authenticate and get tokens
- `POST /api/auth/refresh` - Refresh access token

### Course & Learning Endpoints
- `GET /api/subjects` - List all published courses
- `GET /api/subjects/{id}` - Get course details
- `GET /api/subjects/{id}/tree` - Get full course curriculum (sections & videos)
- `POST /api/enrollments` - Enroll in a course

### Progress Endpoints
- `GET /api/progress/subjects/{id}` - Get user progress for a specific course
- `POST /api/progress/videos/{id}` - Update watch progress/completion for a video

---

## 7. Project Structure

```text
LMS/
├── lms-backend/               # Spring Boot Application
│   ├── src/main/java/com/lms/backend/
│   │   ├── config/            # Security & DB Migration configs
│   │   ├── controller/        # REST API Endpoints
│   │   ├── entity/            # JPA Data Models
│   │   ├── repository/        # Data Access Layer
│   │   ├── security/          # JWT & Security Logic
│   │   └── service/           # Business Logic
│   └── src/main/resources/    # Application properties
│
└── lms-frontend/              # React Application
    ├── src/
    │   ├── components/        # Reusable UI Components
    │   ├── context/           # Auth & State Management
    │   ├── layout/            # Page Wrappers
    │   ├── pages/             # Main Route Components
    │   ├── services/          # API Communication (Axios)
    │   └── types/             # TypeScript Definitions
    └── public/                # Static Assets
```

---

## 8. Setup & Installation

### Backend Setup
1. Ensure Java 17 and Maven are installed.
2. Configure `application.properties` with your MySQL credentials.
3. Run `mvn spring-boot:run`.
4. The server will start on `http://localhost:8080`.

### Frontend Setup
1. Ensure Node.js is installed.
2. Navigate to `lms-frontend` and run `npm install`.
3. Create a `.env` file (if needed) to point to the backend URL.
4. Run `npm run dev`.
5. The application will be available at `http://localhost:5173`.

---

## 9. Future Enhancements
- **Quizzes & Assignments:** Adding interactive assessments at the end of sections.
- **Certificate Generation:** Automated PDF certificates upon course completion.
- **Live Sessions:** Integration with Zoom/Google Meet for live classes.
- **Payment Gateway:** Integration with Stripe/Razorpay for paid courses.
