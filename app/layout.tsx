import "./globals.css";

export const metadata = {
  title: "Nexial",
  description: "AI-powered lead quality dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
