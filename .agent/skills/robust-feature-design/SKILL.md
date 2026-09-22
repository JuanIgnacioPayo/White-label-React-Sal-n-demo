---
name: robust-feature-design
description: Workflow estandarizado para diseñar e implementar funcionalidades robustas, asegurando calidad y manejo de errores.
---

# Implementación de Funcionalidades Robustas

Antes de escribir código productivo, sigue estos pasos obligatorios para asegurar la calidad y robustez de la nueva funcionalidad.

## 1. Análisis de Impacto y Casos Borde
Antes de codificar, reflexiona sobre:
- [ ] **Impacto**: ¿Qué componentes existentes se verán afectados? ¿Requiere cambios en la base de datos?
- [ ] **Happy Path**: Define al menos 1 flujo ideal de éxito.
- [ ] **Edge Cases**: Lista al menos 3 posibles fallos (ej: red caída, respuesta vacía de API, datos corruptos, usuario sin permisos).
- [ ] **Mobile**: ¿Cómo se ve esto en pantallas pequeñas? (Recordatorio: La plataforma de eventos se usa mucho en móvil).

## 2. Diseño de Tipos e Interfaces
- Define primero las estructuras de datos (aunque sea Javascript, piensa en la forma del objeto).
- Asegúrate de tener estados definidos para:
  - `loading` (cargando)
  - `error` (mensaje amigable al usuario)
  - `success` (feedback visual)

## 3. Implementación Modular
- **Separación de responsabilidades**: No mezcles lógica de negocio compleja dentro del JSX. Usa hooks personalizados o funciones auxiliares si la lógica crece.
- **Reutilización**: Antes de crear un componente nuevo, verifica si ya existe uno similar (ej: botones, modales, inputs).

## 4. Estrategia de Verificación
- ¿Cómo probarás que esto funciona?
- Define paso a paso cómo reproducir el error y cómo verificar la solución.

## 5. Revisión Final (Self-Correction)
Antes de decir "Terminé":
- ¿Limpié los `console.log`?
- ¿Manejé los errores con `try/catch` y feedback visual?
- ¿El código es legible para otro desarrollador?
