import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "../../components/header/header";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const sofiaProBlackAz = localFont({
  src: "./fonts/Sofia Pro Black Az.woff",
  variable: "--font-sofia-pro-black-az",
  weight: "900",
});

// const sofiaProItalicAz = localFont({
//   src: "./fonts/Sofia Pro Italic Az.woff",
//   variable: "--font-sofia-pro-italic-az",
//   weight: "900",
// });


const sofiaProRegularAz = localFont({
  src: "./fonts/Sofia Pro Regular Az.woff",
  variable: "--font-sofia-pro-regular-az",
  weight: "900",
});

const sofiaProMediumAz = localFont({
  src: "./fonts/Sofia Pro Medium Az.woff",
  variable: "--font-sofia-pro-medium-az",
  weight: "900",
});

const sofiaProExtralightAz = localFont({
  src: "./fonts/Sofia Pro ExtraLight Az.woff",
  variable: "--font-sofia-pro-extralight-az",
});

const sofiaProUltralighttAz = localFont({
  src: "./fonts/Sofia Pro ExtraLight Az.woff",
    variable: "--font-sofia-pro-ultralight-az",
});

const agero = localFont({
  src: "./fonts/agero.ttf",
    variable: "--agero",
});


export const metadata: Metadata = {
  title: "GGPS",
  description: "Gamer's Global Positioning System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>GGPS</title>
        <link rel="icon" href="favicon.ico" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
        />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossOrigin=""></script>
      </head>

      <body
        className={`${sofiaProMediumAz.variable} ${sofiaProBlackAz.variable} ${sofiaProRegularAz.variable} ${sofiaProUltralighttAz.variable} ${agero.variable} antialiased`}
      >
      <Header/>

        {children}
      </body>
    </html>
  );
}
