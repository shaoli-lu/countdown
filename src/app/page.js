"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import Image from "next/image";

const DEFAULT_NAME = "Web 2.0";
const DEFAULT_DATE = "2026-05-18";

function padZero(num, digits = 2) {
  return String(Math.floor(num)).padStart(digits, "0");
}

function formatWithCommas(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function Home() {
  const [countdownName, setCountdownName] = useState(DEFAULT_NAME);
  const [targetDate, setTargetDate] = useState(DEFAULT_DATE);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [mounted, setMounted] = useState(false);
  const nameRef = useRef(null);

  // Calculate time remaining
  const calculateTimeLeft = useCallback(() => {
    const target = new Date(targetDate + "T00:00:00");
    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      setIsComplete(true);
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
        totalMs: 0,
      };
    }

    setIsComplete(false);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const milliseconds = diff % 1000;

    return { days, hours, minutes, seconds, milliseconds, totalMs: diff };
  }, [targetDate]);

  // High-frequency update loop
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 47); // ~21fps for smooth ms display

    return () => clearInterval(interval);
  }, [calculateTimeLeft]);

  // Calculate progress percentage
  const getProgress = useCallback(() => {
    // Progress from when the page was created to target
    const start = new Date("2026-03-05T00:00:00");
    const target = new Date(targetDate + "T00:00:00");
    const now = new Date();

    const total = target.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();

    if (total <= 0) return 100;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }, [targetDate]);

  // Spray confetti on click
  const handleConfetti = useCallback(
    (e) => {
      // Don't trigger confetti when interacting with inputs
      if (
        e.target.tagName === "INPUT" ||
        e.target.getAttribute("contenteditable") === "true" ||
        e.target.closest(".date-section") ||
        e.target.closest(".title-section")
      ) {
        return;
      }

      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      // Main burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { x, y },
        colors: ["#a855f7", "#3b82f6", "#ec4899", "#06b6d4", "#f59e0b", "#10b981"],
        gravity: 0.8,
        scalar: 1.2,
        drift: 0,
        ticks: 200,
      });

      // Secondary burst with different shapes
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 100,
          origin: { x, y },
          colors: ["#fbbf24", "#f472b6", "#818cf8", "#34d399"],
          shapes: ["circle"],
          gravity: 1,
          scalar: 0.8,
          ticks: 150,
        });
      }, 100);

      // Star burst
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 120,
          origin: { x, y },
          colors: ["#ffffff", "#a855f7", "#3b82f6"],
          shapes: ["star"],
          gravity: 0.6,
          scalar: 1.5,
          ticks: 250,
        });
      }, 200);
    },
    []
  );

  // Handle title editing
  const handleNameChange = (e) => {
    const text = e.target.innerText.trim();
    if (text.length > 0) {
      setCountdownName(text);
    }
  };

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    }
  };

  if (!mounted || !timeLeft) {
    return (
      <div className="main-container">
        <div className="app-background">
          <Image
            src="/hero-bg.png"
            alt=""
            fill
            className="bg-image"
            priority
          />
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div style={{ opacity: 0.5, fontSize: '1.2rem', color: 'var(--text-muted)' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="main-container" onClick={handleConfetti}>
      {/* Background */}
      <div className="app-background">
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          className="bg-image"
          priority
        />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Logo */}
      <div className="logo-container">
        <Image
          src="/logo.png"
          alt="Countdown Logo"
          width={120}
          height={120}
          className="logo-image"
          priority
        />
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

      {/* Editable Date */}
      <div className="date-section">
        <span className="target-date-label">Target Date</span>
        <div className="date-input-wrapper">
          <input
            type="date"
            className="date-input"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            aria-label="Target date for countdown"
            id="target-date-input"
          />
        </div>
      </div>

      {/* Countdown Grid or Completed */}
      {isComplete ? (
        <div className="completed-message">
          🎉 The countdown is complete! 🎉
        </div>
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
              <span style={{ fontSize: "0.85em" }}>
                {formatWithCommas(timeLeft.totalMs)} ms remaining
              </span>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-label">
              <span>Progress</span>
              <span>{getProgress().toFixed(1)}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
          </div>
        </>
      )}

      {/* Click Hint */}
      <p className="click-hint">
        <span className="click-hint-icon">🎊</span>
        Click anywhere for confetti!
      </p>
    </div>
  );
}
