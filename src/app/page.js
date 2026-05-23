"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import Image from "next/image";

// ─── Shared Utilities ────────────────────────────────────────────────────────

function padZero(num, digits = 2) {
  return String(Math.floor(num)).padStart(digits, "0");
}

function formatWithCommas(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Convert "YYYY-MM-DD" to a Date at midnight US Central (America/Chicago)
function midnightCentral(dateStr) {
  const noonUTC = new Date(dateStr + "T12:00:00Z");
  const centralHour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour: "numeric",
      hour12: false,
    })
      .formatToParts(noonUTC)
      .find((p) => p.type === "hour").value
  );
  const offsetHours = 12 - centralHour;
  return new Date(dateStr + "T" + String(offsetHours).padStart(2, "0") + ":00:00Z");
}

// Format milliseconds → "MM:SS.ms" or "HH:MM:SS.ms"
function formatStopwatchTime(ms, showHours = false) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);

  if (showHours || h > 0) {
    return {
      h: padZero(h),
      m: padZero(m),
      s: padZero(s),
      cs: padZero(centiseconds),
    };
  }
  return {
    h: null,
    m: padZero(m),
    s: padZero(s),
    cs: padZero(centiseconds),
  };
}

// ─── Background ──────────────────────────────────────────────────────────────

function AppBackground() {
  return (
    <div className="app-background">
      <Image src="/hero-bg.png" alt="" fill className="bg-image" priority />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}

// ─── Tab Bar ─────────────────────────────────────────────────────────────────

function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className="tab-bar" role="tablist" aria-label="App tabs">
      <button
        id="tab-stopwatch"
        role="tab"
        aria-selected={activeTab === "stopwatch"}
        className={`tab-btn ${activeTab === "stopwatch" ? "tab-active" : ""}`}
        onClick={() => onTabChange("stopwatch")}
      >
        <span className="tab-icon">⏱</span>
        <span>Stopwatch</span>
      </button>
      <button
        id="tab-countdown"
        role="tab"
        aria-selected={activeTab === "countdown"}
        className={`tab-btn ${activeTab === "countdown" ? "tab-active" : ""}`}
        onClick={() => onTabChange("countdown")}
      >
        <span className="tab-icon">⏳</span>
        <span>Countdown</span>
      </button>
    </nav>
  );
}

// ─── Stopwatch Tab ───────────────────────────────────────────────────────────

function StopwatchTab() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState([]);
  const [lapStart, setLapStart] = useState(0);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);
  const baseElapsedRef = useRef(0);
  const lapStartRef = useRef(0);
  const swRingRef = useRef(null);
  const RING_CIRC = 2 * Math.PI * 88;
  const [ringOffset, setRingOffset] = useState(RING_CIRC * (1 - ((0 % 60000) / 60000)));

  // Sync refs with state so keydown handler can read them
  const runningRef = useRef(false);

  // RAF-based update loop
  const tick = useCallback(() => {
    const now = performance.now();
    const newElapsed = baseElapsedRef.current + (now - startTimeRef.current);
    setElapsed(newElapsed);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Update the SVG progress circle in per-second ticks while running.
  useEffect(() => {
    let id = null;
    const update = () => {
      const now = performance.now();
      const current = runningRef.current && startTimeRef.current ? baseElapsedRef.current + (now - startTimeRef.current) : baseElapsedRef.current;
      const seconds = Math.floor((current % 60000) / 1000); // 0..59
      const offset = RING_CIRC * (1 - (seconds / 60));
      setRingOffset(offset);
    };

    // set initial offset
    update();
    if (runningRef.current) id = setInterval(update, 1000);
    return () => { if (id) clearInterval(id); };
  }, [running]);

  const startStop = useCallback(() => {
    if (runningRef.current) {
      // Pause
      cancelAnimationFrame(rafRef.current);
      baseElapsedRef.current += performance.now() - startTimeRef.current;
      setRunning(false);
      runningRef.current = false;
    } else {
      // Start
      startTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
      setRunning(true);
      runningRef.current = true;
    }
  }, [tick]);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    baseElapsedRef.current = 0;
    lapStartRef.current = 0;
    startTimeRef.current = null;
    setElapsed(0);
    setLaps([]);
    setLapStart(0);
    setRunning(false);
    runningRef.current = false;
  }, []);

  const takeLap = useCallback(() => {
    if (!runningRef.current && baseElapsedRef.current === 0) return;
    const current =
      runningRef.current
        ? baseElapsedRef.current + (performance.now() - startTimeRef.current)
        : baseElapsedRef.current;
    const lapDuration = current - lapStartRef.current;
    setLaps((prev) => [{ total: current, duration: lapDuration, number: prev.length + 1 }, ...prev]);
    lapStartRef.current = current;
    setLapStart(current);
  }, []);

  // Keyboard shortcuts: Space = start/stop, L = lap, R = reset
  useEffect(() => {
    const handler = (e) => {
      // Don't fire on inputs
      if (e.target.tagName === "INPUT" || e.target.getAttribute("contenteditable") === "true") return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          startStop();
          break;
        case "l":
        case "L":
          e.preventDefault();
          takeLap();
          break;
        case "r":
        case "R":
          e.preventDefault();
          reset();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [startStop, takeLap, reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Current lap duration
  const currentLapElapsed = elapsed - lapStart;

  // Time components
  const hours = Math.floor(elapsed / 3600000);
  const showHours = hours > 0;
  const time = formatStopwatchTime(elapsed, showHours);

  // Lap stats
  const lapDurations = laps.map((l) => l.duration);
  const minLap = lapDurations.length > 0 ? Math.min(...lapDurations) : null;
  const maxLap = lapDurations.length > 0 ? Math.max(...lapDurations) : null;
  const avgLap = lapDurations.length > 0 ? lapDurations.reduce((a, b) => a + b, 0) / lapDurations.length : null;

  return (
    <div className="stopwatch-container">
      {/* Main Display */}
      <div className={`sw-display ${running ? "sw-running" : ""}`}>
        <div className="sw-ring">
          <svg className="sw-ring-svg" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="88" className="sw-ring-track" />
            <circle
              cx="100"
              cy="100"
              r="88"
              ref={swRingRef}
              className="sw-ring-progress"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={ringOffset}
            />
          </svg>
          <div className="sw-time-inner">
            {time.h !== null && (
              <span className="sw-hours">{time.h}<span className="sw-sep">:</span></span>
            )}
            <span className="sw-minutes">{time.m}</span>
            <span className="sw-sep">:</span>
            <span className="sw-seconds">{time.s}</span>
            <span className="sw-dot">.</span>
            <span className="sw-centiseconds">{time.cs}</span>
          </div>
        </div>

        {/* Current lap time under the ring */}
        {(running || elapsed > 0) && (
          <div className="sw-curlap">
            <span className="sw-curlap-label">Current Lap</span>
            <span className="sw-curlap-time">
              {(() => {
                const t = formatStopwatchTime(currentLapElapsed);
                return `${t.m}:${t.s}.${t.cs}`;
              })()}
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="sw-controls">
        <button
          id="sw-lap-btn"
          className="sw-btn sw-btn-secondary"
          onClick={takeLap}
          disabled={!running && elapsed === 0}
          aria-label="Take lap"
          title="Lap (L)"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
            <path d="M12 7v5l4 2"/>
          </svg>
          Lap
        </button>

        <button
          id="sw-start-btn"
          className={`sw-btn sw-btn-primary ${running ? "sw-btn-stop" : "sw-btn-start"}`}
          onClick={startStop}
          aria-label={running ? "Stop stopwatch" : "Start stopwatch"}
          title="Start / Stop (Space)"
        >
          {running ? (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
              Start
            </>
          )}
        </button>

        <button
          id="sw-reset-btn"
          className="sw-btn sw-btn-secondary"
          onClick={reset}
          disabled={elapsed === 0 && laps.length === 0}
          aria-label="Reset stopwatch"
          title="Reset (R)"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
          </svg>
          Reset
        </button>
      </div>

      {/* Keyboard hints */}
      <div className="sw-kbd-hints">
        <span className="sw-kbd"><kbd>Space</kbd> Start/Stop</span>
        <span className="sw-kbd"><kbd>L</kbd> Lap</span>
        <span className="sw-kbd"><kbd>R</kbd> Reset</span>
      </div>

      {/* Stats Row */}
      {laps.length >= 2 && (
        <div className="sw-stats">
          <div className="sw-stat">
            <span className="sw-stat-label">🏆 Best</span>
            <span className="sw-stat-value sw-best">
              {(() => { const t = formatStopwatchTime(minLap); return `${t.m}:${t.s}.${t.cs}`; })()}
            </span>
          </div>
          <div className="sw-stat">
            <span className="sw-stat-label">📊 Avg</span>
            <span className="sw-stat-value">
              {(() => { const t = formatStopwatchTime(avgLap); return `${t.m}:${t.s}.${t.cs}`; })()}
            </span>
          </div>
          <div className="sw-stat">
            <span className="sw-stat-label">🐢 Worst</span>
            <span className="sw-stat-value sw-worst">
              {(() => { const t = formatStopwatchTime(maxLap); return `${t.m}:${t.s}.${t.cs}`; })()}
            </span>
          </div>
        </div>
      )}

      {/* Lap list */}
      {laps.length > 0 && (
        <div className="sw-laps">
          <div className="sw-laps-header">
            <span>Lap</span>
            <span>Lap Time</span>
            <span>Total</span>
          </div>
          <div className="sw-laps-list">
            {laps.map((lap, idx) => {
              const isBest = lap.duration === minLap && laps.length > 1;
              const isWorst = lap.duration === maxLap && laps.length > 1;
              const total = formatStopwatchTime(lap.total);
              const duration = formatStopwatchTime(lap.duration);
              return (
                <div
                  key={lap.number}
                  className={`sw-lap-row ${idx === 0 && running ? "sw-lap-latest" : ""} ${isBest ? "sw-lap-best" : ""} ${isWorst ? "sw-lap-worst" : ""}`}
                >
                  <span className="sw-lap-num">
                    {isBest && <span className="sw-lap-badge sw-badge-best">●</span>}
                    {isWorst && <span className="sw-lap-badge sw-badge-worst">●</span>}
                    {!isBest && !isWorst && <span className="sw-lap-badge" />}
                    Lap {lap.number}
                  </span>
                  <span className="sw-lap-dur">{duration.m}:{duration.s}.{duration.cs}</span>
                  <span className="sw-lap-total">{total.m}:{total.s}.{total.cs}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Countdown Tab ───────────────────────────────────────────────────────────

const DEFAULT_NAME = "BOL Web 2.0";
const DEFAULT_DATE = "2026-05-18";
const DEFAULT_START_DATE = "2023-09-25";

function HelpModal({ isOpen, onClose, activeTab }) {
  if (!isOpen) return null;
  const isStopwatch = activeTab === "stopwatch";

  return (
    <div className="modal-overlay" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          &times;
        </button>
        <h2 className="modal-title">
          {isStopwatch ? "How to Use Stopwatch" : "How to Use Countdown"}
        </h2>
        <div className="help-list">
          {isStopwatch ? (
            <>
              <div className="help-item">
                <span className="help-icon">⏱️</span>
                <div className="help-text">
                  <h3>Start and Stop</h3>
                  <p>Press Start button or Space on keyboard to start or pause the stopwatch at any time.</p>
                </div>
              </div>
              <div className="help-item">
                <span className="help-icon">🏁</span>
                <div className="help-text">
                  <h3>Record Laps</h3>
                  <p>Press L to capture a lap split while the stopwatch is running.</p>
                </div>
              </div>
              <div className="help-item">
                <span className="help-icon">🔁</span>
                <div className="help-text">
                  <h3>Reset</h3>
                  <p>Press R to reset the stopwatch and clear all lap data.</p>
                </div>
              </div>
              <div className="help-item">
                <span className="help-icon">📊</span>
                <div className="help-text">
                  <h3>Lap Stats</h3>
                  <p>Get instant best, average, and worst lap times when you record two or more laps.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="help-item">
                <span className="help-icon">✏️</span>
                <div className="help-text">
                  <h3>Personalize Your Event</h3>
                  <p>Click on the title to change the name of your countdown. It saves instantly as you type.</p>
                </div>
              </div>
              <div className="help-item">
                <span className="help-icon">📅</span>
                <div className="help-text">
                  <h3>Set Your Dates</h3>
                  <p>Adjust the Start and Target dates to sync the timer with your specific schedule.</p>
                </div>
              </div>
              <div className="help-item">
                <span className="help-icon">⏱️</span>
                <div className="help-text">
                  <h3>Live Precision</h3>
                  <p>Track every moment with a high-accuracy display down to the millisecond.</p>
                </div>
              </div>
              <div className="help-item">
                <span className="help-icon">🎉</span>
                <div className="help-text">
                  <h3>Celebration Mode</h3>
                  <p>Tap or click anywhere on the background to trigger a vibrant confetti burst.</p>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="got-it-btn" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

function CountdownTab({ onHelpOpen }) {
  const [countdownName, setCountdownName] = useState(DEFAULT_NAME);
  const [targetDate, setTargetDate] = useState(DEFAULT_DATE);
  const [startDate, setStartDate] = useState(DEFAULT_START_DATE);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [mounted, setMounted] = useState(false);
  const nameRef = useRef(null);

  const calculateTimeLeft = useCallback(() => {
    const target = midnightCentral(targetDate);
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      setIsComplete(true);
      return { days: 0, hours: 0, minutes: 0, seconds: 0, milliseconds: 0, totalMs: 0 };
    }

    setIsComplete(false);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const milliseconds = diff % 1000;
    return { days, hours, minutes, seconds, milliseconds, totalMs: diff };
  }, [targetDate]);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 47);
    return () => clearInterval(interval);
  }, [calculateTimeLeft]);

  const getProgress = useCallback(() => {
    const start = midnightCentral(startDate);
    const target = midnightCentral(targetDate);
    const now = new Date();
    const total = target.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    if (total <= 0) return 100;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }, [targetDate, startDate]);

  const handleConfetti = useCallback((e) => {
    if (
      e.target.tagName === "INPUT" ||
      e.target.getAttribute("contenteditable") === "true" ||
      e.target.closest(".date-section") ||
      e.target.closest(".title-section")
    ) return;

    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    confetti({ particleCount: 100, spread: 70, origin: { x, y }, colors: ["#a855f7","#3b82f6","#ec4899","#06b6d4","#f59e0b","#10b981"], gravity: 0.8, scalar: 1.2, drift: 0, ticks: 200 });
    setTimeout(() => confetti({ particleCount: 50, spread: 100, origin: { x, y }, colors: ["#fbbf24","#f472b6","#818cf8","#34d399"], shapes: ["circle"], gravity: 1, scalar: 0.8, ticks: 150 }), 100);
    setTimeout(() => confetti({ particleCount: 30, spread: 120, origin: { x, y }, colors: ["#ffffff","#a855f7","#3b82f6"], shapes: ["star"], gravity: 0.6, scalar: 1.5, ticks: 250 }), 200);
  }, []);

  const handleNameChange = (e) => {
    const text = e.target.innerText.trim();
    if (text.length > 0) setCountdownName(text);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); e.target.blur(); }
  };

  if (!mounted || !timeLeft) {
    return <div style={{ opacity: 0.5, fontSize: "1.2rem", color: "var(--text-muted)" }}>Loading...</div>;
  }

  return (
    <div className="countdown-tab-content" onClick={handleConfetti}>
      {/* Logo */}
      <div className="logo-container">
        <Image src="/logo.png" alt="Countdown Logo" width={120} height={120} className="logo-image" priority />
      </div>

      {/* Editable Title */}
      <div className="title-section">
        <p className="countdown-label">Countdown To</p>
        <div
          ref={nameRef}
          className="countdown-name"
          contentEditable
          suppressContentEditableWarning
          onBlur={handleNameChange}
          onKeyDown={handleNameKeyDown}
          role="textbox"
          aria-label="Countdown name - click to edit"
          spellCheck={false}
        >
          {countdownName}
        </div>
        <p className="edit-hint">✏️ Click to edit name</p>
      </div>

      {/* Editable Dates */}
      <div className="date-section">
        <div className="date-field">
          <span className="target-date-label">Start Date</span>
          <div className="date-input-wrapper">
            <input type="date" className="date-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-label="Start date for countdown" id="start-date-input" />
          </div>
        </div>
        <div className="date-field">
          <span className="target-date-label">Target Date</span>
          <div className="date-input-wrapper">
            <input type="date" className="date-input" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} aria-label="Target date for countdown" id="target-date-input" />
          </div>
        </div>
      </div>

      {/* Countdown Grid or Completed */}
      {isComplete ? (
        <div className="completed-message">🎉 The countdown is complete! 🎉</div>
      ) : (
        <>
          <div className="countdown-grid">
            <div className="countdown-card">
              <div className="countdown-value">{padZero(timeLeft.days, timeLeft.days > 99 ? 3 : 2)}</div>
              <div className="countdown-unit">Days</div>
            </div>
            <div className="countdown-card">
              <div className="countdown-value">{padZero(timeLeft.hours)}</div>
              <div className="countdown-unit">Hours</div>
            </div>
            <div className="countdown-card">
              <div className="countdown-value">{padZero(timeLeft.minutes)}</div>
              <div className="countdown-unit">Minutes</div>
            </div>
            <div className="countdown-card">
              <div className="countdown-value">{padZero(timeLeft.seconds)}</div>
              <div className="countdown-unit">Seconds</div>
            </div>
          </div>

          {/* Milliseconds */}
          <div className="ms-section">
            <p className="ms-display">
              <span className="ms-value">{padZero(timeLeft.milliseconds, 3)}</span>
              <span> ms</span>
              <span style={{ margin: "0 12px", color: "var(--text-muted)" }}>•</span>
              <span style={{ fontSize: "0.85em" }}>{formatWithCommas(timeLeft.totalMs)} ms remaining</span>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-label">
              <span>Progress</span>
              <span>{getProgress().toFixed(1)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${getProgress()}%` }} />
            </div>
          </div>
        </>
      )}

      {/* Click Hint */}
      <p className="click-hint">
        <span className="click-hint-icon">🎊</span>
        Click anywhere for confetti!
      </p>

      {/* Help */}
      <button className="help-trigger" onClick={(e) => { e.stopPropagation(); onHelpOpen(true); }} aria-label="Open help">?</button>
    </div>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [activeTab, setActiveTab] = useState("stopwatch");
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="main-container">
      <AppBackground />

      {/* Tab bar */}
      <div className="tab-wrapper">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === "stopwatch" && (
          <button className="help-trigger help-trigger-root" onClick={() => setIsHelpOpen(true)} aria-label="Open help">
            ?
          </button>
        )}
      </div>

      {/* Tab content */}
      <div className="tab-panel">
        {activeTab === "stopwatch" ? <StopwatchTab /> : <CountdownTab onHelpOpen={() => setIsHelpOpen(true)} />}
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} activeTab={activeTab} />
    </div>
  );
}
