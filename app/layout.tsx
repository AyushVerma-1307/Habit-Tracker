import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HabitTracker - Don't break the chain",
  description:
    "Track your habits, build streaks, and share your progress with the world. The internet is watching.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem("habit-tracker-theme");
                  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  var useDark = theme ? theme === "dark" : prefersDark;
                  if (useDark) {
                    document.documentElement.classList.add("dark");
                    document.documentElement.style.colorScheme = "dark";
                  } else {
                    document.documentElement.classList.remove("dark");
                    document.documentElement.style.colorScheme = "light";
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
