import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { app } from '../firebase/firebase';

const SiteContext = createContext();

export const useSiteContext = () => useContext(SiteContext);

export const SiteProvider = ({ children }) => {
  const [siteName, setSiteName] = useState("Salón Magic Eventos");
  const [browserTitle, setBrowserTitle] = useState("Salón de eventos | Salón Magic Eventos");
  const [isSiteNameLoaded, setIsSiteNameLoaded] = useState(false);

  useEffect(() => {
    const db = getDatabase(app);
    const siteNameRef = ref(db, 'appSettings/siteName');
    const browserTitleRef = ref(db, 'config/browserTitle');
    const contenido1Ref = ref(db, 'datosId/29/contenido1');

    const updateName = (rawVal) => {
      if (rawVal && typeof rawVal === 'string' && rawVal.trim() !== '') {
        const cleanName = rawVal.includes('|') ? rawVal.split('|').pop().trim() : rawVal.trim();
        setSiteName(cleanName);
        return true;
      }
      return false;
    };

    // Listen to appSettings/siteName with fallbacks to config/browserTitle and datosId/29/contenido1
    const unsubscribeSiteName = onValue(siteNameRef, (snapshot) => {
      if (snapshot.exists() && updateName(snapshot.val())) {
        setIsSiteNameLoaded(true);
        return;
      }

      onValue(browserTitleRef, (bSnap) => {
        if (bSnap.exists() && updateName(bSnap.val())) {
          setIsSiteNameLoaded(true);
          return;
        }

        onValue(contenido1Ref, (cSnap) => {
          if (cSnap.exists() && updateName(cSnap.val())) {
            setIsSiteNameLoaded(true);
            return;
          }
          setIsSiteNameLoaded(true);
        }, { onlyOnce: true });
      }, { onlyOnce: true });
    });

    const unsubscribeBrowserTitle = onValue(browserTitleRef, (bSnap) => {
      if (bSnap.exists()) {
        const val = bSnap.val();
        if (val && typeof val === 'string' && val.trim() !== '') {
          setBrowserTitle(val);
        }
      }
    });

    return () => {
      unsubscribeSiteName();
      unsubscribeBrowserTitle();
    };
  }, []);

  const value = {
    siteName,
    browserTitle,
    isSiteNameLoaded
  };

  return (
    <SiteContext.Provider value={value}>
      {children}
    </SiteContext.Provider>
  );
};
