import { useState, useEffect, useCallback } from 'react';
import { translations } from '../translations';

// Global cache to avoid re-fetching multiple times
let cachedLanguage = null;

export default function useLanguage() {
  const [lang, setLang] = useState(cachedLanguage || 'en'); // Default to 'en'

  useEffect(() => {
    if (cachedLanguage) {
      setLang(cachedLanguage);
      return;
    }

    const detectLanguage = async () => {
      try {
        const response = await fetch('https://get.geojs.io/v1/ip/country.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        const detectedLang = data.country === 'PL' ? 'pl' : 'en';
        cachedLanguage = detectedLang;
        setLang(detectedLang);
      } catch (error) {
        console.error('Failed to detect country, defaulting to English', error);
        cachedLanguage = 'en';
        setLang('en');
      }
    };

    detectLanguage();
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  }, [lang]);

  return { lang, t };
}
