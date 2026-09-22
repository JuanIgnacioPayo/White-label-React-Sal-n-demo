import { doSignInWithGoogle } from '../firebase/auth'; // Removed doSignOut
import { useAuth } from '../contexts/authContext';
import FormRecibo from '../components/FormsYToggles/FormRecibo';
import { useState, useEffect } from "react";
import { app } from "../firebase/firebase";
import { getDatabase, ref, get } from "firebase/database";
import { useLoading } from '../contexts/LoadingContext';
// Removed useNavigate, styled

const Login = () => {
    const { completeTask } = useLoading();
    const [inputValue1, setInputValue1] = useState("");

    useEffect(() => {
        completeTask('app_init');
    }, [completeTask]);

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
    }, [28])


    const { userLoggedIn } = useAuth()
    const [isSigningIn, setIsSigningIn] = useState(false)
    const [currentTab, setCurrentTab] = useState(1); // Track AdminPage tab

    const onGoogleSignIn = (e) => {
        e.preventDefault()
        if (!isSigningIn) {
            setIsSigningIn(true)
            doSignInWithGoogle().catch(err => {
                setIsSigningIn(false)
            })
        }
    }


    return (
        <div>

            {userLoggedIn &&
                <>
                    <FormRecibo replace={true} onTabChange={setCurrentTab} />
                </>
            }




            <center>
                <button
                    hidden={userLoggedIn}

                    onClick={(e) => { onGoogleSignIn(e) }}
                    className={` ${isSigningIn ? 'cursor-not-allowed' : ''}`}>
                    {inputValue1 && <img src={inputValue1} height="50px" width="50px" />}
                    {isSigningIn ? '' : ''}
                </button>
            </center>


        </div>
    )
}

export default Login