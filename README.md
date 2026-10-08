# DFA Equivalence Tester 🔄

An interactive, high-performance web tool and **Progressive Web App (PWA)** for testing the language equivalence of Deterministic Finite Automata (**DFA**) using **Product Automaton Construction** and **Breadth-First Search (BFS)** traversal.

---

## 🌟 Key Features

* **⚡ Language Equivalence Testing**:
  * Determines whether $L(M_1) = L(M_2)$ by exploring the Cartesian product automaton $M_1 \times M_2$.
  * Extracts distinguishing counterexample witness strings when automata are non-equivalent.
* **🎨 Modern SVG Automata Diagrams**:
  * Outward-facing circular self-loops that never collide with inner state transitions.
  * Opposing curved vectors for bidirectional transitions ($q_i \leftrightarrow q_j$).
  * Grouped transition labels (e.g. `0, 1`) for clean readability.
  * Textbook-standard automata theory notations: pure white state nodes with **double concentric circles** for accepting/final states.
* **📊 Joint State Equivalence Diagram**:
  * Automatically renders the full Product Automaton state transition graph upon test execution.
* **📱 Progressive Web App (PWA)**:
  * Installable directly on Windows, macOS, Android, and iOS as a standalone desktop/mobile app.
  * Offline-capable with Service Worker asset caching (`dfaeq-cache-v2`).
* **🚀 Cloud-Ready Deployment**:
  * Pre-configured for instant zero-cold-start hosting on **Vercel** (`vercel.json`) and **Render**.

---

## 🛠️ Tech Stack

* **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 (Glassmorphism & Flex/Grid), SVG Vector Graphics
* **Backend**: Python 3, Flask
* **App Platform**: Progressive Web App (Service Worker, Web App Manifest)
* **Deployment**: Vercel Serverless (`@vercel/python`), Gunicorn

---

## 🚀 Getting Started Locally

### 1. Clone the repository
```bash
git clone https://github.com/shafinpatelml24/DFA-Equivalance.git
cd DFA-Equivalance
```

### 2. Set up virtual environment
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the application
```bash
python app.py
```
Open your browser and navigate to:
👉 `http://127.0.0.1:5000`

---

## 📱 Installing as a Desktop / Mobile App (PWA)

1. Open the website in **Google Chrome** or **Microsoft Edge**.
2. Click the **"📲 Install App"** button in the top navigation bar (or the install icon in the browser address bar).
3. The app will launch in an independent desktop window and add a shortcut to your desktop and Start Menu!

---

## 🌐 Deploy to Vercel

This repository includes a pre-configured `vercel.json` for instant serverless deployment:
1. Log in to [vercel.com](https://vercel.com) with GitHub.
2. Click **Add New...** &rarr; **Project** &rarr; Select `DFA-Equivalance`.
3. Click **Deploy**. Vercel will build and serve your app globally with zero cold starts!

---

## 📄 License
This project is open-source and available under the MIT License.
