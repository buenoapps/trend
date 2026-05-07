import type { Translations } from './en';

const es = {
  tabs: { today: 'Hoy', trend: 'Tendencia', settings: 'Ajustes' },
  today: {
    todayLabel: 'Hoy',
    yesterdayLabel: 'Ayer',
    previousDay: 'Día anterior',
    nextDay: 'Día siguiente',
    deltaUp: '▲ {{weight}} desde el {{date}}',
    deltaDown: '▼ {{weight}} desde el {{date}}',
    deltaSteady: 'Sin cambios desde el registro anterior.',
  },
  history: {
    title: 'Tu tendencia',
    entriesInWindow: {
      one: '{{count}} entrada en este periodo',
      other: '{{count}} entradas en este periodo',
    },
    range7: '7 días',
    range30: '30 días',
    rangeAll: 'Todo',
    empty: 'Aún no hay entradas en este periodo.',
    statChange: 'Cambio',
    statLow: 'Mínimo',
    statHigh: 'Máximo',
  },
  settings: {
    title: 'Ajustes',
    units: 'Unidades',
    unitsNote:
      'Se guarda internamente en kilogramos; cambia cuando quieras sin perder datos.',
    reminder: 'Recordatorio diario',
    reminderSwitch: 'Recordarme registrar mi peso',
    time: 'Hora',
    reminderWebNote:
      'Los recordatorios aún no están disponibles en la web — abre Trend en iOS o Android para activarlos.',
    language: 'Idioma',
    languageAuto: 'Automático (dispositivo)',
    yourData: 'Tus datos',
    exportJson: 'Exportar como JSON',
    exportJsonCount: { one: '{{count}} entrada', other: '{{count}} entradas' },
    exportCsv: 'Exportar como CSV',
    exportCsvSubtitle: 'Compatible con hojas de cálculo',
    importData: 'Importar datos',
    importSubtitle: 'JSON o CSV — las entradas del mismo día se reemplazan',
    footer: 'Trend guarda todo en este dispositivo. Tu brote cree en ti.',
  },
  alerts: {
    permissionRequired: 'Permiso requerido',
    permissionBody:
      'Activa las notificaciones en los ajustes del dispositivo para usar los recordatorios.',
    nothingToExport: 'Nada que exportar',
    nothingToExportBody: 'Registra un peso primero y vuelve después.',
    exportFailed: 'Error al exportar',
    importFailed: 'Error al importar',
    importTitle: 'Importar datos',
    importConfirm:
      '¿Importar {{count}} entradas desde {{filename}}? Las entradas existentes en la misma fecha se reemplazarán.',
    importComplete: 'Importación completada',
    importCompleteBody: {
      one: '{{count}} entrada fusionada.',
      other: '{{count}} entradas fusionadas.',
    },
    cancel: 'Cancelar',
    import: 'Importar',
    unknownError: 'Error desconocido',
  },
  form: {
    placeholderToday: 'Hoy: pulsa para actualizar',
    placeholderPast: 'Pulsa para actualizar',
    placeholderEmpty: 'Tu peso',
    save: 'Guardar',
    saved: 'Guardado — buen trabajo.',
    a11yInput: 'Entrada de peso',
    a11ySave: 'Guardar el peso de hoy',
    errorEmpty: 'Introduce un número',
    errorNotANumber: 'Eso no parece un número',
    errorNegative: 'El peso debe ser positivo',
    errorTooLarge: 'Eso parece demasiado alto',
  },
  emptyState: {
    title: 'Planta tu primer punto de datos',
    subtitle: 'Registra un peso en la pestaña Hoy y tu tendencia empezará aquí.',
  },
  notification: {
    channelName: 'Recordatorio diario',
    title: 'Hora de registrar tu peso',
    body: 'Un toque rápido mantiene tu tendencia honesta.',
  },
  timePicker: { changeLabel: 'Cambiar {{label}}' },
} satisfies Translations;

export default es;
