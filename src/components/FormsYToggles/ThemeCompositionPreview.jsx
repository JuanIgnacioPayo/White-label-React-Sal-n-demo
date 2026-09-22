import React from 'react';

const ThemeCompositionPreview = ({ theme }) => {
  if (!theme) return null;
  const bgColor = theme.themeOverrides?.appBackgroundColor || '#fdfbf5';

  return (
    <div style={{
      width: '100%',
      aspectRatio: '1920/1080',
      position: 'relative',
      overflow: 'hidden',
      containerType: 'inline-size',
      borderRadius: '8px'
    }}>
      {/* Contenedor escalado para mostrar el cuadrante superior derecho */}
      <div style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        background: bgColor,
        transformOrigin: 'top right',
        transform: 'scale(2)'
      }}>
        {/* Banner de Fondo */}
        {(theme.homeBannerUrl || (!theme.themeOverrides?.appBackgroundColor && !theme.overlays?.length)) && (
          <img
            src={theme.homeBannerUrl || 'https://via.placeholder.com/1920x1080?text=Fondo'}
            alt="Banner"
            style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', position: 'absolute', top: 0, left: 0 }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}

        {/* Overlays del tema */}
        {theme.overlays && Array.isArray(theme.overlays) && theme.overlays.length > 0 ? (
          theme.overlays.map((ov, index) => {
            const zIndexVal = 5 + (theme.overlays.length - index) * 10;
            if (ov.type === 'text') {
              return (
                <span
                  key={ov.id || index}
                  style={{
                    position: 'absolute',
                    left: `${ov.x !== undefined ? ov.x : 50}%`,
                    top: `${ov.y !== undefined ? ov.y : 50}%`,
                    width: 'max-content',
                    fontSize: `calc(${ov.size !== undefined ? ov.size : 20} * 0.2cqw)`,
                    color: ov.color || '#ffffff',
                    fontWeight: 'bold',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    whiteSpace: 'pre-wrap',
                    textAlign: 'center',
                    zIndex: zIndexVal,
                    fontFamily: ov.fontFamily || "'product_sansregular', sans-serif",
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                  }}
                >
                  {ov.text}
                </span>
              );
            }
            return (
              <img
                key={ov.id || index}
                src={ov.url}
                alt="Adorno"
                style={{
                  position: 'absolute',
                  left: `${ov.x !== undefined ? ov.x : 50}%`,
                  top: `${ov.y !== undefined ? ov.y : 50}%`,
                  width: `${ov.size !== undefined ? ov.size : 15}%`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  zIndex: zIndexVal,
                  filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.3))'
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            );
          })
        ) : (
          theme.logoOverlay && !theme.logoOverlay.includes('General_Martin_Miguel_de_Guemes.jpg') && (
            <img
              src={theme.logoOverlay}
              alt="Logo"
              style={{
                position: 'absolute',
                left: `${theme.logoXPercent !== undefined ? theme.logoXPercent : 50}%`,
                top: `${theme.logoYPercent !== undefined ? theme.logoYPercent : 50}%`,
                width: `${theme.logoSizePercent !== undefined ? theme.logoSizePercent : 15}%`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 5,
                filter: 'drop-shadow(1px 2px 3px rgba(0,0,0,0.3))'
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )
        )}
        {/* Fallback icono */}
        {!theme.homeBannerUrl && (!theme.overlays || theme.overlays.length === 0) && (!theme.logoOverlay || theme.logoOverlay.includes('General_Martin_Miguel_de_Guemes.jpg')) && (
           <div style={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1, fontSize: '24px'}}>🎨</div>
        )}
      </div>
    </div>
  );
};

export default ThemeCompositionPreview;
