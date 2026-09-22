# Reglas Críticas de Despliegue y Control de Versiones

**REGLA CRÍTICA**: ESTÁ ESTRICTAMENTE PROHIBIDO ejecutar comandos de despliegue (ej. `firebase deploy`, `npm run deploy`, etc.) o comandos de escritura en Git (ej. `git commit`, `git push`) a menos que tengas autorización explícita.

## Contexto
El usuario tiene un agente especializado y dedicado exclusivamente para tareas de subidas a Git y deploys. Ejecutar deploys parciales (como `firebase deploy --only hosting`) genera conflictos con las Cloud Functions que quedan sin desplegar, rompiendo los endpoints (por ejemplo, rutas de precios y parámetros en la API).

## Instrucciones Obligatorias
1. Nunca realices deploys ni subas código a Git de manera automática.
2. Si el usuario te pide explícitamente hacer un deploy o subir código a Git, **DEBES DETENERTE Y PREGUNTAR**: *"¿Sos el agente especializado en subidas y deploys?"*.
3. Solo puedes proceder con el despliegue o la subida a Git si el usuario confirma de forma explícita que está actuando a través del agente especializado en esas tareas. De lo contrario, debes negarte a hacerlo.
4. **Comando `/deploy`**: Si el usuario escribe `/deploy` (o invoca la skill de deploy), se reconoce como la instrucción autorizada del agente especializado y se activa la skill `.agent/skills/deploy/SKILL.md`. Esta skill ejecuta automáticamente todo el protocolo: verificación previa de sintaxis de Cloud Functions, compilación con `npm run build` (sincronizando `functions/index_template.html`), staging limpio, commit semántico, push y monitoreo continuo en Firebase hasta certificar el éxito total en Hosting y Cloud Functions.
