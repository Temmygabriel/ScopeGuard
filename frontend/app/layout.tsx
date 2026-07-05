import "../globals.css";

export const metadata = {
  title: "ScopeGuard",
  description: "Lock a freelance brief on-chain. Let an AI rule on disputes against it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
