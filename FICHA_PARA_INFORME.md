# Boceto conceptual de implementación física — URBANGROW CHALLENGE

**Figura recomendada:**

> **Figura X.** Modelo tridimensional conceptual de la implementación física del sistema autónomo de riego diferenciado URBANGROW CHALLENGE. Se representan la cama A (lechuga), la cama B (tomate), sensores independientes de humedad, sensor ambiental SHT31, tanque con interruptor de nivel, bomba, filtro, dos electroválvulas y controlador ESP32. Las dimensiones indicadas son hipótesis preliminares de diseño y están sujetas a validación. Elaboración propia en Next.js, React y Three.js (2026).

**Texto para añadir después de la figura:**

La disposición propuesta contempla dos camas elevadas de 1,00 m de longitud, 0,80 m de ancho y 0,30 m de profundidad, separadas por un pasillo central de servicio de 0,80 m, dentro de un módulo de implantación preliminar de 4,80 × 3,60 m. La cama A se destina a lechuga (*Lactuca sativa L.*) con sensor capacitivo insertado en el estrato radicular somero (8 a 12 cm de profundidad), mientras que la cama B se destina a tomate cherry (*Solanum lycopersicum L.*) entutorado, con sensor capacitivo ubicado en el estrato radicular medio-profundo (15 a 20 cm).

La zona de servicio frontal concentra de forma lineal y ordenada el almacenamiento hídrico en un tanque de 20 L, la bomba hidráulica compartida de 12V DC, el filtro de riego de anillas (120 mesh), la derivación central en T hacia las dos electroválvulas normalmente cerradas (sectores A y B), y el gabinete hermético IP65 que aloja el microcontrolador ESP32 y los módulos de potencia en zona seca. Sobre el frontal se ubica a 1,20 m el sensor ambiental SHT31 protegido dentro de una garita meteorológica ventilada.

El suministro hídrico opera mediante una bomba compartida y dos electroválvulas independientes. Cuando ambos cultivos demandan agua simultáneamente, el sistema ejecuta una conmutación secuencial por turnos (multiplexación por tiempo, TDM), lo que garantiza mantener el caudal y presión nominal de diseño en cada línea de goteo sin pérdidas de carga. Para la seguridad del sistema se unificó la selección de un *interruptor de nivel vertical por flotador magnético libre de potencial (reed-switch)* calibrado a la cota crítica de reserva de 4 L; esta decisión técnica descarta el uso de sensores ultrasónicos debido a su zona muerta física (20 a 25 cm), la cual resultaría incompatible con la altura reducida (38 cm) del tanque de 20 L. Ante nivel insuficiente (< 4 L), el ESP32 ejecuta un corte prioritario de seguridad bloqueando inmediatamente la bomba para evitar cavitación y trabajo en seco.

El modelo tridimensional se elaboró utilizando una escala geométrica interna de una unidad por metro. Las dimensiones, los caudales, la capacidad útil del tanque, la profundidad efectiva de las sondas, los tiempos de riego y los parámetros de control deberán verificarse y, de ser necesario, ajustarse antes de la implementación física. Por lo tanto, el boceto constituye un instrumento de formulación y comunicación técnica, no un plano constructivo final ni una simulación hidráulica validada.

## Relación con las fases del curso

- **Fase 1:** diagrama funcional y boceto conceptual de implementación física (prototipo digital demostrativo).
- **Fase 2:** implementar y validar en simulación los subsistemas de adquisición, control y actuación.
- **Fase 3:** integrar subsistemas y evaluar técnica, ambiental y económicamente.
