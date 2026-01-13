import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MILUZ - Tu Mentor de Trading con IA',
  description: 'Mentor experto en trading con IA para ayudarte a mejorar tus habilidades',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
