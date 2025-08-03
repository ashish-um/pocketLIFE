# 🌟 Contributing to PocketLIFE

Welcome! Whether you're fixing a bug, adding features, or improving docs — your help matters.

---

## ⚙️ Prerequisites

Install the following before setting up the project:

- Node.js (v18+)
- npm
- Git

---

## 🛠️ Contribution Guide

### ⭐ 1. Fork & Star

Click the "Fork" button and give us a ⭐ to support the project.

🐛 2. Pick or Create an Issue

- Browse open issues and comment to get assigned.
- If needed, create a new one with a clear description.
- Only begin work after being assigned by a maintainer.

### 📥 3. Clone the Repo

```bash
git clone https://github.com/<your-username>/pocketLIFE.git
cd pocketLIFE
```
### 🌱 4. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```
### ⚙️ 5. Project Setup

📦 Install Dependencies
Install for both frontend and backend:
```bash
cd frontend
npm install

cd ../backend
npm install
```
### 🧪 6. Environment Variables

✅ You do not need to create your own env variables — default testing variables are already included.
Just copy the example files:
```bash
# navigate back to the project's root folder
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```
### ▶️ 7. Running the Project

Frontend:
```bash
cd frontend
npm run dev
```
Backend:
```bash
cd backend
node server.js
```

Visit your app at: http://localhost:5173/pocketLIFE/

### ✅ 8. Final Steps

💾 Commit Your Work:
```bash
git add .
git commit -m "Fix: [short description of change]"
```
🚀 Push & Raise Pull Request:
```bash
git push origin feature/your-feature-name
```
- Go to your fork on GitHub.
- Click “Compare & pull request”.
- Fill in the title and description (e.g. Fixes #29).
- Submit for review.

## 💡 Additional Notes

### 🧠 Tech Stack
PocketLIFE is a browser-based journaling tool built with:

- Frontend: HTML, CSS, JavaScript (likely with Vite)
- Backend: Node.js / Express (assumed)
- Planned Features: AES encryption, Google Drive sync, image uploads

### 🔄 Keep Your Fork Updated

Keep your local copy in sync with the main repo:
```bash
git remote add upstream https://github.com/ashish-um/pocketLIFE.git
git fetch upstream
git checkout main
git merge upstream/main
```

### 📌 Project-Specific Best Practices
- Never hardcode API keys or secrets in your code.
- Use environment variables via .env files.
- Follow the structure provided in .env.example for both frontend and backend.
- Name your branches clearly using prefixes like feature/ or fix/.
- Keep your code clean and follow existing formatting/styles.
- Test your changes locally before submitting a PR.

### 🤝 Code of Conduct

We follow the Code of Conduct to foster a welcoming and respectful community.
By contributing, you agree to:
   Be respectful to others
   Use inclusive and clear language
   Report any unacceptable behavior
Please read the full [Code of Conduct](./CODE_OF_CONDUCT.md) before contributing.

## 🙌 Thank You!

Your contribution is truly appreciated. Let’s build something amazing together! 💙
