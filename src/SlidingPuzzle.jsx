import { useState, useEffect, useRef, useCallback } from "react";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');
  .pz-root { font-family: 'Syne', sans-serif; max-width: 340px; margin: 2rem auto; padding: 0 1rem 2rem; }
  .pz-eyebrow { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #888; margin: 0 0 4px; font-family: 'Space Mono', monospace; }
  .pz-heading { font-size: 28px; font-weight: 800; margin: 0 0 1.5rem; line-height: 1; }
  .pz-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 1rem; }
  .pz-stat { background: #f5f5f5; border-radius: 8px; padding: 10px 12px; text-align: center; }
  .pz-stat-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #888; font-family: 'Space Mono', monospace; margin-bottom: 4px; }
  .pz-stat-value { font-size: 22px; font-weight: 700; font-family: 'Space Mono', monospace; line-height: 1; }
  .pz-win { display: none; background: #eaf3de; border: 1px solid #97c459; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1rem; text-align: center; }
  .pz-win.show { display: block; }
  .pz-win-title { font-size: 18px; font-weight: 800; color: #3b6d11; margin: 0 0 4px; }
  .pz-win-sub { font-size: 12px; font-family: 'Space Mono', monospace; color: #639922; }
  .pz-board-wrap { background: #f5f5f5; border-radius: 16px; padding: 12px; margin-bottom: 1rem; border: 1px solid #e0e0e0; }
  .pz-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; aspect-ratio: 1; }
  .pz-tile { border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 30px; font-family: 'Space Mono', monospace; font-weight: 700; cursor: pointer; transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1); user-select: none; border: 1px solid #ddd; background: #fff; aspect-ratio: 1; }
  .pz-tile:hover { transform: scale(0.92); }
  .pz-tile:active { transform: scale(0.85); }
  .pz-tile.empty { background: transparent !important; border-color: transparent !important; cursor: default; pointer-events: none; }
  .pz-tile.correct { background: #eaf3de !important; border-color: #97c459 !important; color: #3b6d11 !important; }
  .pz-tile.hint { background: #fff8e1 !important; border-color: #ffc107 !important; color: #795548 !important; transform: scale(0.95); }
  .pz-actions { display: flex; gap: 8px; margin-bottom: 8px; }
  .pz-actions2 { display: flex; gap: 8px; }
  .pz-btn { flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #ccc; background: #fff; font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 0.08em; cursor: pointer; font-weight: 700; transition: background 0.12s, transform 0.1s; }
  .pz-btn:hover { background: #f5f5f5; }
  .pz-btn:active { transform: scale(0.97); }
  .pz-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .pz-btn.primary { background: #111; color: #fff; border-color: transparent; }
  .pz-btn.primary:hover { opacity: 0.85; }
  .pz-info { font-size: 11px; font-family: 'Space Mono', monospace; color: #888; text-align: center; margin-top: 10px; min-height: 16px; }
  .pz-info.solving { color: #1565c0; }
`;

// ── helpers ──────────────────────────────────────────────────────────────────

function isSolvable(arr) {
  let inv = 0;
  const flat = arr.filter((x) => x !== 0);
  for (let i = 0; i < flat.length; i++)
    for (let j = i + 1; j < flat.length; j++)
      if (flat[i] > flat[j]) inv++;
  return inv % 2 === 0;
}

function isSolved(arr) {
  for (let i = 0; i < 8; i++) if (arr[i] !== i + 1) return false;
  return arr[8] === 0;
}

function makeShuffle() {
  let arr;
  do {
    arr = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  } while (!isSolvable(arr) || isSolved(arr));
  return arr;
}

function fmtTime(s) {
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

// ── A* solver ────────────────────────────────────────────────────────────────
// Heuristic: Manhattan distance

function manhattan(arr) {
  let dist = 0;
  for (let i = 0; i < 9; i++) {
    if (arr[i] === 0) continue;
    const goal = arr[i] - 1;
    dist +=
      Math.abs(Math.floor(i / 3) - Math.floor(goal / 3)) +
      Math.abs((i % 3) - (goal % 3));
  }
  return dist;
}

function getNeighbors(arr) {
  const neighbors = [];
  const empty = arr.indexOf(0);
  const r = Math.floor(empty / 3), c = empty % 3;
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    const nr = r + dr, nc = c + dc;
    if (nr < 0 || nr > 2 || nc < 0 || nc > 2) continue;
    const ni = nr * 3 + nc;
    const next = [...arr];
    [next[empty], next[ni]] = [next[ni], next[empty]];
    neighbors.push({ state: next, moved: ni });
  }
  return neighbors;
}

function aStar(start) {
  const goalKey = "1,2,3,4,5,6,7,8,0";
  if (start.join(",") === goalKey) return [];

  // open list as a simple sorted array — fine for 8-puzzle (max depth ~31)
  const open = [{ state: start, g: 0, h: manhattan(start), path: [] }];
  const visited = new Set([start.join(",")]);

  while (open.length) {
    open.sort((a, b) => (a.g + a.h) - (b.g + b.h));
    const { state, g, path } = open.shift();

    for (const { state: next, moved } of getNeighbors(state)) {
      const nk = next.join(",");
      if (visited.has(nk)) continue;
      const newPath = [...path, moved];
      if (nk === goalKey) return newPath;
      visited.add(nk);
      open.push({ state: next, g: g + 1, h: manhattan(next), path: newPath });
    }
  }
  return null;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SlidingPuzzle3x3() {
  const [tiles, setTiles]         = useState(() => makeShuffle());
  const [moves, setMoves]         = useState(0);
  const [seconds, setSeconds]     = useState(0);
  const [running, setRunning]     = useState(false);
  const [won, setWon]             = useState(false);
  const [best, setBest]           = useState(null);
  const [solving, setSolving]     = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [hintIdx, setHintIdx]     = useState(null);

  const timerRef   = useRef(null);
  const solveRef   = useRef(null);
  const tilesRef   = useRef(tiles);
  tilesRef.current = tiles;

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [running]);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearInterval(solveRef.current);
  }, []);

  const stopSolve = () => {
    clearInterval(solveRef.current);
    setSolving(false);
  };

  const reset = useCallback((doShuffle) => {
    stopSolve();
    clearInterval(timerRef.current);
    setTiles(doShuffle ? makeShuffle() : [1,2,3,4,5,6,7,8,0]);
    setMoves(0);
    setSeconds(0);
    setRunning(false);
    setWon(false);
    setHintIdx(null);
    setStatusMsg("");
  }, []);

  const handleClick = (idx) => {
    if (won || solving || tiles[idx] === 0) return;
    const emptyIdx = tiles.indexOf(0);
    const r1 = Math.floor(idx / 3), c1 = idx % 3;
    const r2 = Math.floor(emptyIdx / 3), c2 = emptyIdx % 3;
    const adjacent =
      (r1 === r2 && Math.abs(c1 - c2) === 1) ||
      (c1 === c2 && Math.abs(r1 - r2) === 1);
    if (!adjacent) return;

    const next = [...tiles];
    [next[idx], next[emptyIdx]] = [next[emptyIdx], next[idx]];
    const newMoves = moves + 1;
    setTiles(next);
    setMoves(newMoves);
    setHintIdx(null);
    if (!running) setRunning(true);

    if (isSolved(next)) {
      setRunning(false);
      setWon(true);
      setBest((prev) => (prev === null || seconds < prev ? seconds : prev));
      setStatusMsg("");
    }
  };

  // show the next optimal tile to move
  const handleHint = () => {
    if (won || solving) return;
    const path = aStar(tiles);
    if (!path || path.length === 0) return;
    setHintIdx(path[0]);
    setStatusMsg("Hint: tap the highlighted tile");
  };

  // animate the full A* solution step by step
  const handleSolve = () => {
    if (solving) { stopSolve(); setStatusMsg("Stopped."); return; }
    if (won) return;

    const path = aStar(tiles);
    if (!path || path.length === 0) { setStatusMsg("Already solved!"); return; }

    setSolving(true);
    setHintIdx(null);
    setStatusMsg(`A* found solution in ${path.length} moves…`);
    if (!running) setRunning(true);

    let step = 0;
    solveRef.current = setInterval(() => {
      const moveIdx = path[step];
      const cur = tilesRef.current;
      const emptyIdx = cur.indexOf(0);
      const next = [...cur];
      [next[moveIdx], next[emptyIdx]] = [next[emptyIdx], next[moveIdx]];
      setTiles(next);
      setMoves((m) => m + 1);
      step++;

      if (step >= path.length) {
        clearInterval(solveRef.current);
        setSolving(false);
        setRunning(false);
        setWon(true);
        setStatusMsg(`Solved by A* in ${path.length} moves!`);
        setBest((prev) => (prev === null || seconds < prev ? seconds : prev));
      }
    }, 350);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="pz-root">
        <p className="pz-eyebrow">Sliding Puzzle</p>
        <h1 className="pz-heading">8-Puzzle</h1>

        <div className="pz-stats">
          <div className="pz-stat">
            <div className="pz-stat-label">Moves</div>
            <div className="pz-stat-value">{moves}</div>
          </div>
          <div className="pz-stat">
            <div className="pz-stat-label">Time</div>
            <div className="pz-stat-value">{fmtTime(seconds)}</div>
          </div>
          <div className="pz-stat">
            <div className="pz-stat-label">Best</div>
            <div className="pz-stat-value">{best !== null ? fmtTime(best) : "—"}</div>
          </div>
        </div>

        <div className={`pz-win${won ? " show" : ""}`}>
          <div className="pz-win-title">Puzzle Solved!</div>
          <div className="pz-win-sub">{moves} moves · {fmtTime(seconds)}</div>
        </div>

        <div className="pz-board-wrap">
          <div className="pz-board">
            {tiles.map((val, idx) => {
              const isEmpty   = val === 0;
              const isCorrect = !isEmpty && val === idx + 1;
              const isHint    = !isEmpty && idx === hintIdx;
              return (
                <div
                  key={idx}
                  className={
                    "pz-tile" +
                    (isEmpty   ? " empty"   : "") +
                    (isCorrect ? " correct" : "") +
                    (isHint    ? " hint"    : "")
                  }
                  onClick={() => handleClick(idx)}
                >
                  {isEmpty ? "" : val}
                </div>
              );
            })}
          </div>
        </div>

        {/* row 1: shuffle + reset */}
        <div className="pz-actions">
          <button className="pz-btn primary" onClick={() => reset(true)} disabled={solving}>
            SHUFFLE
          </button>
          <button className="pz-btn" onClick={() => reset(false)} disabled={solving}>
            RESET
          </button>
        </div>

        {/* row 2: hint + a* solve */}
        <div className="pz-actions2">
          <button
            className="pz-btn"
            style={{ background: "#f57f17", color: "#fff", borderColor: "transparent" }}
            onClick={handleHint}
            disabled={won || solving}
          >
            HINT
          </button>
          <button
            className="pz-btn"
            style={
              solving
                ? { background: "#c62828", color: "#fff", borderColor: "transparent" }
                : { background: "#1565c0", color: "#fff", borderColor: "transparent" }
            }
            onClick={handleSolve}
            disabled={won && !solving}
          >
            {solving ? "STOP" : "A* SOLVE"}
          </button>
        </div>

        <p className={`pz-info${solving ? " solving" : ""}`}>{statusMsg}</p>
      </div>
    </>
  );
}