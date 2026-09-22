import React, { use, useState, useEffect } from "react";
import { auth } from "../../firebase/firebase";
import {onAuthStateChanged} from "firebase/auth";

const AuthContext = React.createContext();

export function useAuth() {
  return use(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userLoggedIn, setUserLoggedIn]=useState(false);
    const [loading, setLoading] = useState(true);

    async function initializeUser (user) {
        if (user) {
        setCurrentUser({ ... user });
        setUserLoggedIn(true);
        } else {
        setCurrentUser(null);
        setUserLoggedIn(false);
        }
        setLoading (false);
        }

    useEffect (() =>{
        const unsubscribe = onAuthStateChanged (auth, initializeUser);
        
        // Failsafe: Si Firebase Auth se cuelga (ej: bloqueador de anuncios), forzamos la salida
        const timeoutId = setTimeout(() => {
            setLoading(prev => {
                if (prev) {
                    console.warn("Failsafe: onAuthStateChanged tardo demasiado, asumiendo offline/deslogueado.");
                    setUserLoggedIn(false);
                    return false;
                }
                return prev;
            });
        }, 5000);

        return () => {
            clearTimeout(timeoutId);
            unsubscribe();
        };
    }, [])

        const value = {
            currentUser,
            userLoggedIn,
            loading
            }

            return (
            <AuthContext value={value}>
            {!loading && children}
            </AuthContext>
            )

}