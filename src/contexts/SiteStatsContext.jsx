import React, { createContext, use, useState, useCallback } from 'react';
import { getDatabase, ref, runTransaction, get } from 'firebase/database';
import { getAuth } from "firebase/auth";
import { app } from '../firebase/firebase';
import { safeStorage } from '../utils/safeStorage';

const SiteStatsContext = createContext();

export const useSiteStats = () => use(SiteStatsContext);

export const SiteStatsProvider = ({ children }) => {
  const [stats, setStats] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  const initializeStats = useCallback(() => {
    // Check safeStorage for a previous like
    if (safeStorage.getItem('hasLikedPage') === 'true') {
      setIsLiked(true);
    }

    const db = getDatabase(app);
    const statsRef = ref(db, 'siteStats');

    const auth = getAuth(app);
    // If user is not logged in as admin according to rules, they cannot write siteStats. 
    // We will just fetch the current stats for them to display.
    if (!auth.currentUser) {
      get(statsRef).then(snapshot => {
        if (snapshot.exists()) {
          setStats(snapshot.val());
        }
      }).catch(error => {
        console.error("Failed to read site stats:", error);
      });
      return; // Exit here, don't run transaction
    }

    runTransaction(statsRef, (currentData) => {
      if (currentData === null) {
        // First visit ever, initialize stats
        return {
          totalVisits: 1,
          likes: 0,
          siteStartDate: '17/05/2023',
          trainingComplete: false,
          trainingStartDate: new Date().toISOString(),
          trainingVisits: 1,
        };
      }

      // --- Training Logic ---
      if (!currentData.trainingComplete) {
        const trainingStartDate = new Date(currentData.trainingStartDate);
        const now = new Date();
        const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;

        if (now - trainingStartDate >= oneWeekInMs) {
          // Training complete, calculate projection
          const dailyAverage = currentData.trainingVisits / 7;

          const siteStartDateParts = currentData.siteStartDate.split('/');
          const siteStartDate = new Date(`${siteStartDateParts[2]}-${siteStartDateParts[1]}-${siteStartDateParts[0]}`);

          const daysSinceStart = Math.floor((now - siteStartDate) / (1000 * 60 * 60 * 24));

          const projectedVisits = Math.round(dailyAverage * daysSinceStart);

          currentData.totalVisits = projectedVisits + 1; // Add current visit
          currentData.trainingComplete = true;
        } else {
          // Still in training
          currentData.trainingVisits = (currentData.trainingVisits || 0) + 1;
        }
      } else {
        // --- Normal Operation ---
        currentData.totalVisits = (currentData.totalVisits || 0) + 1;
      }

      return currentData; // Return the modified data for the transaction
    }).then(result => {
      if (result.committed) {
        setStats(result.snapshot.val());
      }
    }).catch(error => {
      console.warn("Permisos insuficientes para actualizar stats o falló la transacción:", error);
    });
  }, []);

  const handleLike = useCallback(() => {
    if (isLiked) return;

    const db = getDatabase(app);
    const statsRef = ref(db, 'siteStats');

    runTransaction(statsRef, (currentData) => {
      if (currentData) {
        currentData.likes = (currentData.likes || 0) + 1;
        return currentData;
      }
      return currentData;
    }).then(result => {
      if (result.committed) {
        setIsLiked(true);
        safeStorage.setItem('hasLikedPage', 'true');
        setStats(result.snapshot.val());
      }
    }).catch(error => {
      console.error("Failed to update likes:", error);
    });
  }, [isLiked]);

  const value = { stats, isLiked, handleLike, initializeStats };

  return (
    <SiteStatsContext value={value}>
      {children}
    </SiteStatsContext>
  );
};
