# 8-Puzzle — Sliding Puzzle Game

A classic 3×3 sliding puzzle (8-puzzle) built with **React** and **Vite**. Slide the tiles into the correct order to win.

---

## Features

- 3×3 sliding puzzle board (tiles 1–8 + one empty space)
- Shuffle button — generates a guaranteed-solvable random board every time
- Move counter — tracks every tile you slide
- Timer — starts on your first move, stops when you solve it
- Best time — remembered for the session
- Win detection — highlights correct tiles and shows a win banner on completion

---

## Tech Stack

| Tool | Purpose |
|---|---|
| [React 18](https://react.dev/) | UI and state management |
| [Vite](https://vitejs.dev/) | Dev server and build tool |
| [Google Fonts](https://fonts.google.com/) | Space Mono + Syne typography |
| CSS-in-JS (inline styles string) | Scoped component styles, no extra libraries |

---

## Project Structure

```
my-puzzle/
├── public/
├── src/
│   ├── SlidingPuzzle3x3.jsx   ← main puzzle component
│   ├── App.jsx                ← mounts the component
│   ├── main.jsx               ← React entry point
│   └── index.css              ← global reset (keep empty)
├── index.html
├── package.json
└── vite.config.js
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node)

### Installation

```bash
# 1. Clone or download the project
git clone https://github.com/your-username/my-puzzle.git
cd my-puzzle

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local development server |
| `npm run build` | Build for production (output in `dist/`) |
| `npm run preview` | Preview the production build locally |

---

## How to Play

1. Click **SHUFFLE** to randomize the board
2. Click any tile adjacent to the empty space to slide it
3. Arrange tiles in order from 1 to 8 (left to right, top to bottom)
4. The timer starts on your first move — try to solve it in as few moves as possible
5. Click **RESET** to restore the solved board without shuffling

---





## License

MIT — free to use, modify, and distribute.