import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "NetSuite Demo Data Generator",
  description: "Generate and manage demo data for NetSuite using AI",
  icons: {
    icon: "/favicon.ico",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
