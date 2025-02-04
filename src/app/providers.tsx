'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

type Theme = 'light' | 'dark' | 'system';
type Attribute = 'class' | 'data-theme';

export function ThemeProvider({ 
  children, 
  ...props 
}: {
  children: React.ReactNode;
  attribute?: Attribute;
  defaultTheme?: Theme;
  enableSystem?: boolean;
}) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
} 