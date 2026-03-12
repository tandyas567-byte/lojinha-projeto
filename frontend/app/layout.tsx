import "./globals.css"
import { Poppins } from "next/font/google"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300","400","500","600","700"]
})

export const metadata = {
  title: "HyperTech",
  description: "Loja de tecnologia"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className={poppins.className}>
        {children}
      </body>
    </html>
  )
}