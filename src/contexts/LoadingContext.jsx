import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [tasks, setTasks] = useState(new Set(['app_init'])); // Tarea inicial de la app
  const [completed, setCompleted] = useState(new Set());
  const [progress, setProgress] = useState(0);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);

  const registerTask = useCallback((taskId) => {
    setTasks(prev => {
      const newTasks = new Set(prev);
      newTasks.add(taskId);
      return newTasks;
    });
  }, []);

  const completeTask = useCallback((taskId) => {
    setCompleted(prev => {
      const newCompleted = new Set(prev);
      newCompleted.add(taskId);
      return newCompleted;
    });
  }, []);

  const startLoading = useCallback((initialTasks = []) => {
    setTasks(new Set(initialTasks));
    setCompleted(new Set());
    setProgress(0);
    setIsFullyLoaded(false);
  }, []);

  const [simulatedProgress, setSimulatedProgress] = useState(0);

  // Lógica para simular una carga paulatina visual
  useEffect(() => {
    let interval;
    if (!isFullyLoaded) {
      interval = setInterval(() => {
        setSimulatedProgress(prev => {
          const increment = Math.floor(Math.random() * 8) + 3; // Sube de a poco
          const next = prev + increment;
          return next > 95 ? 95 : next; // Se frena en 95% hasta que termine real
        });
      }, 350);
    } else {
      setSimulatedProgress(100);
    }
    return () => clearInterval(interval);
  }, [isFullyLoaded]);

  // Calculamos el progreso cuando cambian las tareas
  useEffect(() => {
    if (tasks.size === 0) {
      if (!isFullyLoaded) {
        setProgress(100);
        setSimulatedProgress(100);
      }
      return;
    }
    
    let completedCount = 0;
    let relevantTasksCount = 0;
    
    completed.forEach(taskId => {
      // check in the set
    });

    // Ignoramos 'main_image' para no bloquear la carga de la página
    tasks.forEach(taskId => {
      if (taskId !== 'main_image') {
        relevantTasksCount++;
        if (completed.has(taskId)) completedCount++;
      }
    });

    const percentage = relevantTasksCount === 0 ? 100 : Math.round((completedCount / relevantTasksCount) * 100);
    const newProgress = Math.min(100, Math.max(0, percentage));
    
    // Si reseteamos, permitimos que baje el progreso
    setProgress(prev => (newProgress === 0 ? 0 : Math.max(prev, newProgress)));

    if (newProgress === 100 && relevantTasksCount > 0) {
      const timer = setTimeout(() => {
        setSimulatedProgress(100);
        setIsFullyLoaded(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [tasks, completed, isFullyLoaded]);

  // Si algo falla o un componente nunca reporta, forzamos la finalización tras 12 segundos
  useEffect(() => {
    let timer;
    if (!isFullyLoaded && tasks.size > 0) {
      timer = setTimeout(() => {
         console.warn('Loading fallback triggered: not all tasks completed on time.');
         setProgress(100);
         setTimeout(() => setIsFullyLoaded(true), 300);
      }, 12000); 
    }
    return () => clearTimeout(timer);
  }, [isFullyLoaded, tasks.size]);

  const displayProgress = isFullyLoaded ? 100 : Math.max(progress, simulatedProgress);

  const value = {
    progress: displayProgress,
    isFullyLoaded,
    registerTask,
    completeTask,
    startLoading,
    tasks: Array.from(tasks),
    completed: Array.from(completed),
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};
