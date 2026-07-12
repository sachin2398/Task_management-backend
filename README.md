# 🚀 Task Management Backend

A scalable and secure **Task Management REST API** built with **Node.js**, **Express.js**, and **MongoDB**. The application implements **JWT Authentication**, **Role-Based Access Control (RBAC)**, and a clean modular architecture to support task creation, assignment, and management for Managers, Team Leads, and Employees.

This backend is designed following RESTful API principles with a focus on maintainability, scalability, and security.
<img width="1917" height="916" alt="image" src="https://github.com/user-attachments/assets/ebad912d-bd36-43b5-8f56-49d0745b47ad" />

---

## ✨ Features

### 🔐 Authentication

- User Registration
- User Login
- Secure Logout
- Get Current Logged-in User
- JWT Authentication
- HttpOnly Cookie Authentication
- Password Hashing using bcrypt

---

### 📋 Task Management

- Create Task
- Get All Tasks
- Get Task by ID
- Update Task
- Delete Task
- Assign Task
- Update Task Status
- Role-Based Task Visibility

---

### 👥 Role-Based Access Control

#### Manager

- View all users
- View all tasks
- Assign tasks to Team Leads and Employees
- Reassign tasks
- Manage all tasks

#### Team Lead

- View own tasks
- View employee tasks
- Assign tasks to employees
- Update assigned tasks

#### Employee

- Create personal tasks
- View own tasks
- Update own tasks
- Delete own tasks
- Mark tasks as Pending or Completed

---

## 🛠️ Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Cookie Parser
- bcryptjs
- Helmet
- Morgan
- CORS
- Dotenv

---

## 📁 Project Structure

```
Task_Management_Backend
│
├── src
│   ├── config
│   ├── constants
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── utils
│   └── app.js
│
├── server.js
├── package.json
└── README.md
```

---

## 🔗 REST API Endpoints

### Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Register User |
| POST | `/api/auth/login` | Login User |
| POST | `/api/auth/logout` | Logout User |
| GET | `/api/auth/me` | Get Current User |

---

### Tasks

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/tasks` | Create Task |
| GET | `/api/tasks` | Get All Tasks |
| GET | `/api/tasks/:id` | Get Task by ID |
| PUT | `/api/tasks/:id` | Update Task |
| DELETE | `/api/tasks/:id` | Delete Task |
| PATCH | `/api/tasks/:id/status` | Update Task Status |
| PATCH | `/api/tasks/:id/assign` | Assign/Reassign Task |

---

### Users

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/users` | Get All Users |
| GET | `/api/users/employees` | Get Employees |
| GET | `/api/users/teamleads` | Get Team Leads |
| GET | `/api/users/assignable` | Get Assignable Users |

---

## ⚙️ Installation

### Clone the Repository

```bash
git clone https://github.com/sachin2398/Task_management-backend.git
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

NODE_ENV=development
```

### Start Development Server

```bash
npm run dev
```

### Start Production Server

```bash
npm start
```

---

## 🔒 Security Features

- JWT Authentication
- HttpOnly Cookie Authentication
- Password Encryption
- Role-Based Authorization
- Protected Routes
- Helmet Security Headers
- CORS Configuration
- Environment Variable Management

---

## 🚀 Future Enhancements

- Socket.IO Real-Time Notifications
- Email Notifications
- Activity Logs
- Task Comments
- File Attachments
- Due Dates & Reminders
- Dashboard Analytics
- Search & Pagination

---

## 👨‍💻 Author

**Sachin Kumar Singh**

**GitHub:** https://github.com/sachin2398

---

## 📄 License

This project is developed for learning purposes and technical assessment. Feel free to fork and extend it for educational use.
