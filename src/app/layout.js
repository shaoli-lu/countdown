import "./globals.css";

export const metadata = {
  title: "Web 2.0 Countdown – Live Countdown Timer",
  description:
    "A beautiful, interactive countdown timer to your most important dates. Watch the milliseconds tick away in real time with stunning visuals and confetti celebrations.",
  keywords: ["countdown", "timer", "web 2.0", "live countdown", "event timer"],
  openGraph: {
    title: "Web 2.0 Countdown",
    description: "Live countdown timer with real-time millisecond precision",
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
