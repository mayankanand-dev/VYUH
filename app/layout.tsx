import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VYUH · OSINT & Disinformation Investigation Platform',
  description: 'National Cyber Coordination & Forensic Disinformation Intelligence System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..700&display=swap"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: "class",
                theme: {
                  extend: {
                    colors: {
                      "secondary-fixed-dim": "#ffb68c",
                      "on-tertiary-fixed-variant": "#003ea8",
                      "surface-container": "#e5eeff",
                      "inverse-primary": "#bac7e1",
                      "surface": "#f8f9ff",
                      "on-error-container": "#93000a",
                      "background": "#f8f9ff",
                      "primary-container": "#0e1c2f",
                      "secondary-fixed": "#ffdbc9",
                      "surface-container-lowest": "#ffffff",
                      "on-primary-fixed-variant": "#3a475c",
                      "on-error": "#ffffff",
                      "secondary-container": "#ff842e",
                      "surface-bright": "#f8f9ff",
                      "surface-container-high": "#dce9ff",
                      "tertiary-container": "#00174b",
                      "primary-fixed": "#d6e3fe",
                      "outline-variant": "#c5c6cd",
                      "on-surface-variant": "#44474c",
                      "surface-dim": "#cbdbf5",
                      "on-secondary-fixed-variant": "#753400",
                      "on-primary-fixed": "#0e1c2f",
                      "inverse-on-surface": "#eaf1ff",
                      "on-secondary-fixed": "#321200",
                      "error": "#ba1a1a",
                      "inverse-surface": "#213145",
                      "on-primary": "#ffffff",
                      "on-background": "#0b1c30",
                      "on-surface": "#0b1c30",
                      "primary": "#000000",
                      "on-tertiary": "#ffffff",
                      "primary-fixed-dim": "#bac7e1",
                      "on-tertiary-fixed": "#00174b",
                      "surface-container-highest": "#d3e4fe",
                      "on-tertiary-container": "#497cff",
                      "surface-variant": "#d3e4fe",
                      "on-primary-container": "#77849c",
                      "secondary": "#9a4600",
                      "tertiary-fixed": "#dbe1ff",
                      "error-container": "#ffdad6",
                      "surface-container-low": "#eff4ff",
                      "surface-tint": "#525f75",
                      "on-secondary-container": "#642b00",
                      "tertiary": "#000000",
                      "on-secondary": "#ffffff",
                      "outline": "#75777d",
                      "tertiary-fixed-dim": "#b4c5ff"
                    },
                    borderRadius: {
                      "DEFAULT": "0.125rem",
                      "lg": "0.25rem",
                      "xl": "0.5rem",
                      "full": "0.75rem"
                    },
                    spacing: {
                      "gutter": "1rem",
                      "space-xl": "1.5rem",
                      "gutter-compact": "0.5rem",
                      "margin": "1.5rem",
                      "space-xs": "0.25rem",
                      "space-md": "0.75rem",
                      "space-lg": "1rem",
                      "space-sm": "0.5rem"
                    },
                    fontFamily: {
                      "body-lg": ["Inter", "sans-serif"],
                      "headline-lg": ["Inter", "sans-serif"],
                      "body-sm": ["Inter", "sans-serif"],
                      "display-lg": ["Inter", "sans-serif"],
                      "mono-lg": ["JetBrains Mono", "monospace"],
                      "label-md": ["Inter", "sans-serif"],
                      "body-md": ["Inter", "sans-serif"],
                      "title-md": ["Inter", "sans-serif"],
                      "headline-md": ["Inter", "sans-serif"],
                      "mono-md": ["JetBrains Mono", "monospace"],
                      "mono-sm": ["JetBrains Mono", "monospace"]
                    }
                  }
                }
              };
            `,
          }}
        />
      </head>
      <body className="bg-[#f8f9ff] text-[#0b1c30] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
