import { doSignInWithGoogle } from '../firebase/auth'
import { useAuth } from '../contexts/authContext'
import { useLoading } from '../contexts/LoadingContext'
import AdminPage from './AdminPage'
import { useState, useEffect } from "react";
import { app } from "../firebase/firebase";
import { getDatabase, ref, get } from "firebase/database";
// Importa las funciones de Firebase SDK para Cloud Functions
import { getFunctions, httpsCallable } from 'firebase/functions'; //
import SEO from '../components/SEO';

import { Navigate } from 'react-router-dom';

const Login = () => {
    let [inputValue1, setInputValue1] = useState("");

    useEffect(() => {
        const fetchData = async () => {
          const db = getDatabase(app);
          let dbURL = "datosId/" + 28;
          const dbRef = ref(db, dbURL);
          const snapshot = await get(dbRef);
          if (snapshot.exists()) {
            const targetObject = snapshot.val();

            setInputValue1(targetObject.foto30);

          } else {
            alert("error UseEffect de form de otros datos");
          }
        }
        fetchData();
      }, [])


    const { userLoggedIn } = useAuth()
    const { completeTask } = useLoading()

    useEffect(() => {
      completeTask('app_init');
    }, [completeTask]);

    const [isSigningIn, setIsSigningIn] = useState(false)

    // Inicializa Firebase Functions
    const functions = getFunctions(app); //
    // Crea una referencia a tu función invocable
    const callUpdateReviews = httpsCallable(functions, 'updateGoogleReviewsFromFrontend'); //

    const onGoogleSignIn = async (e) => {
        e.preventDefault()
        if (!isSigningIn) {
            setIsSigningIn(true)
            try {
                await doSignInWithGoogle();
                // Si el login es exitoso, llama a la función de Firebase para actualizar las reseñas
                console.log("Usuario logueado, intentando actualizar reseñas...");
                const result = await callUpdateReviews();
                console.log("Reseñas actualizadas:", result.data.message);
            } catch (err) {
                console.error("Error durante el inicio de sesión o al actualizar reseñas:", err);
            } finally {
                setIsSigningIn(false);
            }
        }
    }

    return (
        <>
            <SEO title="Ingreso Administrativo" noindex={true} />
            <div>
                {userLoggedIn && <Navigate to="/admin" replace={true} />}

                <center>
                    <button
                        hidden={userLoggedIn}
                        onClick={(e) => { onGoogleSignIn(e) }}
                        className={`${isSigningIn ? 'cursor-not-allowed' : ''}`}>
                        {inputValue1 && <img src={inputValue1} height="50px" width="50px" alt="Login" />}
                        {isSigningIn ? '' : ''}
                    </button>
                </center>
            </div>
        </>
    )
}

export default Login