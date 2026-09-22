export const processEmbedCode = (htmlString, height, width) => {
  if (typeof htmlString !== 'string' || !htmlString.trim()) {
    return htmlString;
  }

  // Caso 1: Es un embed de Instagram (blockquote)
  if (htmlString.includes('data-instgrm-permalink')) {
    const permalinkRegex = /data-instgrm-permalink="([^"]+)"/;
    const match = htmlString.match(permalinkRegex);

    if (match && match[1]) {
      const fullUrl = match[1];
      const baseUrl = fullUrl.split('?')[0];
      const cleanUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const embedUrl = `${cleanUrl}embed/`;
      const heightStyle = height ? `height: ${height};` : 'height: 100%;';
      const widthStyle = width ? `width: ${width};` : 'width: 100%;';
      return `<iframe src="${embedUrl}" style="border:none; overflow:hidden; ${widthStyle} ${heightStyle} max-width:540px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`;
    }
    // Si no hay match, devolver el original sin el script
    return htmlString.replace(/<script.*src="\/\/www\.instagram\.com\/embed\.js".*<\/script>/s, '').trim();
  }

  // Caso 2: Es un embed de Facebook (iframe)
  if (htmlString.includes('facebook.com/plugins/post.php') || htmlString.includes('class="fb-post"')) {
    let processedHtml = htmlString;

    // Remover atributos nativos para forzar el uso de estilos
    if (height) {
      processedHtml = processedHtml.replace(/height="\d+"/, '');
    }
    if (width) {
      processedHtml = processedHtml.replace(/width="\d+"/, '');
    }

    if (processedHtml.includes('style="')) {
      processedHtml = processedHtml.replace(/style="([^"]*)"/, (match, p1) => {
        let newStyle = p1;
        // Asegurar border-radius
        if (newStyle.includes('border-radius:')) {
          newStyle = newStyle.replace(/border-radius:\s*\d+px;?/, 'border-radius: 8px;');
        } else {
          newStyle = `${newStyle.trim()}${newStyle.trim().endsWith(';') ? '' : ';'} border-radius: 8px;`;
        }
        // Asegurar box-shadow
        if (newStyle.includes('box-shadow:')) {
          newStyle = newStyle.replace(/box-shadow:[^;]*;?/, 'box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);');
        } else {
          newStyle = `${newStyle.trim()}${newStyle.trim().endsWith(';') ? '' : ';'} box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);`;
        }
        
        if (height) {
          newStyle = newStyle.replace(/height:\s*[^;]+;?/, '');
          newStyle = `${newStyle.trim()}${newStyle.trim().endsWith(';') ? '' : ';'} height: ${height};`;
        }
        if (width) {
          newStyle = newStyle.replace(/width:\s*[^;]+;?/, '');
          newStyle = `${newStyle.trim()}${newStyle.trim().endsWith(';') ? '' : ';'} width: ${width};`;
        }

        return `style="${newStyle}"`;
      });
    } else {
      const heightStyle = height ? `height: ${height};` : '';
      const widthStyle = width ? `width: ${width};` : '';
      processedHtml = processedHtml.replace(/<iframe/, `<iframe style="border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); ${heightStyle} ${widthStyle}"`);
    }
    return processedHtml;
  }

  return htmlString;
};

