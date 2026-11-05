import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'URBANGROW | Laboratorio virtual 3D de riego autónomo',
  description: 'Visor conceptual 3D para dos zonas de riego, ESP32, sensores, actuadores y cotas de ingeniería agrícola.'
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="es"><body>{children}</body></html>;
}
