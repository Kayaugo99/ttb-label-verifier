import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TTB Label Verifier",
  description:
    "Check that an alcohol-beverage label matches its application — brand, alcohol content, net contents, class/type, and the Government Health Warning.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
            <span aria-hidden className="text-2xl">
              🥃
            </span>
            <div>
              <p className="font-semibold leading-tight text-slate-900">TTB Label Verifier</p>
              <p className="text-xs leading-tight text-slate-500">
                Compliance prototype — not for official determinations
              </p>
            </div>
          </div>
        </header>

        {children}

        <footer className="mt-auto border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-slate-500 sm:px-6">
            Prototype for demonstration only. Images and application data are processed in memory and
            never stored. Verify any flagged result by hand.
          </div>
        </footer>
      </body>
    </html>
  );
}
