# 🎓 Learn-Link: When Your PDFs Get an AI-Powered Study Buddy

![Learning intensifies](https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif)

## 🚀 TL;DR  
*Upload your PDFs and watch Google's Gemini AI turn them into quizzes, flashcards, and summaries faster than you can say "I should've started studying earlier." Now with multiplayer features because studying alone is SO 2019!*

## 🤔 What Actually Is This?

Remember those all-nighters where you desperately wished your textbooks would just... summarize themselves? Well, someone finally built that! **Learn-Link** is the lovechild of collaborative tools (think Google Docs meets Zoom) and AI-powered studying (think ChatGPT but it actually read your textbook).

This isn't your grandpa's e-learning platform. This is a full-blown collaborative study war room where you can:
- Throw PDFs at Google Gemini AI and watch it generate quiz questions that would make your professors jealous
- Create flashcards automatically (no more 3am manual card-making sessions)
- Chat with your study group via voice while sharing files in real-time
- See everyone's cursors moving around like a multiplayer video game (because why not?)
- Collaborate on a shared whiteboard using TLDraw (finally, a place to scribble random diagrams that might make sense)

Built as a B.Tech Computer Science mini project, this platform has more features than most "professional" learning management systems, and probably more bugs too (we call them "surprise features").

## 🛠️ Features (AKA "Things That Actually Work")

### 🤖 AI-Powered Learning (Powered by Google Gemini)
- **Auto-Generated Quizzes**: Upload a PDF and get 5 multiple-choice questions faster than you can say "please don't ask about Chapter 12"
- **Smart Flashcards**: AI extracts key concepts and creates flashcards automatically (your handwriting thanks you)
- **PDF Chatbot**: Ask questions about your uploaded PDFs and get answers like you have a personal tutor (who never sleeps or judges you)
- **Document Comparison**: Compare multiple PDFs to identify exam focus areas (because we know you're only here for the exam prep)
- **AI Summaries**: Get the TL;DR of your 50-page research paper in seconds

### 👥 Multiplayer Features (Because Studying is Better Together)
- **Real-Time Voice Chat**: Study groups but make it digital and with less awkward silence
- **File Sharing**: Share PDFs in voice chat because emailing is for boomers
- **Live Cursors**: See where everyone else is clicking (featuring the Ably Spaces API)
- **Collaborative Whiteboard**: Using TLDraw for those moments when words just don't cut it
- **Sync Everything**: Real-time synchronization that would make Dropbox jealous

### 🎨 UI/UX That Doesn't Hurt Your Eyes
- **Framer Motion Animations**: Smooth transitions that make you feel like you're using a premium app
- **Tailwind CSS**: Because writing custom CSS is for people with time on their hands
- **Radix UI Components**: Professional-looking buttons and modals that just *work*
- **Responsive Design**: Works on your phone, tablet, laptop, and probably your smart fridge
- **Auth0 Integration**: Secure login because nobody wants random people accessing their study materials

### 🔧 Technical Wizardry Under the Hood
- **React + Vite**: Fast development because ain't nobody got time for Webpack configs
- **Express Backend**: Node.js server handling all the heavy lifting
- **Socket.io**: Real-time websockets for that sweet, sweet instant communication
- **Multer**: File uploads that don't make you want to cry
- **Google Generative AI**: The actual brains of the operation

## 🧑‍💻 How To Install (The "It Works On My Machine" Guide)

### Prerequisites (AKA "Things You Need First")

- **Node.js** (v18.0+): Because JavaScript on the server is a lifestyle choice
- **npm** (comes with Node): The package manager that downloads half the internet
- **A Google API Key**: For Gemini AI (the secret sauce)
- **An Ably API Key**: For those fancy live cursors
- **An Auth0 Account**: Because security matters (sometimes)
- **Coffee**: Not technically required but strongly recommended
- **A sense of humor**: This is a college project, expectations should be managed accordingly

### Setup Instructions (Copy-Paste Your Way to Success)

#### 1. **Clone this bad boy**

```bash
git clone https://github.com/RealNickey/Learn-Link.git
cd Learn-Link
```

#### 2. **Backend Setup** (The Part That Does The Thinking)

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
# Google Gemini AI (Get this from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Port (or let it default to 3000)
PORT=3000

# Base URL (for file sharing)
BASE_URL=http://localhost:3000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

#### 3. **Frontend Setup** (The Pretty Part)

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
# Auth0 Configuration (Get these from https://auth0.com)
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
VITE_AUTH0_AUDIENCE=your_api_audience

# Ably API Key (Get this from https://ably.com)
VITE_ABLY_KEY=your_ably_api_key_here

# Backend API URL
VITE_API_URL=http://localhost:3000
```

#### 4. **Fire Up The Engines** (Run Both Servers)

In one terminal (backend):
```bash
cd backend
npm run dev
```

In another terminal (frontend):
```bash
cd frontend
npm run dev
```

#### 5. **Access The Application**

Open your browser and navigate to `http://localhost:5173`

If you see a beautiful landing page with animations, congratulations! If you see errors, welcome to software development! 🎉

## 📖 Usage Guide (How To Actually Use This Thing)

### For Students (Who Should Probably Be Studying Right Now)

1. **Login/Signup**
   - Click the fancy "GET STARTED" button with the spinning gradient border
   - Auth0 will handle the authentication (because we don't trust ourselves with passwords)
   - Watch the cool page transition animation

2. **Upload Your Study Materials**
   - Drag and drop PDFs into the upload zone (or click like a peasant)
   - Watch as the files appear in your list with satisfying animations
   - Marvel at the modern UI that makes you feel productive

3. **Generate AI Magic**
   - **Quiz Time**: Click the graduation cap icon and watch AI generate 5 quiz questions from your PDF
   - **Flashcards**: Hit the flashcard icon to get auto-generated study cards
   - **Ask Questions**: Type in the AI chat and ask anything about your uploaded PDFs
   - **Compare PDFs**: Upload multiple PDFs to find common exam topics (work smarter, not harder)

4. **Collaborate With Friends**
   - Join voice chat to talk with your study group
   - Share files in real-time during voice sessions
   - Use the collaborative whiteboard for those "let me draw this out" moments
   - Watch other people's cursors move around (it's oddly mesmerizing)

### For Developers (Who Want To Understand This Chaos)

**Key Files & What They Do:**

- `backend/server.js`: Main Express server handling file uploads, API endpoints, and CORS
- `backend/aiService.js`: Google Gemini AI integration for quiz/flashcard/chat generation
- `backend/voiceChat.js`: Socket.io implementation for real-time voice chat and file sharing
- `frontend/src/dashboard.jsx`: The main dashboard with ALL the features (850+ lines of React chaos)
- `frontend/src/components/ui/`: Reusable components including file upload, quiz panel, flashcards, voice chat, etc.

**Architecture Overview:**
```
Frontend (React + Vite)
    ↓
    ├── Auth0 (Authentication)
    ├── Socket.io Client (Real-time features)
    └── REST API Calls
            ↓
Backend (Express.js)
    ├── Multer (File uploads)
    ├── Socket.io Server (WebSockets)
    ├── Google Gemini AI (The smart stuff)
    └── File storage (/uploads directory)
```

## 🎯 Project Structure (Where Everything Lives)

```
Learn-Link/
├── backend/
│   ├── server.js              # Main Express server
│   ├── aiService.js           # Google Gemini AI integration
│   ├── voiceChat.js           # Socket.io voice chat implementation
│   ├── package.json           # Backend dependencies
│   └── uploads/               # Where your PDFs go to live
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main app component with routing
│   │   ├── dashboard.jsx      # The beast - main dashboard (850+ lines)
│   │   ├── LandingPage.jsx    # Pretty landing page
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── file-upload.jsx      # Drag & drop file uploads
│   │   │   │   ├── quiz-panel.jsx       # Quiz interface
│   │   │   │   ├── flash-card.jsx       # Flashcard viewer
│   │   │   │   ├── voice-chat.jsx       # Voice chat component
│   │   │   │   ├── livecursor.jsx       # Multiplayer cursors
│   │   │   │   ├── dock.jsx             # macOS-style dock
│   │   │   │   └── ... (many more)
│   │   │   └── PageTransition.jsx   # Smooth page transitions
│   │   ├── styles/            # CSS files
│   │   └── lib/               # Utility functions
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite configuration
│
└── README.md                  # This beautiful document
```

## 🐛 Known Issues (AKA "Features We're Thinking About")

- Sometimes the AI generates questions that are... creative (to put it nicely)
- Voice chat might need you to refresh if connections get wonky
- The whiteboard occasionally forgets what you drew (it's trying its best)
- File uploads over 10MB might make the backend cry
- The live cursors can be distracting during serious study sessions
- That one weird CORS error that appears randomly and then disappears (we don't talk about it)

## 🤝 Contributing (Join The Chaos)

Want to add features or fix bugs? Here's how:

1. Fork the repository (click that fork button)
2. Create a feature branch: `git checkout -b feature/mind-blowing-feature`
3. Make your changes (try not to break everything)
4. Test it (seriously, test it)
5. Commit with a descriptive message: `git commit -m 'Add feature that definitely works'`
6. Push to your branch: `git push origin feature/mind-blowing-feature`
7. Open a Pull Request and describe what you did

**Contribution Guidelines:**
- Write code that you'd be proud to show your professor
- Comment your code (future you will thank present you)
- If you add a new dependency, have a good reason
- Fix bugs without creating two more (we call that "bug inflation")

## 🎓 Tech Stack (The Buzzword Bingo Winner)

**Frontend:**
- React 18.3 (Hooks galore)
- Vite (Fast refresh that makes you productive)
- Tailwind CSS (Utility classes for days)
- Framer Motion (Animations that *chef's kiss*)
- Socket.io Client (Real-time everything)
- TLDraw (Collaborative whiteboard)
- Radix UI (Components that work)
- Auth0 React (Security is not optional)
- Ably Spaces (Multiplayer magic)

**Backend:**
- Node.js + Express (Classic combo)
- Socket.io (WebSocket wizardry)
- Google Generative AI (Gemini API)
- Multer (File upload handler)
- CORS (Because browsers are picky)

**Deployment:**
- Vercel (Frontend hosting)
- Vercel Serverless Functions (Backend hosting)
- Environment variables (Keeping secrets secret)

## 📊 Stats (Because Numbers Look Impressive)

- **Lines of Code**: Too many to count (we stopped at "a lot")
- **Dependencies**: 50+ npm packages (we like living on the edge)
- **Features**: 10+ major features (each with their own quirks)
- **Coffee Consumed**: Probably illegal amounts
- **Stack Overflow Visits**: Yes.
- **"It Works On My Machine" Count**: Lost track after 47

## 🎉 Acknowledgements (Standing On The Shoulders of Giants)

This project wouldn't exist without:
- **Google Gemini AI**: For making our PDF processing actually intelligent
- **Ably**: For the real-time multiplayer features
- **Auth0**: For handling authentication so we don't have to
- **The React Team**: For making frontend development bearable
- **Stack Overflow**: For... you know
- **Coffee**: The real MVP
- **That One Tutorial**: You know which one
- **Our Professors**: For accepting this as a mini project

## 📝 License

MIT License - Do whatever you want with this code, just don't blame us if it breaks.

## 📞 Contact & Links

**Project Maintainer**: [RealNickey](https://github.com/RealNickey)

**Project Repository**: [https://github.com/RealNickey/Learn-Link](https://github.com/RealNickey/Learn-Link)

**Live Demo**: _Coming soon™_ (Vercel deployment in progress)

**Issues/Bugs**: [Open an issue](https://github.com/RealNickey/Learn-Link/issues) and we'll pretend to fix it promptly

---

## 🚀 Final Thoughts

This started as a college mini project and somehow evolved into a full-featured collaborative learning platform with AI, real-time multiplayer features, and more animations than a Pixar movie. 

Is it perfect? No. Does it work? Most of the time. Will it help you study? Probably more than staring at your textbook at 3am.

Built with ❤️, ☕, and a concerning amount of late-night coding sessions.

**Now stop reading this README and go study!** 📚

---

*P.S. - If this README made you smile, star the repo. If it made you laugh, fork it. If it made you want to contribute, we need you!*

*P.P.S. - Yes, the live cursors are unnecessary. No, we're not removing them. They're cool.*
