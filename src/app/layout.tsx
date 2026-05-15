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

const siteUrl = "https://pointclick-frontend.vercel.app";

const ogImageUrl =
  "https://ceuqctgpcqayeplkmnec.supabase.co/storage/v1/object/public/pointclick-media/metadata/pointclick-miniature.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PointClick",
  description:
    "Projeto acadêmico desenvolvido como parte do Projeto Integrador Multidisciplinar, simulando um e-commerce completo de eletrônicos com catálogo, carrinho, pedidos, pagamento simulado e painel administrativo.",
  openGraph: {
    title: "PointClick",
    description:
      "E-commerce acadêmico desenvolvido com Next.js, Java Spring Boot e PostgreSQL, integrando vitrine, carrinho, pedidos e painel administrativo.",
    url: siteUrl,
    siteName: "PointClick",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 627,
        alt: "Tela inicial do PointClick, e-commerce acadêmico de eletrônicos",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PointClick",
    description:
      "Projeto acadêmico full stack de e-commerce de eletrônicos com Next.js, Spring Boot e PostgreSQL.",
    images: [ogImageUrl],
  },
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