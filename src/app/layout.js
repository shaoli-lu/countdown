import "./globals.css";

export const metadata = {
  title: "Stopwatch - Live Countdown Timer",
  description:
    "A beautiful, interactive countdown timer to your most important dates. Watch the milliseconds tick away in real time with stunning visuals and confetti celebrations.",
  keywords: ["countdown", "timer", "stopwatch", "live countdown", "event timer"],
  openGraph: {
    title: "Stopwatch - Live Countdown Timer",
    description: "Stopwatch - Live countdown timer with real-time millisecond precision",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
