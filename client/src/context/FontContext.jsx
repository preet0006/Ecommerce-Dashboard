import React, { createContext, useContext, useState, useEffect } from 'react';

export const AVAILABLE_FONTS = [
  {
    id: 'inter',
    name: 'Inter',
    category: 'Modern Clean Sans',
    fontFamily: "'Inter', sans-serif",
    displayFamily: "'Space Grotesk', sans-serif",
    description: 'Clean, neutral Swiss-style typography optimized for screens.',
    previewText: 'Procurement Dashboard & Supply Chain Telemetry',
  },
  {
    id: 'jakarta',
    name: 'Plus Jakarta Sans',
    category: 'Refined Corporate Sans',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    displayFamily: "'Plus Jakarta Sans', sans-serif",
    description: 'Crisp geometric grotesque with clean readability and premium corporate warmth.',
    previewText: 'Enterprise Logistics & Multi-Channel Inventory Control',
  },
  {
    id: 'outfit',
    name: 'Outfit',
    category: 'Contemporary Modern',
    fontFamily: "'Outfit', sans-serif",
    displayFamily: "'Outfit', sans-serif",
    description: 'Stylish, dynamic design with high personality and brand elegance.',
    previewText: 'Automated Vendor SLA Follow-Up & Performance Scorecards',
  },
  {
    id: 'space',
    name: 'Space Grotesk',
    category: 'Futuristic Tech',
    fontFamily: "'Space Grotesk', sans-serif",
    displayFamily: "'Space Grotesk', sans-serif",
    description: 'High-tech proportional sans-serif with distinct editorial character.',
    previewText: 'Neon PostgreSQL Grounded Intelligence & Telemetry',
  },
  {
    id: 'roboto',
    name: 'Roboto',
    category: 'Classic Sharp Sans',
    fontFamily: "'Roboto', sans-serif",
    displayFamily: "'Roboto', sans-serif",
    description: 'Dual nature combining geometric shapes with open and friendly curves.',
    previewText: 'Purchase Order Approval Queue & Delivery Arrival Checks',
  },
  {
    id: 'mono',
    name: 'JetBrains Mono',
    category: 'Technical Developer Mono',
    fontFamily: "'JetBrains Mono', monospace",
    displayFamily: "'JetBrains Mono', monospace",
    description: 'Engineered for high density and technical clarity with code precision.',
    previewText: 'PO-2026-0145 · SKU: GF-CAS-001 · 2,500 units @ ₹495',
  },
];

export const FONT_SCALES = [
  { id: 'compact', label: 'Compact Density (92%)', cssScale: '92%' },
  { id: 'normal', label: 'Standard (100%)', cssScale: '100%' },
  { id: 'spacious', label: 'Spacious (108%)', cssScale: '108%' },
];

const FontContext = createContext();

export function FontProvider({ children }) {
  const [selectedFontId, setSelectedFontId] = useState(() => {
    try {
      const saved = localStorage.getItem('greenfibre_selected_font');
      if (saved && AVAILABLE_FONTS.some((f) => f.id === saved)) return saved;
      return 'inter';
    } catch {
      return 'inter';
    }
  });

  const [selectedScaleId, setSelectedScaleId] = useState(() => {
    try {
      const saved = localStorage.getItem('greenfibre_font_scale');
      if (saved && FONT_SCALES.some((s) => s.id === saved)) return saved;
      return 'normal';
    } catch {
      return 'normal';
    }
  });

  // Apply font family in real-time to CSS custom properties & body
  useEffect(() => {
    const fontObj = AVAILABLE_FONTS.find((f) => f.id === selectedFontId) || AVAILABLE_FONTS[0];
    const root = document.documentElement;
    const body = document.body;

    root.style.setProperty('--font-body', fontObj.fontFamily);
    root.style.setProperty('--font-display', fontObj.displayFamily);
    body.style.fontFamily = fontObj.fontFamily;

    try {
      localStorage.setItem('greenfibre_selected_font', selectedFontId);
    } catch {}
  }, [selectedFontId]);

  // Apply font scale in real-time
  useEffect(() => {
    const scaleObj = FONT_SCALES.find((s) => s.id === selectedScaleId) || FONT_SCALES[1];
    document.documentElement.style.fontSize = scaleObj.cssScale;

    try {
      localStorage.setItem('greenfibre_font_scale', selectedScaleId);
    } catch {}
  }, [selectedScaleId]);

  const activeFont = AVAILABLE_FONTS.find((f) => f.id === selectedFontId) || AVAILABLE_FONTS[0];
  const activeScale = FONT_SCALES.find((s) => s.id === selectedScaleId) || FONT_SCALES[1];

  return (
    <FontContext.Provider
      value={{
        selectedFontId,
        setFont: setSelectedFontId,
        selectedScaleId,
        setFontScale: setSelectedScaleId,
        activeFont,
        activeScale,
        availableFonts: AVAILABLE_FONTS,
        availableScales: FONT_SCALES,
      }}
    >
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
}
