# Meerasa’s Interview Prep

This project is a React + Vite based interview preparation web application designed to practice curated interview questions across multiple topics in a clean, responsive interface.

The application focuses on readability, fast navigation, and mobile-friendly design while keeping the codebase simple and scalable.

---

## Features

- Topic-based interview question sets
- Real-time search for questions and answers
- Pagination for large question sets
- Responsive layout (table view on desktop, card view on mobile)
- Loading indicators for better UX
- One-click copy for questions and answers
- JSON-driven content (easy to extend or replace with APIs)

---

## Tech Stack

- React
- Vite
- JavaScript (ES6+)
- Tailwind CSS

---

## Project Structure

src/
├── assets/
│ └── Logo.png
├── sets/
│ ├── set1.json
│ ├── set2.json
│ └── ...
├── components/
│ └── InterviewSetsApp.jsx
├── main.jsx
└── index.css


## Question Set Format

Each interview topic is stored as a JSON file:

```json
{
  "setName": "JavaScript Interview Questions",
  "data": [
    {
      "question": "What is closure in JavaScript?",
      "answer": "A closure is a function that remembers its lexical scope."
    }
  ]
}


Getting Started

Install dependencies

npm install

Start the development server

npm run dev

The app will be available at:

http://localhost:5173

Customization

Add new interview topics by creating JSON files inside src/sets

Update UI styles using Tailwind utility classes

Easily extend the project to fetch data from an API or backend

Notes
This project is intended for learning, practice, and showcasing frontend development skills.
It is structured to be easily extended with features like authentication, progress tracking, or backend integration.