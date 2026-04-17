# 🏥 MedAssist AI — Setup Instructions

## Tech Stack
- **Frontend + Backend**: Next.js 16 (App Router, Route Handlers)
- **Auth**: Firebase Authentication (Email/Password + Google)
- **Database**: MongoDB (via Mongoose) with TTL auto-delete
- **Styling**: Tailwind CSS v4 + custom CSS design system

---

## 1. Prerequisites

- Node.js >= 18
- A Firebase project (free tier works)
- A MongoDB Atlas cluster (free tier works)
- Your external AI API endpoint + key

---

## 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Sign-in methods → **Email/Password** and **Google**
4. Go to **Project Settings** → copy your web app config keys
5. Create a **Firestore Database** (production or test mode)
6. In Firestore, allow reads/writes (or set proper rules):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

---

## 3. MongoDB Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Create a database user with read/write permissions
4. Whitelist your IP (or use `0.0.0.0/0` for development)
5. Copy your connection string

> ✅ The `createdAt` TTL index (auto-delete after 3 days) is set in `models/Chat.js` via Mongoose schema. MongoDB will apply it automatically.

---

## 4. Environment Variables

Edit `.env.local` with your real values:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/medical_assistant

# External AI API
AI_API_URL=https://your-ai-api.com/chat
AI_API_KEY=your_ai_api_key
```

---

## 5. Run Locally

```bash
cd medical-assistant
npm run dev
```

Open → http://localhost:3000

---

## 6. Project Structure

```
medical-assistant/
├── app/
│   ├── layout.js              # Root layout + AuthProvider
│   ├── page.js                # Landing page
│   ├── login/page.js          # Login (email + Google)
│   ├── signup/page.js         # Signup (with role selection)
│   ├── dashboard/page.js      # User dashboard + history
│   ├── chat/page.js           # ChatGPT-like chat interface
│   └── api/
│       └── chat/route.js      # POST (AI forward + save), GET (history), DELETE (clear)
├── components/
│   └── ProtectedRoute.js      # Auth guard component
├── context/
│   └── AuthContext.js         # Firebase auth + role state
├── lib/
│   ├── firebase.js            # Firebase init
│   └── mongodb.js             # Mongoose connection singleton
├── models/
│   └── Chat.js                # Chat schema with TTL index
├── .env.local                 # Environment variables (fill in yours)
└── SETUP.md                   # This file
```

---

## 7. API Contract

### POST `/api/chat`
```json
// Request
{ "user_Id": "firebase_uid", "message": "What is diabetes?", "role": "patient" }

// Response
{ "user_Id": "firebase_uid", "message": "AI response text...", "chat_id": "mongo_id" }
```

### GET `/api/chat?user_Id=<uid>`
Returns last 50 chats for the user.

### DELETE `/api/chat?user_Id=<uid>`
Clears all chat history for the user.

---

## 8. Connecting Your AI API

In `app/api/chat/route.js`, the POST handler forwards requests to `process.env.AI_API_URL`.

Expected AI API contract:
```json
// What we send
{ "user_Id": "...", "message": "...", "role": "patient" | "student" }

// What we expect back (any of these field names work)
{ "message": "..." }  // or "response" or "content"
```

Adjust the field mapping on line:
```js
const aiMessage = aiData.message || aiData.response || aiData.content || 'No response';
```
