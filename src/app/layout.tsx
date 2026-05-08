import type { Metadata } from "next";
import { Nunito_Sans, Rubik } from "next/font/google";
import "./globals.css";
import { FeedbackModalProvider } from "@/contexts/FeedbackModalContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { Header } from "@/components/layout/Header";
import { FeedbackModal } from "@/components/ui/FeedbackModal";

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PointClick | Eletrônicos premium",
  description:
    "PointClick é um e-commerce premium de eletrônicos, periféricos e acessórios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" className={`${rubik.variable} ${nunitoSans.variable}`}>
      <body>
        <FeedbackModalProvider>
          <AuthProvider>
            <CartProvider>
              <div className="min-h-screen">
                <Header />

                <main>{children}</main>

                <FeedbackModal />
              </div>
            </CartProvider>
          </AuthProvider>
        </FeedbackModalProvider>
      </body>
    </html>
  );
}