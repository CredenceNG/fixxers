import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "FIXI-NG - Local Services Marketplace",
  description: "Connect with trusted local service providers for home repairs and maintenance",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Set window name so magic links reuse the same tab
              if (!window.name) {
                window.name = 'fixxers-app';
              }
            `,
          }}
        />
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
