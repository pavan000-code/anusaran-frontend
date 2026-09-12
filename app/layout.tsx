import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anusaran | Care loop",
  description: "Evidence-linked outpatient care loops.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
