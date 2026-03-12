import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MuiProvider } from "@/components/mui-theme-provider";
import { PowerSyncProvider } from "@/powersync/PowerSyncProvider";
import { AuthProvider } from "@/powersync/auth-context";
import NavigationProgress from "@/components/NavigationProgress";

export const dynamic = "force-dynamic";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Graal",
  description: "Suivi entraînement, mensurations et diète avec analyse morphologique",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Graal",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider>
            <MuiProvider>
              <AuthProvider>
                <PowerSyncProvider>
                  <NavigationProgress />
                  {children}
                </PowerSyncProvider>
              </AuthProvider>
            </MuiProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
