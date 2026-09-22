import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { toast } from 'react-toastify';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  animation: ${fadeIn} 0.5s ease-in;
  width: 100%;
`;

const ControlsAndTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
  width: 100%;
`;

const AudioButton = styled.button`
  background: var(--primary-color, #a370ff);
  border: none;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
  transition: transform 0.2s, background-color 0.2s;
  font-weight: 500;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);

  &:hover {
    transform: scale(1.05);
    background-color: var(--primary-color-dark, #8e5fe0);
  }

  .material-symbols-outlined {
    font-size: 24px;
  }

  &:disabled {
    opacity: 0.7;
    cursor: default;
    background-color: #ccc;
  }
`;

const Spinner = styled.div`
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: ${rotate} 1s linear infinite;
`;

const TextContainer = styled.div`
  font-size: 1rem;
  line-height: 2.0;
  white-space: pre-wrap;

  ${props => props.$variant === 'plain' ? css`
    max-height: none;
    overflow-y: visible;
    padding: 0;
    background: transparent !important;
    border: none;
    box-shadow: none;
  ` : css`
    max-height: 400px;
    overflow-y: auto;
    padding: 10px;
    background: rgba(255, 255, 255, 0.95) !important;
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,0.1);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    scroll-behavior: smooth;
  `}
`;

const Word = styled.span`
  transition: color 0.1s, font-weight 0.1s;
  display: inline;
  border-radius: 4px;

  ${props => props.$isHighlighted && css`
    background-color: transparent !important;
    color: #a370ff;
    font-weight: 900;
    text-shadow: 0px 0px 1px rgba(0,0,0,0.1);
  `}

  ${props => props.$isRead && css`
    color: #888;
  `}
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  padding: 5px 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const TimeDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
  font-family: monospace;
`;

const AudioRange = styled.input`
  width: 100%;
  cursor: pointer;
  accent-color: var(--primary-color, #a370ff);
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 12px;
    width: 12px;
    border-radius: 50%;
    background: var(--primary-color, #a370ff);
    cursor: pointer;
    box-shadow: 0 0 2px rgba(0,0,0,0.3);
  }
`;

const formatTextForSpeech = (rawText) => {
    try {
        if (!rawText || typeof rawText !== 'string') return "";
        let clean = rawText
            .replace(/[*#_]/g, '')
            .replace(/(\d),(\d{3})/g, '$1.$2')
            // Currency Handling (Pesos & Dollars)
            .replace(/\$\s*([\d.,]+)\s*millones/gi, '$1 millones de pesos')
            .replace(/(?:U\$S|US\$)\s*([\d.,]+)\s*millones/gi, '$1 millones de dólares')
            .replace(/\$\s*([\d.,]+)/gi, '$1 pesos')
            .replace(/(?:U\$S|US\$)\s*([\d.,]+)/gi, '$1 dólares')
            // Remove thousands separators (dots) AFTER currency processing
            .replace(/(\d)\.(\d)/g, '$1$2')
            // General abbreviation normalization
            .replace(/\b([ap])\. ?m\.?/gi, '$1m')
            .replace(/\bSr\./g, 'Señor')
            .replace(/\bSra\./g, 'Señora')
            .replace(/\bDr\./g, 'Doctor')
            .replace(/\bUd\./g, 'Usted')
            // Normalize quotes to standard quotes for cleaner regex splitting if needed, or just let them be
            .trim();
        return clean;
    } catch (error) {
        console.error("Error formatting text:", error);
        return "";
    }
};

const NewsAudioButton = ({ text, title, variant = 'default', speed = 1.15, locale = 'es-AR', showText = true, audioUrl = null, buttonStyle = {} }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [availableVoices, setAvailableVoices] = useState([]);
    const [isVoicesReady, setIsVoicesReady] = useState(false);

    // Audio Progress State
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Chunking State (for local TTS)
    const [chunks, setChunks] = useState([]);
    const [currentChunkIndex, setCurrentChunkIndex] = useState(0);

    const utteranceRef = useRef(null);
    const wakeLockRef = useRef(null);
    const textContainerRef = useRef(null);
    const utterancesRef = useRef([]); // Prevent GC
    const audioRef = useRef(null); // Ref for server-side audio

    // Process Text into Chunks (only if no audioUrl or as fallback text processing)
    useEffect(() => {
        if (!text) return;
        // ... (standard format logic can remain for text display)
        const processText = () => {
            const formatted = formatTextForSpeech(text);
            const sentences = formatted.match(/[^.!?]+[.!?]+/g) || [formatted];
            const newChunks = [];
            let currentChunk = "";
            sentences.forEach(sentence => {
                if ((currentChunk + sentence).length < 200) { currentChunk += sentence + " "; }
                else { if (currentChunk) newChunks.push({ text: currentChunk.trim() }); currentChunk = sentence + " "; }
            });
            if (currentChunk) newChunks.push({ text: currentChunk.trim() });
            setChunks(newChunks);
        };
        processText();
    }, [text]);

    // Load voices robustly (for fallback)
    useEffect(() => {
        if (!audioUrl && typeof window !== 'undefined' && window.speechSynthesis) {
            const updateVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
                console.log("Loaded Spanish Voices:", spanishVoices.map(v => `${v.name} (${v.lang})`));
                setAvailableVoices(voices);
                setIsVoicesReady(voices.length > 0);
            };
            updateVoices();
            window.speechSynthesis.onvoiceschanged = updateVoices;
            return () => { window.speechSynthesis.onvoiceschanged = null; };
        }
    }, [audioUrl]);

    // Wake Lock
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator && document.visibilityState === 'visible') {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            }
        } catch (err) { console.error(err); }
    };

    const releaseWakeLock = async () => {
        if (wakeLockRef.current) { try { await wakeLockRef.current.release(); wakeLockRef.current = null; } catch (err) { console.error(err); } }
    };

    // Cleanup
    const stopAudioOnly = useCallback(() => {
        try {
            // Stop Server Audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            // Stop Local TTS
            utterancesRef.current = [];
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            setIsPlaying(false);
            setIsBuffering(false);
            releaseWakeLock();
        } catch (e) {
            console.error("Stop Audio Error:", e);
        }
    }, []);

    const stopAll = useCallback(() => {
        stopAudioOnly();
        setIsPaused(false);
        setCurrentChunkIndex(0);
        setCurrentTime(0); // Reset UI time
    }, [stopAudioOnly]);

    useEffect(() => {
        return () => stopAll();
    }, [stopAll]);

    // Helper to get voice (reused) - kept for fallback
    const getBestVoice = useCallback((synth) => { /* ... existing logic ... */
        if (!synth) return null;
        const voices = availableVoices.length > 0 ? availableVoices : synth.getVoices();
        if (!voices || voices.length === 0) return null;
        console.log(`Selecting voice for locale: ${locale} `);
        let v = voices.find(voice => voice.lang === locale || voice.lang === locale.replace('-', '_'));
        if (v) return v;
        if (locale === 'es-AR') {
            v = voices.find(voice => voice.lang.includes('AR') || voice.name.toLowerCase().includes('argentina'));
            if (v) return v;
            v = voices.find(voice => voice.lang === 'es-419');
            if (v) return v;
            v = voices.find(voice => voice.lang.includes('MX') || voice.name.toLowerCase().includes('mexico'));
            if (v) return v;
            v = voices.find(voice => voice.lang === 'es-US');
            if (v) return v;
        } else if (locale === 'es-MX') {
            v = voices.find(voice => voice.lang.includes('MX') || voice.name.toLowerCase().includes('mexico'));
            if (v) return v;
            v = voices.find(voice => voice.lang === 'es-419');
            if (v) return v;
            v = voices.find(voice => voice.lang === 'es-US');
            if (v) return v;
            v = voices.find(voice => voice.lang.includes('AR') || voice.name.toLowerCase().includes('argentina'));
            if (v) return v;
        } else if (locale === 'es-US') {
            v = voices.find(voice => voice.lang.includes('US') || voice.lang.includes('us'));
            if (v) return v;
            v = voices.find(voice => voice.lang.includes('MX'));
            if (v) return v;
        }
        v = voices.find(voice => voice.lang.startsWith('es'));
        return v;
    }, [locale, availableVoices]);

    const queueChunksFrom = useCallback((startIndex) => { /* ... existing logic ... */
        try {
            if (typeof window === 'undefined' || !window.speechSynthesis) return;
            const synth = window.speechSynthesis;
            const voice = getBestVoice(synth);
            let defaultLang = 'es-ES';
            if (navigator.language && navigator.language.startsWith('es')) defaultLang = navigator.language;

            const chunksToPlay = chunks.slice(startIndex);
            utterancesRef.current = [];

            chunksToPlay.forEach((chunk, i) => {
                const originalIndex = startIndex + i;
                const utterance = new SpeechSynthesisUtterance(chunk.text);
                if (voice) utterance.voice = voice;
                utterance.lang = voice ? voice.lang : defaultLang;
                utterance.rate = speed;
                utterance.pitch = 1;
                utterance.onstart = () => {
                    setCurrentChunkIndex(originalIndex);
                    setIsBuffering(false);
                    requestWakeLock();
                };
                utterance.onerror = (event) => {
                    if (event.error !== 'interrupted' && event.error !== 'canceled') {
                        if (originalIndex === startIndex) {
                            console.error("Chunk error:", event);
                            stopAudioOnly();
                        }
                    }
                };
                utterance.onend = () => {
                    if (utterancesRef.current.length === 0) return;
                    if (originalIndex === chunks.length - 1) {
                        stopAll();
                    }
                };
                utterancesRef.current.push(utterance);
                synth.speak(utterance);
            });
        } catch (err) {
            console.error("Queue Chunks Error:", err);
            setErrorMsg("Error de reproducción");
        }
    }, [chunks, getBestVoice, stopAudioOnly, stopAll, speed]);


    const formatTime = (time) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} `;
    };

    const handleSeek = (e) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    const handleTogglePlay = useCallback(() => {
        try {
            // --- SERVER SIDE AUDIO LOGIC ---
            if (audioUrl) {
                if (!audioRef.current) {
                    audioRef.current = new Audio(audioUrl);

                    // Event Listeners for Progress
                    audioRef.current.ontimeupdate = () => {
                        setCurrentTime(audioRef.current.currentTime);
                    };
                    audioRef.current.onloadedmetadata = () => {
                        setDuration(audioRef.current.duration);
                    };
                    audioRef.current.onended = () => {
                        setIsPlaying(false);
                        setCurrentTime(0);
                        // Optional: don't full stop to allow replay? Or yes full stop.
                        // Let's full stop for now to reset button state.
                        stopAll();
                    };

                    audioRef.current.onerror = (e) => {
                        console.error("Audio File Error", e);
                        setErrorMsg("Error en audio");
                        stopAll();
                    };

                    // Apply speed to HTML5 audio if supported, usually 'playbackRate'
                    audioRef.current.playbackRate = speed;
                }

                // Update speed dynamically if it changed
                if (audioRef.current) audioRef.current.playbackRate = speed;

                if (isPlaying) {
                    // Pause
                    audioRef.current.pause();
                    setIsPaused(true);
                    setIsPlaying(false); // Update button state to "paused" (show play icon)
                    // Do NOT call stopAudioOnly() because that resets currentTime to 0!
                } else {
                    // Play
                    setIsBuffering(true);
                    const playPromise = audioRef.current.play();

                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            setIsPlaying(true);
                            setIsPaused(false);
                            setIsBuffering(false);
                            requestWakeLock();
                        }).catch(error => {
                            console.error("Play failed", error);
                            setIsBuffering(false);
                        });
                    }
                }
                return;
            }

            // --- LOCAL FALLBACK LOGIC ---
            if (typeof window === 'undefined' || !window.speechSynthesis) {
                setErrorMsg("No soportado");
                setTimeout(() => setErrorMsg(''), 3000);
                return;
            }
            const synth = window.speechSynthesis;
            if (isPlaying) {
                stopAudioOnly();
                setIsPaused(true);
            } else {
                const startIndex = isPaused ? currentChunkIndex : 0;
                if (!isPaused) { setCurrentChunkIndex(0); }
                synth.cancel();
                setIsPlaying(true);
                setIsPaused(false);
                setIsBuffering(true);
                queueChunksFrom(startIndex);
            }
        } catch (err) {
            console.error("Toggle Play Error:", err);
            setErrorMsg("Error al reproducir");
        }
    }, [isPlaying, isPaused, currentChunkIndex, stopAudioOnly, queueChunksFrom, audioUrl, speed]);

    return (
        <Container>
            <ControlsAndTitle>
                <AudioButton
                    onClick={handleTogglePlay}
                    style={buttonStyle}
                    title={
                        errorMsg ? errorMsg :
                            isBuffering ? "Cargando audio..." :
                                isPlaying ? "Pausar" : "Escuchar resumen (Mejorado con IA)"
                    }
                >
                    {errorMsg ? (
                        <span>{errorMsg}</span>
                    ) : isBuffering ? (
                        <>
                            <Spinner />
                            <span>{audioUrl ? "Cargando audio..." : "Iniciando..."}</span>
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">
                                {isPlaying ? 'pause_circle' : 'play_circle'}
                            </span>
                            {isPlaying ? 'Pausar Lectura' : 'Escuchar resumen'}
                        </>
                    )}
                </AudioButton>

                {/* Progress Bar (Only used for Server Audio) */}
                {audioUrl ? (
                    <ProgressBarContainer>
                        <AudioRange
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                        />
                        <TimeDisplay>
                            <span>{formatTime(currentTime)}</span>
                            <span>{formatTime(duration)}</span>
                        </TimeDisplay>
                    </ProgressBarContainer>
                ) : (
                    <div style={{ fontSize: '0.75rem', color: '#999', fontStyle: 'italic', marginTop: '5px' }}>
                        Audio IA no disponible (lectura local)
                    </div>
                )}

            </ControlsAndTitle>

            {showText && (
                <TextContainer ref={textContainerRef} $variant={variant}>
                    {typeof text === 'string' ? text : ""}
                </TextContainer>
            )}
        </Container>
    );
};

export default NewsAudioButton;
