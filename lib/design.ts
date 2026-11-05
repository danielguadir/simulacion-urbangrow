/**
 * PARÁMETROS GEOMÉTRICOS Y AGRONÓMICOS - FASE 1
 * Escala de la escena: 1 unidad Three.js = 1 metro.
 */
export const DESIGN = {
  site: { width: 4.80, depth: 3.60 },
  bed: { width: 0.80, length: 1.00, lettuceHeight: 0.30, tomatoHeight: 0.30 },
  aisle: 0.80,
  tank: { diameter: 0.32, height: 0.38, geometricVolumeLiters: 20.0, reserveLiters: 4.0 },
  rootZone: {
    lettuce: { min: 0.08, max: 0.12, label: '8-12 cm' },
    tomato: { min: 0.15, max: 0.20, label: '15-20 cm' },
  },
  lettuce: { on: 38.1, off: 48.0 },
  tomato: { on: 34.8, off: 48.0 },
} as const;

export type Zone = 'A' | 'B';
export type ViewMode = 'iso' | 'top' | 'front' | 'side' | 'hydraulic' | 'electronic';
export type ComponentId =
  | 'bedA' | 'bedB' | 'moistureA' | 'moistureB' | 'environment'
  | 'tank' | 'float' | 'pump' | 'filter' | 'valveA' | 'valveB'
  | 'esp32' | 'pipe';

export const COMPONENT_NUMBERS: Record<ComponentId, { num: number; short: string }> = {
  bedA: { num: 1, short: 'Cama A (Lechuga 1,00×0,80×0,30 m)' },
  bedB: { num: 2, short: 'Cama B (Tomate 1,00×0,80×0,30 m)' },
  pipe: { num: 3, short: 'Líneas de goteo y red hidráulica' },
  moistureA: { num: 4, short: 'Sensor Humedad A (8-12 cm prof.)' },
  moistureB: { num: 5, short: 'Sensor Humedad B (15-20 cm prof.)' },
  tank: { num: 6, short: 'Tanque 20 L (Ø 0,32 m × 0,38 m)' },
  float: { num: 7, short: 'Sensor de nivel (Flotador magnético 4 L)' },
  pump: { num: 8, short: 'Bomba hidráulica compartida (12V DC)' },
  filter: { num: 9, short: 'Filtro de riego en línea (120 mesh)' },
  valveA: { num: 10, short: 'Electroválvula Sector A (NC 12V)' },
  valveB: { num: 11, short: 'Electroválvula Sector B (NC 12V)' },
  esp32: { num: 12, short: 'Gabinete ESP32 & Potencia (IP65)' },
  environment: { num: 13, short: 'Sensor Ambiental SHT31 (Garita ventilada)' },
};

export const COMPONENTS: Record<ComponentId, {
  number: number;
  category: string;
  title: string;
  subtitle: string;
  role: string;
  specification: string;
  validation: string;
}> = {
  bedA: {
    number: 1,
    category: 'SISTEMA AGRONÓMICO · ZONA A',
    title: 'Cama de lechuga (Zona A)', subtitle: 'Lactuca sativa L.',
    role: 'Cultivo de hoja en cama elevada con requerimiento radicular somero e irrigación por goteo.',
    specification: '1,00 m largo × 0,80 m ancho × 0,30 m prof.',
    validation: 'Cumple especificación nominal de 1m × 0,8m × 0,3m con 2 líneas de goteo.'
  },
  bedB: {
    number: 2,
    category: 'SISTEMA AGRONÓMICO · ZONA B',
    title: 'Cama de tomate cherry (Zona B)', subtitle: 'Solanum lycopersicum L.',
    role: 'Cultivo de fruto con entutorado y mayor profundidad efectiva de raíces.',
    specification: '1,00 m largo × 0,80 m ancho × 0,30 m prof.',
    validation: 'Cumple especificación nominal de 1m × 0,8m × 0,3m con entutorado vertical.'
  },
  pipe: {
    number: 3,
    category: 'DISTRIBUCIÓN HIDRÁULICA',
    title: 'Líneas de goteo y red hidráulica', subtitle: 'A lo largo de cada cama',
    role: 'Distribución superficial de agua con goteros calibrados por sector independiente.',
    specification: '2 laterales por cama · emisores cada 20 cm · caudal 1-2 L/h',
    validation: 'Geometría ajustada a camas de 1,00 m; filtrado previo para evitar obturación.'
  },
  moistureA: {
    number: 4,
    category: 'ADQUISICIÓN DE DATOS',
    title: 'Sensor de humedad A', subtitle: 'Zona radicular representativa lechuga',
    role: 'Monitoreo de humedad en el bulbo húmedo radicular somero (8 a 12 cm de profundidad).',
    specification: 'Sonda capacitiva en sustrato | Profundidad: 8 - 12 cm',
    validation: 'Instalado a profundidad de 8-12 cm representativa para lechuga, sin pegar al gotero.'
  },
  moistureB: {
    number: 5,
    category: 'ADQUISICIÓN DE DATOS',
    title: 'Sensor de humedad B', subtitle: 'Zona radicular representativa tomate',
    role: 'Monitoreo de humedad en el estrato radicular medio-profundo (15 a 20 cm de profundidad).',
    specification: 'Sonda capacitiva en sustrato | Profundidad: 15 - 20 cm',
    validation: 'Instalado a profundidad de 15-20 cm representativa para desarrollo radicular de tomate.'
  },
  tank: {
    number: 6,
    category: 'ALMACENAMIENTO HÍDRICO',
    title: 'Tanque de abastecimiento', subtitle: 'Capacidad nominal 20 L · Reserva de seguridad 4 L',
    role: 'Depósito principal dimensionado para la demanda hídrica calculada de las 2 camas de 1,00 m.',
    specification: 'Cilíndrico Ø 0,32 m × h 0,38 m · Volumen útil aprox. 16 L · Reserva 4 L (20%)',
    validation: 'Medida preliminar. La succión en el fondo alimenta por gravedad la bomba compartida.'
  },
  float: {
    number: 7,
    category: 'SEGURIDAD HIDRÁULICA',
    title: 'Interruptor de nivel por flotador', subtitle: 'Boya magnética vertical reed-switch',
    role: 'Interbloqueo prioritario mandatario: suspende bomba y electroválvulas si el volumen desciende de 4 L.',
    specification: 'Flotador vertical estanco IP68 · contacto libre de potencial NA/NC · corte en cota 4 L',
    validation: 'Decisión técnica unificada: se descarta sensor ultrasónico debido a su zona muerta (20-25 cm) incompatible con la altura de 38 cm del tanque. El flotador magnético garantiza corte positivo contra cavitación.'
  },
  pump: {
    number: 8,
    category: 'ACTUACIÓN HIDRÁULICA',
    title: 'Bomba hidráulica compartida', subtitle: '12V DC · Impulsión hacia sectores A y B',
    role: 'Suministra presión constante a la red de riego cuando existe demanda y nivel seguro en tanque.',
    specification: 'Bomba diafragma 12V DC / 2-3 bar · accionada por MOSFET/relé con diodo flyback',
    validation: 'Bomba compartida con reparto secuencial por turnos (TDM) para evitar pérdidas de carga simultáneas.'
  },
  filter: {
    number: 9,
    category: 'PROTECCIÓN HIDRÁULICA',
    title: 'Filtro de riego en línea', subtitle: 'Malla / anillas 120-150 mesh',
    role: 'Retiene partículas y sedimentos antes del ingreso a las electroválvulas y ramales de goteo.',
    specification: 'Carcasa desmontable para purga · capacidad de caudal hasta 10 L/min',
    validation: 'Instalado entre la salida de la bomba y la derivación en T hacia las electroválvulas.'
  },
  valveA: {
    number: 10,
    category: 'ACTUACIÓN · SECTOR A',
    title: 'Electroválvula sector A', subtitle: 'Línea de lechuga · Normalmente cerrada (NC)',
    role: 'Habilita el flujo exclusivo a la cama A cuando se activa su turno de riego.',
    specification: 'Solenoide 12V DC · Normalmente Cerrada (NC) · rosca 1/2" · bobina protegida',
    validation: 'Abre sólo con demanda de humedad en A (<38,1%) y confirmación de nivel en tanque OK.'
  },
  valveB: {
    number: 11,
    category: 'ACTUACIÓN · SECTOR B',
    title: 'Electroválvula sector B', subtitle: 'Línea de tomate · Normalmente cerrada (NC)',
    role: 'Habilita el flujo exclusivo a la cama B cuando se activa su turno de riego.',
    specification: 'Solenoide 12V DC · Normalmente Cerrada (NC) · rosca 1/2" · bobina protegida',
    validation: 'Abre sólo con demanda de humedad en B (<34,8%) y confirmación de nivel en tanque OK.'
  },
  esp32: {
    number: 12,
    category: 'CONTROL & POTENCIA',
    title: 'Gabinete ESP32 & Potencia', subtitle: 'Gabinete IP65 · Zona seca frontal',
    role: 'Cerebro autónomo: adquisición de señales, máquina de estados finitos, conmutación de potencia y telemetría.',
    specification: 'ESP32 DevKit v1 · módulo relés optoacoplados · convertidor DC-DC 12V/5V · borneras y prensaestopas IP68',
    validation: 'Separación física estricta entre electrónica de control (zona seca) y redes de agua.'
  },
  environment: {
    number: 13,
    category: 'ADQUISICIÓN AMBIENTAL',
    title: 'Sensor ambiental SHT31', subtitle: 'Garita meteorológica de platos ranurados',
    role: 'Mide Temperatura y Humedad Relativa del aire para estimar demanda evaporativa ambiental.',
    specification: 'Sensor digital SHT31 · protocolo I²C (SDA/SCL) · precisión ±2% HR, ±0.2 °C',
    validation: 'Alojado en abrigo meteorológico ranurado a 1,20 m de altura para evitar radiación directa y gotas.'
  }
};

export interface WiringPin {
  pin: string;
  type: 'ADC' | 'I2C' | 'DIGITAL_IN' | 'DIGITAL_OUT' | 'POWER';
  device: string;
  description: string;
  voltage: string;
}

export const ESP32_PINOUT: WiringPin[] = [
  { pin: 'GPIO 34', type: 'ADC', device: 'Sensor Humedad A (Lechuga)', description: 'Lectura analógica ADC1_CH6 (0-3.3V) a 8-12 cm prof. en sustrato', voltage: '3.3V DC' },
  { pin: 'GPIO 35', type: 'ADC', device: 'Sensor Humedad B (Tomate)', description: 'Lectura analógica ADC1_CH7 (0-3.3V) a 15-20 cm prof. en sustrato', voltage: '3.3V DC' },
  { pin: 'GPIO 21', type: 'I2C', device: 'SHT31 Ambiental (SDA)', description: 'Bus I2C de datos bidireccional (temperatura y humedad relativa del aire)', voltage: '3.3V DC' },
  { pin: 'GPIO 22', type: 'I2C', device: 'SHT31 Ambiental (SCL)', description: 'Bus I2C línea de reloj de sincronización para adquisición periódica', voltage: '3.3V DC' },
  { pin: 'GPIO 27', type: 'DIGITAL_IN', device: 'Interruptor de nivel (Flotador)', description: 'Entrada digital Pull-up. Nivel OK=1; Nivel < 4L=0 (Bloqueo prioritario)', voltage: '3.3V DC' },
  { pin: 'GPIO 25', type: 'DIGITAL_OUT', device: 'Bomba hidráulica compartida', description: 'Comando digital a optoacoplador de potencia para activar alimentación 12V DC', voltage: 'Opto 12V' },
  { pin: 'GPIO 26', type: 'DIGITAL_OUT', device: 'Electroválvula Sector A', description: 'Comando digital a driver MOSFET/Relé de solenoide normalmente cerrado 12V', voltage: 'Opto 12V' },
  { pin: 'GPIO 33', type: 'DIGITAL_OUT', device: 'Electroválvula Sector B', description: 'Comando digital a driver MOSFET/Relé de solenoide normalmente cerrado 12V', voltage: 'Opto 12V' },
  { pin: 'VIN / 5V', type: 'POWER', device: 'Alimentación ESP32', description: 'Salida de convertidor Step-Down Buck DC-DC (12V batería/red -> 5V estable)', voltage: '5.0V DC' },
  { pin: 'GND', type: 'POWER', device: 'Masa de referencia común', description: 'Punto de referencia equipotencial compartido entre control y potencia', voltage: '0V' },
];

export const componentKeys: ComponentId[] = [
  'bedA','bedB','pipe','moistureA','moistureB','tank','float',
  'pump','filter','valveA','valveB','esp32','environment'
];

export const displayNumber = (n: number, digits = 2) => n.toFixed(digits).replace('.', ',');
