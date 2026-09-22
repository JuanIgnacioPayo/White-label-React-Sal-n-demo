import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../../firebase/firebase';
import { playHoverSound } from '../GlobalHoverSound';
import { toast } from 'react-toastify';

export default function HoverSoundSettings() {
  const [hoverSoundConfig, setHoverSoundConfig] = useState({
    soundType: 'bubble',
    volume: 0.3,
    pitch: 1.0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const soundRef = ref(database, 'settings/cardHoverSound');
    const unsubscribe = onValue(soundRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        setHoverSoundConfig({
          soundType: val.soundType || 'bubble',
          volume: val.volume !== undefined ? Number(val.volume) : 0.3,
          pitch: val.pitch !== undefined ? Number(val.pitch) : 1.0,
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSaveSoundConfig = async (updatedFields) => {
    const newConfig = { ...hoverSoundConfig, ...updatedFields };
    try {
      await set(ref(database, 'settings/cardHoverSound'), newConfig);
      toast.success('¡Configuración de sonido guardada!');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la configuración de sonido.');
    }
  };

  if (loading) {
    return (
      <LoadingWrapper>
        <Spinner />
        <p>Cargando configuración...</p>
      </LoadingWrapper>
    );
  }

  return (
    <Container>
      <TitleBlock>
        <h2>🔊 Efecto de Sonido al pasar el mouse por Tarjetas (Hover)</h2>
        <p className="subtitle">
          Configura un micro-sonido sutil y adictivo que sonará de forma interactiva y ultra-rápida cada vez que el mouse pase sobre las tarjetas de toda la web.
        </p>
      </TitleBlock>

      <FormGroup>
        <label htmlFor="soundType">Tipo de Sonido</label>
        <Select
          id="soundType"
          value={hoverSoundConfig.soundType}
          onChange={(e) => {
            const type = e.target.value;
            handleSaveSoundConfig({ soundType: type });
            playHoverSound(type, hoverSoundConfig.volume, hoverSoundConfig.pitch);
          }}
        >
          <option value="bubble">🫧 Burbuja / Pop (Sutil y Adictivo)</option>
          <option value="click">⌨️ Click Mecánico (Seco y Elegante)</option>
          <option value="tech">👾 Blip Tecnológico (Moderno y Retro)</option>
          <option value="bell">🔔 Campanita Metálica (Suave y Cristalina)</option>
          <option value="wood">🪵 Bloque de Madera Cálido (Percusión Suave)</option>
          <option value="glass">💎 Tintineo de Vidrio (Fino y Delicado)</option>
          <option value="pluck">🎵 Pulsación de Arpa (Pluck Orgánico)</option>
          <option value="water">💧 Gota de Agua (Limpia y Natural)</option>
          <option value="chime">🧚 Campanita de Hada (Chime Suave y Aireado)</option>
          <option value="pop">💥 Burbuja Seca (Pop Corto y Adictivo)</option>
          <option value="tick">⏱️ Tick Digital (Micro-sonido Ultra-sutil)</option>
          <option value="none">🔇 Desactivado / Silencio</option>
        </Select>
      </FormGroup>

      <FormGroup>
        <LabelRow>
          <label htmlFor="volume">Volumen</label>
          <ValueBadge>{Math.round(hoverSoundConfig.volume * 100)}%</ValueBadge>
        </LabelRow>
        <RangeInput
          id="volume"
          type="range"
          min="0.05"
          max="1.0"
          step="0.05"
          value={hoverSoundConfig.volume}
          onChange={(e) => {
            const vol = Number(e.target.value);
            setHoverSoundConfig((prev) => ({ ...prev, volume: vol }));
          }}
          onMouseUp={(e) => {
            const vol = Number(e.target.value);
            handleSaveSoundConfig({ volume: vol });
            playHoverSound(hoverSoundConfig.soundType, vol, hoverSoundConfig.pitch);
          }}
          onTouchEnd={(e) => {
            const vol = Number(e.target.value);
            handleSaveSoundConfig({ volume: vol });
            playHoverSound(hoverSoundConfig.soundType, vol, hoverSoundConfig.pitch);
          }}
        />
      </FormGroup>

      <FormGroup>
        <LabelRow>
          <label htmlFor="pitch">Tono / Frecuencia (Pitch)</label>
          <ValueBadge>{hoverSoundConfig.pitch.toFixed(2)}x</ValueBadge>
        </LabelRow>
        <RangeInput
          id="pitch"
          type="range"
          min="0.5"
          max="2.0"
          step="0.05"
          value={hoverSoundConfig.pitch}
          onChange={(e) => {
            const p = Number(e.target.value);
            setHoverSoundConfig((prev) => ({ ...prev, pitch: p }));
          }}
          onMouseUp={(e) => {
            const p = Number(e.target.value);
            handleSaveSoundConfig({ pitch: p });
            playHoverSound(hoverSoundConfig.soundType, hoverSoundConfig.volume, p);
          }}
          onTouchEnd={(e) => {
            const p = Number(e.target.value);
            handleSaveSoundConfig({ pitch: p });
            playHoverSound(hoverSoundConfig.soundType, hoverSoundConfig.volume, p);
          }}
        />
      </FormGroup>

      <FooterHint>
        ✨ ¡Los cambios se guardan de forma instantánea y puedes arrastrar y soltar los controles para escuchar una prueba del tono en vivo!
      </FooterHint>
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  max-width: 700px;
  margin: 0 auto;
  padding: 1.5rem;
  font-family: 'product_sansregular', sans-serif;
`;

const TitleBlock = styled.div`
  margin-bottom: 2rem;
  text-align: left;

  h2 {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--primary-text, #160529);
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 0.88rem;
    color: var(--secondary-text, #64748b);
    line-height: 1.45;
    margin: 0;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.75rem;

  label {
    display: block;
    font-size: 0.9rem;
    font-weight: bold;
    color: var(--primary-text, #160529);
    margin-bottom: 0.5rem;
  }
`;

const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;

  label {
    margin-bottom: 0;
  }
`;

const ValueBadge = styled.span`
  font-size: 0.85rem;
  font-weight: bold;
  color: var(--app-primary-color, #948924);
  background-color: rgba(148, 137, 36, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background-color: #fff;
  font-size: 0.92rem;
  color: var(--primary-text, #160529);
  font-family: inherit;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: var(--app-primary-color, #948924);
  }
`;

const RangeInput = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #cbd5e1;
  outline: none;
  cursor: pointer;
  accent-color: var(--app-primary-color, #948924);
  margin: 8px 0;
`;

const FooterHint = styled.p`
  font-size: 0.75rem;
  color: var(--secondary-text, #64748b);
  line-height: 1.4;
  margin-top: 2rem;
  text-align: center;
  background-color: var(--app-background-color, #ffffec);
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px dashed rgba(0, 0, 0, 0.08);
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--secondary-text, #64748b);
  font-size: 0.9rem;
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Spinner = styled.div`
  width: 28px;
  height: 28px;
  border: 3px solid rgba(0, 0, 0, 0.08);
  border-top-color: var(--app-primary-color, #948924);
  border-radius: 50%;
  animation: ${rotate} 0.8s linear infinite;
  margin-bottom: 12px;
`;
