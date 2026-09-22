import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "../firebase/firebase";
import { useAvailability } from './AvailabilityContext';

const FestiveThemeContext = createContext();

export const useFestiveTheme = () => useContext(FestiveThemeContext);

export const FestiveThemeProvider = ({ children }) => {
  const [activeFestiveTheme, setActiveFestiveTheme] = useState(null);
  const [previewTheme, setPreviewTheme] = useState(null);
  const [festiveThemes, setFestiveThemes] = useState([]);
  const { calendarEvents, isLoading } = useAvailability();

  // Load festive themes from Firebase
  useEffect(() => {
    const db = getDatabase(app);
    const themesRef = ref(db, 'appSettings/festiveThemes');
    const unsubscribe = onValue(themesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const themesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setFestiveThemes(themesArray);
      } else {
        setFestiveThemes([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Evaluate active theme based on current date and holidays
  useEffect(() => {
    if (isLoading || festiveThemes.length === 0) {
      setActiveFestiveTheme(null);
      return;
    }

    const today = new Date();
    // format to MM-DD
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Find today's events from calendarEvents
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todayHolidays = calendarEvents.filter(event => {
      let eventStart, eventEnd;
      if (event.start.includes('T')) {
          eventStart = new Date(event.start);
      } else {
          const [y, m, d] = event.start.split('-').map(Number);
          eventStart = new Date(y, m - 1, d);
      }
      if (event.end.includes('T')) {
          eventEnd = new Date(event.end);
      } else {
          const [y, m, d] = event.end.split('-').map(Number);
          eventEnd = new Date(y, m - 1, d);
      }
      return event.title === "feriado" && (today < eventEnd && todayEnd > eventStart);
    });

    const holidayNamesStr = todayHolidays.map(h => h.holidayName ? h.holidayName.toLowerCase() : "").join(" ");

    // Check if any festive theme matches today
    const matchedTheme = festiveThemes.find(theme => {
      if (theme.isActive === false) return false;

      if (theme.matchType === 'fixed_date') {
        return theme.date === todayStr;
      } else if (theme.matchType === 'holiday_keyword') {
        if (!theme.keyword || theme.keyword.trim() === '') return false;
        return holidayNamesStr.includes(theme.keyword.toLowerCase().trim());
      }
      return false;
    });

    setActiveFestiveTheme(matchedTheme || null);

  }, [festiveThemes, calendarEvents, isLoading]);

  const activeThemeToUse = previewTheme || activeFestiveTheme;

  return (
    <FestiveThemeContext.Provider value={{ activeFestiveTheme: activeThemeToUse, previewTheme, setPreviewTheme }}>
      {children}
    </FestiveThemeContext.Provider>
  );
};
