# Guía de Credenciales para Despliegue (Plataforma Salones Demo)

Para simplificar la configuración y evitar copiar múltiples carpetas y archivos individuales (como variables de entorno y llaves de AFIP), hemos unificado **todas las credenciales y certificados** en un único archivo seguro:

## 1. El único archivo que debes copiar
Copia únicamente el siguiente archivo desde esta máquina a la nueva:
* **Nombre**: `salon-secrets.json`
* **Ubicación**: En la raíz del proyecto.
* **Nota**: Este archivo está en el `.gitignore` por defecto bajo la regla `*-secrets.json` y **nunca** se subirá a tus repositorios de Git.

---

## 2. Instrucciones para Despliegue en la Nueva Máquina

Una vez que tengas el proyecto clonado en tu otra computadora y hayas copiado el archivo `salon-secrets.json` a la raíz del mismo, sigue estos pasos:

### Paso 1: Recrear automáticamente todas las credenciales
Ejecuta el siguiente comando en la raíz del proyecto para desempaquetar y crear de forma automática todas las carpetas, archivos `.env`, credenciales de Google y llaves de AFIP:
```bash
node setup_keys.cjs
```

Este script recreará en su lugar correspondiente los siguientes archivos:
* `[Raíz]/.env` (Credenciales compiladas del frontend)
* `[Raíz]/.env.local`
* `[Raíz]/credentials.json` (OAuth Google)
* `[functions]/.env`
* `[functions]/.env.production` (Credenciales del backend en producción)
* `[functions]/keys/` (Todos los certificados de AFIP: `certificado.crt`, `privada.key`, etc.)

### Paso 2: Instalar y Deployar
1. **Instalar dependencias**:
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```
2. **Iniciar sesión en Firebase CLI**:
   ```bash
   firebase login
   ```
3. **Seleccionar el proyecto activo**:
   ```bash
   firebase use default
   ```
4. **Compilar y Subir a Producción**:
   ```bash
   npm run build
   firebase deploy --debug
   ```
