# 🎬 StreamVerse

StreamVerse is a modern **video streaming platform** built with **Django** and **Next.js**.
It allows users to browse, stream movies and episodes, and provides an admin dashboard to manage content.

This project demonstrates a **full-stack streaming application architecture** with a scalable backend API and a modern frontend interface.

---

## 🚀 Features

* 🎥 Movie streaming
* 📺 TV episode streaming
* 🔐 User authentication system
* 🧑‍💻 Admin dashboard for managing videos
* 📂 Organized backend media management
* ⚡ Fast and responsive frontend UI
* 🔍 Browse and explore available content

---

## 🛠 Tech Stack

### Frontend

* Next.js
* React
* JavaScript
* Tailwind CSS

### Backend

* Django
* Django REST Framework
* Python

### Database

* SQLite (development)
* PostgreSQL (recommended for production)

---

## ⚙️ Installation Guide

### 1️⃣ Clone the repository

```bash
git clone https://github.com/kush0234/StreamVerse.git
cd StreamVerse
```

---

### 2️⃣ Backend Setup (Django)

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Apply migrations:

```bash
python manage.py migrate
```

Run the backend server:

```bash
python manage.py runserver
```

The backend server will start at:

```
http://127.0.0.1:8000
```

---

### 3️⃣ Frontend Setup (Next.js)

Open another terminal and navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Frontend will run at:

```
http://localhost:3000
```

---

## 📁 Project Structure

```
StreamVerse
│
├── backend
│   ├── apps
│   │   ├── users
│   │   ├── movies
│   │   └── episodes
│   │
│   ├── media
│   │   ├── videos
│   │   └── episodes
│   │
│   └── manage.py
│
├── frontend
│   ├── src
│   │   ├── app
│   │   ├── components
│   │   └── pages
│   │
│   └── public
│
└── README.md
```

---

## 📌 Future Improvements

Planned features for future development:

* ⭐ Video recommendation system
* 📑 Watchlist / Favorites
* 💳 Subscription system
* 📱 Mobile responsive improvements
* 🔍 Advanced search and filtering
* ☁️ Cloud video storage integration

---

## 🧠 Learning Goals

This project demonstrates:

* Full-stack web development
* API-driven architecture
* Media streaming management
* Frontend–backend integration
* Scalable project structure

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Kush**

GitHub:
https://github.com/kush0234

---

⭐ If you find this project helpful, feel free to **star the repository**.
