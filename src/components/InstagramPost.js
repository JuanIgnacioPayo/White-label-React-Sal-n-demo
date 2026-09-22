class InstagramPost extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['embed-html'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'embed-html' && oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const embedHtml = this.getAttribute('embed-html');
    if (!embedHtml) {
      this.shadow.innerHTML = '';
      return;
    }

    // Set the inner HTML of the shadow DOM
    this.shadow.innerHTML = `
      <style>
        :host {
          display: block !important;
          width: 100%;
          height: 100%;
          max-width: 100% !important; /* Default max-width for desktop */
          margin: 0 auto !important; /* Center the component */
        }
        iframe {
          width: 100%;
          height: 100%;
          min-height: 400px;
          max-width: min(100%, 540px) !important;
          min-width: 0 !important;
        }
      </style>
      ${embedHtml}
    `;

    // Find any script tag in the provided HTML and execute it
    const existingScript = this.shadow.querySelector('script');
    if (existingScript) {
      const newScript = document.createElement('script');
      newScript.src = existingScript.src;
      newScript.async = true;
      newScript.charset = 'utf-8';
      this.shadow.appendChild(newScript);
      existingScript.remove(); // Remove the original to avoid double execution
    } else {
      // If the embed code doesn't include the script, add the main one
      const mainScript = document.createElement('script');
      mainScript.src = 'https://www.instagram.com/embed.js';
      mainScript.async = true;
      mainScript.charset = 'utf-8';
      this.shadow.appendChild(mainScript);
    }
  }
}

// Define the custom element if it's not already defined
if (!window.customElements.get('instagram-post')) {
  window.customElements.define('instagram-post', InstagramPost);
}
