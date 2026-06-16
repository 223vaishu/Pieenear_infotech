import "./globals.css";

export const metadata = {
  title: "Pieenear | Student & Admin Portal",
  description: "Next-generation workspace portal for student management and curriculum tracking.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

