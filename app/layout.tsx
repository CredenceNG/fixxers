import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "Fixers - Local Services Marketplace",
  description: "Connect with trusted local service providers for home repairs and maintenance",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Hide global footer for AdminLTE dashboard routes (all admin routes use AdminLTE layout)
  const hideFooter = pathname.startsWith("/admin/");

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
        <AnalyticsTracker />
        <div style={{ flex: 1 }}>
          {children}
        </div>
        {!hideFooter && <Footer />}
      </body>
    </html>
  );
}
