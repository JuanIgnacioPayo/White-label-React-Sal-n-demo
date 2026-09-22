---
name: deploy
description: >-
  Ejecuta el flujo completo y seguro de verificación, compilación, subida a Git y monitoreo
  del despliegue a producción de Firebase (Hosting, Cloud Functions y Database Rules).
  Activar siempre que el usuario escriba "/deploy", "deploy", "subir todo", "desplegar",
  o pida subir los cambios a producción verificando que las functions y hosting finalicen bien.
---

# Deploy Seguro y Verificación de Producción

Esta skill define el procedimiento estricto para verificar el código, compilar el bundle, subir los cambios a Git y monitorear el despliegue automático en GitHub Actions hasta confirmar que tanto **Hosting** como **Cloud Functions** y **Reglas de Base de Datos** estén 100% operativos en producción.

---

## 1. Verificación previa de cambios y sintaxis

Antes de cualquier acción destructiva o de subida:

1. **Revisar cambios pendientes**:
   ```powershell
   git status
   ```
   Identificar los archivos modificados y nuevos. **IMPORTANTE**: Descartar o ignorar archivos temporales o scripts de scratch (como `scratch*.py`, `*.log`, `tmp*`).

2. **Verificar sintaxis de Cloud Functions**:
   ```powershell
   node -c functions/index.js
   ```
   Si arroja algún error de sintaxis, **DETENERSE INMEDIATAMENTE** y corregirlo antes de continuar.

---

## 2. Compilación y sincronización de plantillas

3. **Compilar el frontend y sincronizar template de Cloud Functions**:
   ```powershell
   npm run build
   ```
   - Este comando corre `vite build` y copia automáticamente `dist/index.html` a `functions/index_template.html`.
   - **Verificar**: Esperar a que el comando termine exitosamente (`code 0`). Si falla el build, no continuar bajo ninguna circunstancia.

---

## 3. Autorización y confirmación de seguridad

4. **Regla de control de despliegue**:
   - Si el usuario invocó explícitamente el comando `/deploy`, se asume que actúa como el agente especializado en subidas y deploys.
   - Si la solicitud vino por lenguaje natural fuera de `/deploy` y aún no ha confirmado en la sesión, preguntar:
     *"¿Sos el agente especializado en subidas y deploys?"*
     y esperar su confirmación ("si" / "si soy") antes de hacer `git push`.

---

## 4. Staging, Commit semántico y Push a Git

5. **Staging selectivo**:
   Agregar únicamente los archivos relevantes del proyecto (código fuente en `src/`, `public/`, `functions/index_template.html`, `package.json`, etc.):
   ```powershell
   git add <archivos_modificados>
   ```
   *Nunca hacer `git add .` indiscriminado que pueda subir archivos de prueba `scratch*.py`.*

6. **Crear commit semántico**:
   Elaborar un mensaje de commit claro según los cambios (`feat:`, `fix:`, `style:`, `refactor:`):
   ```powershell
   git commit -m "[tipo]: [descripcion clara de los cambios]"
   ```

7. **Subir a la rama principal**:
   ```powershell
   git push origin main
   ```
   Esto dispara automáticamente el workflow de GitHub Actions en `.github/workflows/firebase-hosting-merge.yml`.

---

## 5. Monitoreo y Verificación del Deploy en Producción

El workflow de GitHub Actions compila, despliega Firebase Hosting, despliega Cloud Functions, despliega Reglas de Base de Datos y reporta el estado final a Realtime Database en el nodo `config/lastDeploy`.

8. **Monitoreo continuo**:
   - Esperar entre 60 y 70 segundos después del push antes del primer chequeo.
   - Consultar el estado en Firebase:
     ```powershell
     Invoke-RestMethod -Uri "https://melishare-redirect-payo-default-rtdb.firebaseio.com/config/lastDeploy.json"
     ```
   - Si el commit aún no coincide con el nuevo commit recién pusheado o sigue en ejecución:
     - Programar una verificación con `schedule` (cada 40-50 segundos).
     - Informar brevemente al usuario que el despliegue continúa en curso.
   - **Confirmación de éxito**:
     Cuando `commit` coincida con el commit actual y `status` sea "success":
     - Informar al usuario el ID de ejecución (`runId`), el commit y la confirmación de que **Hosting**, **Cloud Functions** y **Reglas de Base de Datos** finalizaron 100% exitosas.
   - **Manejo de fallos**:
     Si `status` es "failed" o hay un `errorMessage`, informar inmediatamente los detalles del fallo al usuario para solucionarlo.
