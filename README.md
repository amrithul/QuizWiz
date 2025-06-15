---

# 🎯 QuizWiz – A Comprehensive Online Quiz System

QuizWiz is a robust, user-friendly Online Quiz System (OQS) designed for educational and training institutions. It offers quiz creation, user authentication, administration, performance analysis, and real-time feedback. Built with modern web technologies and MongoDB, it supports educators and learners in fostering a seamless, engaging learning environment.

---

## 📌 Table of Contents

* [Features](#features)
* [Screenshots](#screenshots)
* [System Architecture](#system-architecture)
* [Tech Stack](#tech-stack)
* [Installation](#installation)
* [Usage](#usage)
* [Modules & Roles](#modules--roles)
* [Future Scope](#future-scope)
* [License](#license)

---

## 🚀 Features

* 👤 **Role-Based Access**: Admin, Teacher, and Student roles
* 📝 **Quiz Creation & Editing**: Create, manage, categorize, and assign quizzes
* 🔐 **Secure Authentication**: Sign up / login system
* 📊 **Real-time Results**: Leaderboards and performance metrics
* 💬 **Feedback Mechanism**: Two-way feedback between participants and admins
* 📱 **Responsive UI**: Compatible across devices
* 📂 **Group Management**: Teachers can organize students into groups
* 📈 **Analytics Dashboard**: Performance tracking and result analysis

---

## 🖼️ Screenshots

| Landing Page                          | Quiz Creation                            | Leaderboard                                   |
| ------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| ![Landing](./screenshots/landing.png) | ![Create](./screenshots/create_quiz.png) | ![Leaderboard](./screenshots/leaderboard.png) |

---

## 🧠 System Architecture

The system follows a **4-layered architecture**:

1. **User Interface Layer** – Web UI for Admin, Teacher, and Student
2. **Backend Services Layer** – Business logic, routing, and validation
3. **Database Layer** – MongoDB for storing quizzes, user data, and scores
4. **Integration Layer** – (Optional) APIs for analytics/reporting

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, CSS3, JavaScript, Figma (for UI prototyping)
* **Backend**: Flask (Python)
* **Database**: MongoDB (NoSQL)
* **Deployment**: Localhost (can be scaled to cloud environments)

---

## 💻 Installation

### Prerequisites

* Python 3.x
* pip
* MongoDB installed and running locally

### Steps

```bash
git clone https://github.com/yourusername/quizwiz.git
cd quizwiz
pip install -r requirements.txt
python app.py
```

Access the application at `http://localhost:5000/`

---

## 🧪 Usage

### Admin

* Manage user accounts
* Manage groups and system settings
* View all quiz results

### Teacher

* Create/Edit/Delete quizzes
* Manage student groups
* View class performance and leaderboard

### Student

* Take quizzes
* View scores
* View leaderboard

---

## 🔐 Modules & Roles

| Role        | Modules/Functions                                |
| ----------- | ------------------------------------------------ |
| **Admin**   | Account Management, Group Management, Config     |
| **Teacher** | Quiz Management, Group Management, Analytics     |
| **Student** | Quiz Participation, Result Viewing, Leaderboards |

---

## 🌱 Future Scope

* 📊 Integration with advanced analytics dashboards
* 🧩 LMS (Learning Management System) integration
* 🎮 Gamification with badges and achievements
* 📱 Mobile App version
* 🗣️ Real-time chat & peer discussions


