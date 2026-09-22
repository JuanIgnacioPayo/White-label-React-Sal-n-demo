import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { database } from '../../firebase/firebase';
import { ref, push, set, serverTimestamp } from 'firebase/database';
import { Bug, MessageSquare, X, ChevronLeft, CheckCircle2, Loader2 } from 'lucide-react';
import './FeedbackButton.css';

const FeedbackButton = () => {
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const feedbackParam = searchParams.get('feedback');
    const isOpen = !!feedbackParam;
    const step = parseInt(feedbackParam) || 1;

    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHovered, setIsHovered] = useState(false);



    // Auto-hide tooltip after 2 seconds (especially for mobile)
    React.useEffect(() => {
        let timer;
        if (isHovered) {
            timer = setTimeout(() => {
                setIsHovered(false);
            }, 2000);
        }
        return () => clearTimeout(timer);
    }, [isHovered]);



    // Only show on home and price pages
    const showButton = location.pathname === '/' || location.pathname.startsWith('/precios');

    if (!showButton) return null;

    const handleOpen = () => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('feedback', '1');
            return next;
        }, { replace: false });
        setDescription('');
    };

    const handleClose = () => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.delete('feedback');
            return next;
        }, { replace: true });
    };

    const setStep = (newStep) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (newStep) next.set('feedback', newStep.toString());
            else next.delete('feedback');
            return next;
        }, { replace: false });
    };



    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) return;

        setIsSubmitting(true);
        try {
            const feedbackRef = ref(database, 'feedback');
            const newFeedbackRef = push(feedbackRef);
            await set(newFeedbackRef, {
                type: step === 2 ? 'bug' : 'suggestion',
                description: description.trim(),
                page: location.pathname + location.search,
                timestamp: serverTimestamp(),
                status: 'unread'
            });
            setStep(4);
        } catch (error) {
            console.error("Error sending feedback:", error);
            alert("Hubo un error al enviar el reporte. Por favor intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="feedback-container">
            <button 
                className="feedback-button" 
                onClick={handleOpen} 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <Bug size={11} />
                {isHovered && !isOpen && (
                    <span className="feedback-tooltip">
                        Encontré un error en la página
                    </span>
                )}
            </button>




            {isOpen && (
                <div className="feedback-modal-overlay" onClick={handleClose}>
                    <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="feedback-close" onClick={handleClose}>
                            <X size={20} />
                        </button>

                        {step === 1 && (
                            <>
                                <h3>¿Cómo podemos mejorar?</h3>
                                <div className="feedback-options">
                                    <button className="feedback-opt-btn" onClick={() => setStep(2)}>
                                        <Bug size={20} color="#ff5722" />
                                        <span>Encontré un desperfecto/error</span>
                                    </button>
                                    <button className="feedback-opt-btn" onClick={() => setStep(3)}>
                                        <MessageSquare size={20} color="#2196f3" />
                                        <span>Tengo una sugerencia de mejora</span>
                                    </button>
                                </div>
                            </>
                        )}

                        {(step === 2 || step === 3) && (
                            <>
                                <button className="feedback-back" onClick={() => setStep(1)}>
                                    <ChevronLeft size={16} /> Volver
                                </button>
                                <h3>{step === 2 ? 'Reportar Error' : 'Nueva Sugerencia'}</h3>
                                <form className="feedback-form" onSubmit={handleSubmit}>
                                    <textarea
                                        className="feedback-textarea"
                                        placeholder={step === 2 ? "¿Qué no funciona correctamente?" : "¿Qué te gustaría cambiar o agregar?"}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <button 
                                        type="submit" 
                                        className="feedback-submit" 
                                        disabled={isSubmitting || !description.trim()}
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Enviar Reporte'}
                                    </button>
                                </form>
                            </>
                        )}

                        {step === 4 && (
                            <div className="feedback-success">
                                <CheckCircle2 size={48} className="feedback-success-icon" />
                                <h3>¡Muchas gracias!</h3>
                                <p>Tu reporte ha sido enviado. Lo revisaremos pronto.</p>
                                <button className="feedback-submit" style={{ marginTop: '16px', width: '100%' }} onClick={handleClose}>
                                    Cerrar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeedbackButton;
