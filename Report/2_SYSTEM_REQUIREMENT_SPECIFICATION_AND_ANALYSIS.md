# LEARNING MANAGEMENT SYSTEM (LMS)

## Project Report

---

# 2. SYSTEM REQUIREMENT SPECIFICATION AND ANALYSIS

## 2.1 Introduction

System Requirement Specification (SRS) is a comprehensive description of the intended purpose, behavior, and constraints of the Learning Management System. This chapter documents the functional and non-functional requirements of the system, analyzes feasibility, and presents the use case model that describes interactions between users and the system.

The requirements documented in this chapter are derived from the Product Requirements Document (PRD), analysis of the implemented codebase, and standard practices in learning management system design.

## 2.2 Functional Requirements

Functional requirements define the specific behaviors and functions that the LMS must provide. These requirements are organized by user role and system module.

### 2.2.1 Authentication and User Management Module

**FR-1: User Registration**
- The system shall allow new users to register with a unique email address, password, first name, and last name.
- The system shall validate that the email address is not already registered.
- The system shall enforce password complexity requirements (minimum 8 characters, combination of letters and numbers).
- Upon successful registration, the system shall create a user account with the default role of "STUDENT".
- The system shall return a JWT access token and set an HTTP-only refresh token cookie upon successful registration.

**FR-2: User Login**
- The system shall allow registered users to log in using their email address and password.
- The system shall validate credentials against the stored user records.
- Upon successful authentication, the system shall issue a JWT access token (15-minute expiry) and a refresh token (30-day expiry stored in HTTP-only cookie).
- The system shall return user details including id, name, email, and role in the authentication response.

**FR-3: User Logout**
- The system shall allow authenticated users to log out.
- The system shall invalidate the refresh token in the database upon logout.
- The system shall clear the refresh token cookie.

**FR-4: Token Refresh**
- The system shall provide a token refresh endpoint that uses the refresh token cookie to issue a new access token.
- The system shall validate that the refresh token exists in the database and has not expired.
- If the refresh token is valid, the system shall issue a new access token.

**FR-5: Role-Based Access Control**
- The system shall support three user roles: STUDENT, INSTRUCTOR, and ADMIN.
- The system shall restrict access to endpoints based on user role.
- ADMIN users shall have full access to all system functions.
- INSTRUCTOR users shall have access to course creation, editing, and their own course management.
- STUDENT users shall have access to course browsing, enrollment, and learning features.

### 2.2.2 Course Management Module

**FR-6: Course Creation**
- The system shall allow ADMIN and INSTRUCTOR users to create new courses.
- A course shall have the following attributes: title, description, thumbnail URL, instructor (automatically set for INSTRUCTOR role), and active status.
- The system shall validate that the course title is unique and not empty.
- Upon creation, the course shall be saved to the database with a unique identifier.

**FR-7: Course Listing**
- The system shall provide a publicly accessible course listing endpoint.
- The course list shall include course id, title, description, thumbnail URL, instructor name, and active status.
- The system shall only display active courses to students (non-admin users).
- The system shall allow ADMIN users to view all courses including inactive ones.

**FR-8: Course Details**
- The system shall provide a course details endpoint that returns comprehensive course information.
- Course details shall include all course metadata and the instructor's name.
- The system shall return a 404 error if the requested course does not exist.

**FR-9: Course Tree Structure**
- The system shall provide an endpoint that returns a course with its complete hierarchical structure: sections and lessons.
- The tree structure shall be ordered according to the display order of sections and lessons.
- Each lesson shall include: id, title, description, YouTube video URL, duration, and order index.
- Each section shall include: id, title, order index, and its nested lessons.

**FR-10: Course Update**
- The system shall allow ADMIN and the course's assigned INSTRUCTOR to update course details.
- The system shall validate that the course exists and the user has permission to modify it.
- Updated fields shall be persisted to the database.

**FR-11: Course Deletion**
- The system shall allow ADMIN users to delete courses.
- The system shall cascade the deletion to related sections, lessons, enrollments, and progress records.
- The system shall prevent deletion if the user does not have ADMIN privileges.

### 2.2.3 Section and Lesson Management Module

**FR-12: Section Creation**
- The system shall allow ADMIN and INSTRUCTOR users to create sections within a course.
- A section shall have: title, display order, and an associated course.
- The system shall automatically assign the next available display order if not specified.
- Sections shall be listed in ascending order of their display order.

**FR-13: Lesson Creation**
- The system shall allow ADMIN and INSTRUCTOR users to create lessons within a section.
- A lesson shall have: title, description, YouTube video URL, duration (in seconds), display order, and an associated section.
- The system shall validate that the YouTube URL is properly formatted.
- Lessons shall be listed in ascending order of their display order.

**FR-14: Lesson Update and Deletion**
- The system shall allow ADMIN and the course instructor to update lesson details.
- The system shall allow ADMIN and the course instructor to delete lessons.
- Deleting a lesson shall also remove associated progress records.

### 2.2.4 Enrollment Module

**FR-15: Course Enrollment**
- The system shall allow authenticated STUDENT users to enroll in active courses.
- The system shall prevent duplicate enrollments (a student cannot enroll in the same course twice).
- Upon enrollment, the system shall create an enrollment record linking the student and the course.
- The enrollment record shall include the enrollment date and a completion flag (default false).

**FR-16: Enrollment Status Check**
- The system shall allow students to check whether they are enrolled in a specific course.
- The system shall return the enrollment status and enrollment date if enrolled.

**FR-17: Enrolled Courses Listing**
- The system shall provide an endpoint for students to view all courses they are enrolled in.
- The response shall include course details and the enrollment date for each course.

### 2.2.5 Progress Tracking Module

**FR-18: Video Progress Tracking**
- The system shall track each student's progress for each video lesson they watch.
- Progress records shall include: last watched position (in seconds), completion status, and last watched timestamp.
- The system shall update progress when a student watches a video (triggered by the frontend sending progress data).

**FR-19: Course Progress Summary**
- The system shall provide an endpoint that returns a student's progress across all lessons in a course.
- The progress summary shall include: total lessons, completed lessons, overall completion percentage, and per-lesson progress details.
- Per-lesson progress shall include: lesson id, completion status, and last watched position.

**FR-20: Sequential Lesson Unlocking**
- The system shall enforce that lessons are unlocked sequentially within a course.
- A lesson shall be unlocked if it is the first lesson in the course, or if the immediately preceding lesson has been completed.
- The system shall provide unlock status information in the course tree response.
- Students shall not be able to access lessons that are locked.

**FR-21: Resume Last Position**
- The system shall allow students to resume a video lesson from the last watched position.
- When loading a lesson, the system shall return the last watched position from the progress record.
- The frontend video player shall seek to the stored timestamp upon loading.

### 2.2.6 Student Dashboard Module

**FR-22: Dashboard Overview**
- The system shall provide a dashboard endpoint that returns an overview of the student's learning activity.
- The dashboard shall include: total enrolled courses, overall completion percentage across all courses, and individual course progress.
- The dashboard shall highlight recently accessed courses and courses nearing completion.

### 2.2.7 Administration Module

**FR-23: User Management (Admin)**
- The system shall allow ADMIN users to view all registered users.
- The system shall allow ADMIN users to activate or deactivate user accounts.
- The system shall allow ADMIN users to change a user's role.

**FR-24: Course Approval Workflow**
- The system shall allow ADMIN users to activate or deactivate courses.
- Inactive courses shall not be visible to students for enrollment.

## 2.3 Non-Functional Requirements

Non-functional requirements define the quality attributes, performance criteria, and constraints that the system must satisfy.

### 2.3.1 Performance Requirements

**NFR-1: Response Time**
- The system shall respond to API requests within 500 milliseconds under normal load (up to 100 concurrent users).
- Database queries for course listing shall complete within 200 milliseconds.
- Progress update operations shall complete within 300 milliseconds.

**NFR-2: Throughput**
- The system shall support at least 500 concurrent users without degradation in response time.
- The system shall handle at least 100 API requests per second.

**NFR-3: Video Loading**
- The YouTube video player shall load within 3 seconds on a standard broadband connection (25 Mbps).
- Video playback shall begin within 2 seconds of the user clicking the play button.

### 2.3.2 Security Requirements

**NFR-4: Authentication Security**
- All API endpoints (except registration, login, and public course listing) shall require authentication via JWT.
- Access tokens shall have a short expiry (15 minutes) to limit the window of opportunity for token misuse.
- Refresh tokens shall be stored in HTTP-only cookies to prevent access via JavaScript (mitigating XSS attacks).
- The system shall validate the refresh token against the database on each refresh request to detect revoked tokens.

**NFR-5: Password Security**
- Passwords shall be stored using BCrypt hashing with a strength factor of 10 or higher.
- The system shall never store passwords in plain text or using reversible encryption.

**NFR-6: CORS Protection**
- The system shall implement CORS (Cross-Origin Resource Sharing) restrictions to allow only the frontend domain to access the API.
- The system shall reject API requests from unauthorized origins.

**NFR-7: SQL Injection Prevention**
- The system shall use Spring Data JPA (Hibernate) with parameterized queries to prevent SQL injection attacks.
- Raw SQL queries shall be avoided in favor of JPA repository methods.

### 2.3.3 Usability Requirements

**NFR-8: User Interface**
- The user interface shall be intuitive and require no training for basic operations (course browsing, enrollment, video watching).
- The system shall use consistent design patterns, colors, and typography across all pages.
- Forms shall provide clear validation messages when input is invalid.

**NFR-9: Responsive Design**
- The frontend shall be fully responsive and usable on devices with screen widths from 320px (mobile) to 1920px (desktop).
- Navigation menus shall adapt to mobile viewports with a hamburger menu or equivalent.
- Video players shall scale appropriately to fit the available screen width.

**NFR-10: Accessibility**
- The system shall follow WCAG 2.1 Level AA guidelines for accessibility.
- All interactive elements shall be keyboard navigable.
- Images shall have appropriate alt text attributes.
- Color contrast shall meet minimum ratio requirements (4.5:1 for normal text).

### 2.3.4 Reliability Requirements

**NFR-11: Availability**
- The system shall achieve 99.5% uptime, excluding scheduled maintenance.
- The system shall handle database connection failures gracefully with appropriate error messages.

**NFR-12: Data Integrity**
- The system shall maintain referential integrity using foreign key constraints in the database.
- The system shall use database transactions for operations that modify multiple related records.
- The system shall prevent orphaned records through cascade delete or appropriate constraint definitions.

### 2.3.5 Scalability Requirements

**NFR-13: Horizontal Scalability**
- The backend shall be stateless (except for refresh token storage), allowing multiple instances to run behind a load balancer.
- The database shall be hosted on a managed cloud platform (Aiven) with the ability to scale compute and storage resources.

**NFR-14: Vertical Scalability**
- The system shall efficiently utilize available server resources (CPU, memory) and handle increased load through resource scaling.

### 2.3.6 Maintainability Requirements

**NFR-15: Code Quality**
- The codebase shall follow established coding conventions for Java (Spring Boot) and TypeScript (React).
- The system shall use a layered architecture (Controller, Service, Repository) to separate concerns.
- Business logic shall reside in Service classes, not Controllers.

**NFR-16: Documentation**
- The system shall provide API documentation (via Swagger/OpenAPI or equivalent).
- Key business logic shall be documented with concise comments where the logic is non-obvious.

### 2.3.7 Compatibility Requirements

**NFR-17: Browser Compatibility**
- The frontend shall support the latest two major versions of Chrome, Firefox, Safari, and Edge.
- The system shall degrade gracefully in older browsers with appropriate notifications.

**NFR-18: YouTube Compatibility**
- The system shall support YouTube video embedding using the IFrame API.
- The system shall handle YouTube videos that are private, deleted, or region-restricted with appropriate error messages.

## 2.4 Feasibility Study

A feasibility study evaluates whether the proposed system is viable from technical, economic, operational, and scheduling perspectives.

### 2.4.1 Technical Feasibility

**Analysis:**
The LMS is built using well-established, mature technologies:
- Java Spring Boot is a proven enterprise-grade framework with extensive community support and documentation.
- React with TypeScript provides a robust frontend development experience with type safety.
- MySQL is a widely-used relational database with strong reliability and performance characteristics.
- YouTube IFrame API is a stable, well-documented API for video embedding.

**Conclusion:** The project is technically feasible. All chosen technologies are production-ready, well-documented, and supported by large developer communities. The development team's familiarity with these technologies further strengthens technical feasibility.

### 2.4.2 Economic Feasibility

**Cost Analysis:**

| Item | Cost (Monthly) | Notes |
|------|----------------|-------|
| Cloud Database (Aiven MySQL) | $20 - $50 | Managed MySQL instance |
| Backend Hosting (Render) | $7 - $25 | Depending on instance size |
| Frontend Hosting (Vercel) | $0 | Free tier for non-commercial use |
| YouTube Hosting | $0 | Free video hosting |
| Domain Name | $1 - $2 | Annual cost amortized monthly |
| **Total Estimated Monthly Cost** | **$28 - $77** | |

**Conclusion:** The project is economically feasible, especially for a small to medium-scale deployment. Leveraging YouTube for video hosting eliminates significant infrastructure and bandwidth costs. The use of free-tier or low-cost cloud services makes the platform accessible to educational institutions with limited budgets.

### 2.4.3 Operational Feasibility

**Analysis:**
- The system provides a minimalist, intuitive interface that requires minimal training for end users.
- Instructors can easily create and manage courses without technical expertise.
- Administrators have comprehensive tools for platform management.
- The system operates within standard web browsers, requiring no special software installation.

**Conclusion:** The project is operationally feasible. The user experience is designed to be straightforward, and the system integrates seamlessly into existing educational workflows.

### 2.4.4 Scheduling Feasibility

**Analysis:**
The project has been implemented with core features completed:
- Authentication system: Complete
- Course management: Complete
- Section and lesson management: Complete
- Enrollment system: Complete
- Progress tracking: Complete
- Sequential lesson unlocking: Complete

**Conclusion:** The project is schedule-feasible for its current scope. Future enhancements (assessments, certificates, live classes) would require additional development time.

## 2.5 System Analysis

### 2.5.1 Actor Descriptions

**Actor 1: Student**
- Primary actor who interacts with the system to browse courses, enroll, and consume educational content.
- Has permission to: register, login, browse courses, enroll in courses, watch lessons, track progress.
- Cannot: create courses, modify content, access admin functions.

**Actor 2: Instructor**
- Secondary actor who creates and manages course content.
- Has permission to: all Student permissions, create/edit/delete own courses, manage sections and lessons within own courses.
- Cannot: access other instructors' courses, access admin-only functions (user management, all-course overview).

**Actor 3: Administrator**
- Super-user who manages the entire platform.
- Has permission to: all Instructor permissions, manage all users (activate/deactivate, change roles), manage all courses (activate/deactivate, delete), access platform analytics.

**Actor 4: System (External)**
- Represents external systems the LMS integrates with.
- YouTube: Provides video hosting and playback via IFrame API.
- Database: Persists all application data.

### 2.5.2 Use Case Diagram (Textual Representation)

```
                    +------------------+
                    |    LMS System    |
                    +------------------+
                           |
        +------------------+------------------+
        |                  |                  |
   +---------+       +-----------+      +----------+
   | Student |       | Instructor |      |  Admin   |
   +---------+       +-----------+      +----------+

Student Use Cases:
  - Register
  - Login / Logout
  - Browse Courses
  - View Course Details
  - Enroll in Course
  - Watch Lesson Video
  - Track Video Progress
  - View Dashboard

Instructor Use Cases:
  - (All Student Use Cases)
  - Create Course
  - Update Course
  - Create Section
  - Create Lesson
  - Update Lesson
  - Delete Lesson

Admin Use Cases:
  - (All Instructor Use Cases)
  - Manage Users (Activate/Deactivate, Change Role)
  - Manage All Courses (Activate/Deactivate)
  - Delete Any Course
  - View Platform Analytics
```

### 2.5.3 Use Case Descriptions

**Use Case 1: Register**

| Field | Description |
|-------|-------------|
| Use Case ID | UC-01 |
| Name | Register |
| Actors | Student, Instructor |
| Precondition | User is not already registered |
| Postcondition | User account is created, JWT tokens are issued |
| Main Flow | 1. User navigates to registration page. 2. User enters email, password, first name, last name. 3. System validates input. 4. System creates user account with role STUDENT. 5. System returns JWT access token and sets refresh token cookie. |
| Alternative Flows | A1: Email already registered - System returns error message. A2: Invalid input - System returns validation errors. |

**Use Case 2: Login**

| Field | Description |
|-------|-------------|
| Use Case ID | UC-02 |
| Name | Login |
| Actors | Student, Instructor, Admin |
| Precondition | User has a registered account |
| Postcondition | User is authenticated, JWT tokens are issued |
| Main Flow | 1. User navigates to login page. 2. User enters email and password. 3. System validates credentials. 4. System returns JWT access token and sets refresh token cookie. |
| Alternative Flows | A1: Invalid credentials - System returns authentication error. A2: Account deactivated - System returns account inactive error. |

**Use Case 3: Browse Courses**

| Field | Description |
|-------|-------------|
| Use Case ID | UC-03 |
| Name | Browse Courses |
| Actors | Student, Instructor, Admin (all users) |
| Precondition | None (publicly accessible) |
| Postcondition | Course list is displayed |
| Main Flow | 1. User navigates to course listing page. 2. System retrieves all active courses. 3. System displays courses with title, description, thumbnail, and instructor name. |
| Alternative Flows | None |

**Use Case 4: Enroll in Course**

| Field | Description |
|-------|-------------|
| Use Case ID | UC-04 |
| Name | Enroll in Course |
| Actors | Student |
| Precondition | User is authenticated, course is active, user is not already enrolled |
| Postcondition | Enrollment record is created |
| Main Flow | 1. Student views course details page. 2. Student clicks "Enroll" button. 3. System creates enrollment record. 4. System confirms enrollment. |
| Alternative Flows | A1: Already enrolled - System returns enrollment status. A2: Course inactive - System returns error. |

**Use Case 5: Watch Lesson Video**

| Field | Description |
|-------|-------------|
| Use Case ID | UC-05 |
| Name | Watch Lesson Video |
| Actors | Student |
| Precondition | Student is enrolled, lesson is unlocked (sequential), lesson exists |
| Postcondition | Video progress is tracked, lesson may be marked complete |
| Main Flow | 1. Student clicks on a lesson. 2. System checks if lesson is unlocked. 3. System loads YouTube player with video. 4. System seeks to last watched position. 5. Student watches video. 6. System periodically updates progress. 7. Upon video completion, system marks lesson as complete and unlocks next lesson. |
| Alternative Flows | A1: Lesson locked - System denies access. A2: Video unavailable - System shows error message. |

**Use Case 6: Create Course**

| Field | Description |
|-------|-------------|
| Use Case ID | UC-06 |
| Name | Create Course |
| Actors | Instructor, Admin |
| Precondition | User is authenticated with INSTRUCTOR or ADMIN role |
| Postcondition | New course is created in database |
| Main Flow | 1. Instructor navigates to course creation page. 2. Instructor enters course title, description, thumbnail URL. 3. System validates input. 4. System creates course with current user as instructor. 5. System confirms course creation. |
| Alternative Flows | A1: Validation error - System returns error messages. A2: Unauthorized - System returns access denied error. |

**Use Case 7: Track Video Progress**

| Field | Description |
|-------|-------------|
| Use Case ID | UC-07 |
| Name | Track Video Progress |
| Actors | Student |
| Precondition | Student is watching a lesson video |
| Postcondition | Progress record is updated in database |
| Main Flow | 1. YouTube player reports current playback time. 2. Frontend sends progress update to API. 3. System updates or creates progress record with current position. 4. If video is complete (watched to end), system marks lesson as completed. |
| Alternative Flows | A1: Network error - Progress update is retried or queued locally. |

**Use Case 8: Manage Users (Admin)**

| Field | Description |
|-------|-------------|
| Use Case ID | UC-08 |
| Name | Manage Users |
| Actors | Admin |
| Precondition | Admin is authenticated |
| Postcondition | User status or role is updated |
| Main Flow | 1. Admin views user list. 2. Admin selects a user to modify. 3. Admin changes user role or activation status. 4. System updates user record. 5. System confirms update. |
| Alternative Flows | A1: Cannot deactivate self - System prevents admin from deactivating own account. |

### 2.5.4 Data Flow Analysis

**DFD Level 0 (Context Diagram):**

```
[Student] ---> (LMS System) ---> [YouTube]
[Instructor] -> (LMS System) ---> [MySQL DB]
[Admin] -----> (LMS System)
```

**DFD Level 1 (Key Processes):**

1. **Authentication Process:**
   - Input: Email, Password (from User)
   - Output: JWT Token (to User), Refresh Token (to Cookie), User Record (to Database)
   - Process: Validate credentials, generate tokens, store refresh token

2. **Course Management Process:**
   - Input: Course Data (from Instructor/Admin), Query (from User)
   - Output: Course Records (to Database), Course List/Details (to User)
   - Process: Create/update/retrieve course information

3. **Learning Process:**
   - Input: Lesson Request (from Student)
   - Output: Video Embed (from YouTube), Progress Update (to Database)
   - Process: Load video, track progress, unlock next lesson

4. **Progress Tracking Process:**
   - Input: Playback Position (from YouTube Player via Frontend)
   - Output: Progress Record (to Database), Next Lesson Unlock (to Database)
   - Process: Update watch position, determine completion, update unlocked status

## 2.6 Requirement Traceability Matrix

The Requirement Traceability Matrix (RTM) ensures that all requirements are addressed in the implementation.

| Requirement ID | Requirement Description | Module | Implementation Status |
|---------------|------------------------|--------|----------------------|
| FR-1 | User Registration | Auth | Implemented |
| FR-2 | User Login | Auth | Implemented |
| FR-3 | User Logout | Auth | Implemented |
| FR-4 | Token Refresh | Auth | Implemented |
| FR-5 | Role-Based Access | Auth | Implemented |
| FR-6 | Course Creation | Course | Implemented |
| FR-7 | Course Listing | Course | Implemented |
| FR-8 | Course Details | Course | Implemented |
| FR-9 | Course Tree Structure | Course | Implemented |
| FR-10 | Course Update | Course | Implemented |
| FR-11 | Course Deletion | Course | Implemented |
| FR-12 | Section Creation | Content | Implemented |
| FR-13 | Lesson Creation | Content | Implemented |
| FR-14 | Lesson Update/Delete | Content | Implemented |
| FR-15 | Course Enrollment | Enrollment | Implemented |
| FR-16 | Enrollment Status | Enrollment | Implemented |
| FR-17 | Enrolled Courses | Enrollment | Implemented |
| FR-18 | Video Progress | Progress | Implemented |
| FR-19 | Course Progress | Progress | Implemented |
| FR-20 | Sequential Unlocking | Progress | Implemented |
| FR-21 | Resume Position | Progress | Implemented |
| FR-22 | Dashboard Overview | Dashboard | Implemented |
| FR-23 | User Management | Admin | Implemented |
| FR-24 | Course Approval | Admin | Implemented |
| NFR-1 | Response Time | System | Verified |
| NFR-4 | Auth Security | System | Implemented |
| NFR-5 | Password Security | System | Implemented |
| NFR-6 | CORS Protection | System | Implemented |

## 2.7 Summary

This chapter has presented a comprehensive specification and analysis of the Learning Management System. The functional requirements cover five key modules: Authentication, Course Management, Content Management, Enrollment, and Progress Tracking. The non-functional requirements address performance, security, usability, reliability, scalability, maintainability, and compatibility concerns.

The feasibility study confirms that the project is viable from technical, economic, operational, and scheduling perspectives. The use case model and data flow analysis provide a clear understanding of system behavior and interactions. The requirement traceability matrix confirms that all specified requirements have been implemented in the current system.

The next chapter will delve into the system design, covering architectural decisions, database schema, API design, and user interface design.
