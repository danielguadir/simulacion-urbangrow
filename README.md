# URBANGROW CHALLENGE — laboratorio 3D interactivo

**AgroMind Tech Solutions · Ingeniería Agrícola · Universidad del Valle**  
**Sistemas Autónomos Programables · Fase 1: concepción y diseño conceptual**

Proyecto **Next.js 15 + React 19 + TypeScript + Three.js + React Three Fiber 9 + Drei 10**.

## Ejecutar en tu computador (Windows, macOS o Linux)

Requiere **Node.js 20.9+** e internet solo para descargar las dependencias inicialmente.

1. Descomprime el ZIP y abre la carpeta `URBANGROW_Visor_3D_NextJS` en Visual Studio Code.
2. Abre una terminal en esa misma carpeta.
3. Ejecuta:

```bash
npm install
npm run dev
```

4. Visita **http://localhost:3000** desde el navegador.
5. Para comprobar tipos, `npm run typecheck`; para compilar producción, `npm run build`.

**En Windows también puedes hacer doble clic en `INICIAR_WINDOWS.bat`**, que ejecuta los mismos pasos de instalación/arranque.

Si deseas publicarlo, el repositorio puede desplegarse en Vercel como aplicación Next.js estándar.

## Qué incluye

- Visor 3D **real**, no una ilustración plana; gira, acerca y selecciona objetos.
- Vistas preestablecidas: perspectiva, superior, frontal y lateral.
- **Segunda pestaña «Arquitectura»** con el flujo completo de entorno, sensores, controlador, reglas, dos canales, goteo y retroalimentación.
- Modelo de dos camas con lechugas y tomates, soportes y líneas de goteo.
- ESP32, sondas de humedad A y B, SHT31, interruptor de flotador, bomba, filtro, electroválvulas y tanque.
- Cotas superpuestas en metros y área del módulo/camas.
- Panel de inspección con fichas técnicas y pendientes de validación.
- Demostración de reglas de histéresis y de riego por turnos.
- Condición de nivel bajo con bloqueo prioritario de bomba y válvulas.
- Activación visual de las conducciones y gotas animadas (no es flujo físico calculado).
- Exportación de imagen del lienzo 3D en PNG y pantalla completa.

## Hipótesis geométricas — se deben confirmar

| Elemento | Dimensión adoptada | Naturaleza del dato |
|---|---|---|
| Área de implantación | **6,40 × 4,60 m** (29,44 m²) | Supuesto conceptual |
| Cama de lechuga | **1,20 × 2,40 × 0,35 m** | Supuesto conceptual |
| Cama de tomate | **1,20 × 2,40 × 0,55 m** | Supuesto conceptual |
| Pasillo central | **0,80 m** | Supuesto conceptual |
| Tanque cilíndrico | **Ø 0,65 m × 0,60 m** | Volumen geométrico aprox. 199 L; volumen útil menor |
| Área combinada de camas | **5,76 m²** | Cálculo geométrico |

**La geometría 3D emplea 1 unidad = 1 m.** El visor no es un plano de obra y las posiciones preliminares de conexiones no sustituyen planos de instalación.

## Instrumentación y lógica

- ESP32 como controlador único (programable en C++ con Arduino IDE).
- Sensor capacitivo A (ADC1 / GPIO 34 propuesto) y sensor capacitivo B (ADC1 / GPIO 35).
- SHT31 (I²C GPIO21/22), flotador (GPIO27).
- Una bomba, dos válvulas normalmente cerradas y tres canales de accionamiento.
- Bomba y válvulas con alimentación y drivers externos, **no directamente desde GPIO**.
- Riego por turnos cuando A y B requieren agua. La alternancia visual de 6 segundos es exclusivamente demostrativa.
- Condición anormal: tanque bajo, salidas desactivadas.

### Umbrales ilustrativos del borrador académico

- Lechuga A: activar si humedad < 38,1%; detener si humedad ≥ 48,0%.
- Tomate B: activar si humedad < 34,8%; detener si humedad ≥ 48,0%.
- Entre los umbrales, se mantiene el estado previo (histéresis).
- **Estos porcentajes no están calibrados**. El software no representa control validado de plantas reales.
- Alta temperatura (≥30 °C) y baja humedad relativa (≤45%) solo generan aviso de ajuste de frecuencia de lectura. Son umbrales visuales de demostración, no una recomendación agronómica general.

## Estructura principal

```text
app/
  layout.tsx        Layout de Next.js
  page.tsx          Página principal
  globals.css       Diseño responsive
components/
  UrbanGrowExperience.tsx   Paneles, controles, escenarios y selección
  GardenScene.tsx           Objetos, luces, tuberías, cultivos y cotas 3D
  ArchitectureDiagram.tsx   Diagrama funcional interactivo
lib/
  design.ts         Dimensiones, variables y fichas técnicas
```

## Limitaciones y próximos pasos

Para la Fase 1 el modelo ilustra una implementación físicamente plausible. La compatibilidad eléctrica, hidráulica, presiones, caudales, número de emisores, alturas de succión, nivel útil del tanque, calibración de sensores y tiempos de riego **no han sido evaluados experimentalmente**. La simulación visual de condiciones no es una simulación hidráulica.

En la Fase 2 se recomienda realizar una simulación funcional independiente de sensores, controlador y salidas, con evidencia de escenarios, antes de integrar el sistema en la Fase 3.

## Referencias para el marco técnico

- Documentación de Next.js: https://nextjs.org/docs/app
- React Three Fiber: https://r3f.docs.pmnd.rs/getting-started/introduction
- Sensores y GPIO de Espressif: https://docs.espressif.com/projects/esp-idf/en/stable/esp32/
- FAO-56, evapotranspiración del cultivo: https://www.fao.org/4/x0490e/x0490e00.htm

---

**Pie de figura sugerido:** *Figura X. Modelo tridimensional conceptual del sistema autónomo de riego diferenciado URBANGROW CHALLENGE. Los valores dimensionales son hipótesis geométricas preliminares de diseño. Elaboración propia en Next.js, React y Three.js (2026).*
