# 🌱 ECD Parenting System

An AI-powered web application designed to help parents monitor early childhood development through age-based milestone assessments, personalized activity recommendations, and an intelligent parenting assistant powered by Google Gemini AI.

---

## Overview

The ECD Parenting System enables parents to:

- Create and manage child profiles
- Perform age-based developmental assessments
- Track developmental progress over time
- Receive personalized activity recommendations
- Interact with an AI parenting assistant
- Access educational parenting resources

The application uses Firebase Authentication, Cloud Firestore, and Google Gemini AI to provide a secure and intelligent parenting platform.

> **Disclaimer**
>
> This application is intended for educational and developmental guidance only and does not replace professional medical advice or diagnosis.

---

# Features

- 👶 Child Profile Management
- 📊 Development Assessment
- 📈 Progress Tracking
- 🤖 AI Parenting Assistant
- 🎯 Personalized Activity Recommendation
- 📚 Parenting Tips
- ☁ Firebase Authentication
- 🔥 Cloud Firestore Integration

---

# Technologies

| Category | Technology |
|-----------|------------|
| Frontend | React |
| Build Tool | Vite |
| Styling | CSS |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| AI | Google Gemini API |
| Routing | React Router |

---

# Documentation

The complete system design documentation is available below.

---

## System Architecture

High-level architecture showing communication between the frontend, Firebase services, Firestore, and Google Gemini AI.

![System Architecture](docs/diagrams/system-architecture.png)

---

## Application Workflow

Overall workflow from user authentication to development assessment and AI-assisted parenting guidance.

![Application Workflow](docs/diagrams/application-workflow.png)

---

## Component Diagram

Illustrates the software modules, application components, and their interactions.

![Component Diagram](docs/diagrams/component-diagram.png)

---

## Firestore Entity Relationship Diagram

Database schema and relationships between Firestore collections.

![Firestore ERD](docs/diagrams/firestore-erd.png)

---

## AI Chatbot Sequence Diagram

Sequence of interactions between the user, frontend, Firebase, Firestore, and Google Gemini AI.

![Chatbot Sequence](docs/diagrams/chatbot-sequence.png)

---

## Development Assessment Flow

Flowchart illustrating how developmental assessments are performed and recommendations are generated.

![Development Assessment Flow](docs/diagrams/development-assessment-flow.png)

---

# Project Structure

```text
ECD-Parenting-System/
│
├── docs/
│   └── diagrams/
│       ├── application-workflow.png
│       ├── chatbot-sequence.png
│       ├── component-diagram.png
│       ├── development-assessment-flow.png
│       ├── firestore-erd.png
│       └── system-architecture.png
│
├── public/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── data/
│   ├── firebase/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   └── utils/
│
├── package.json
├── vite.config.js
└── README.md
```

---

# Installation

Clone the repository

```bash
git clone https://github.com/<your-username>/ECD-Parenting-System.git
```

Navigate into the project

```bash
cd ECD-Parenting-System
```

Install dependencies

```bash
npm install
```

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_GEMINI_API_KEY=
```

Start the development server

```bash
npm run dev
```

---

# Future Enhancements

- Mobile application support
- Growth chart visualization
- Pediatrician dashboard
- Vaccination tracker
- Multi-language support
- Offline mode
- AI model fine-tuned using child development literature

---

# License

This project is released under the MIT License.
