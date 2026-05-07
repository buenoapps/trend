import type { Translations } from './en';

const de = {
  tabs: { today: 'Heute', trend: 'Verlauf', settings: 'Einstellungen' },
  today: {
    todayLabel: 'Heute',
    yesterdayLabel: 'Gestern',
    previousDay: 'Vorheriger Tag',
    nextDay: 'Nächster Tag',
    deltaUp: '▲ {{weight}} seit {{date}}',
    deltaDown: '▼ {{weight}} seit {{date}}',
    deltaSteady: 'Unverändert seit dem letzten Eintrag.',
  },
  history: {
    title: 'Dein Verlauf',
    entriesInWindow: {
      one: '{{count}} Eintrag in diesem Zeitraum',
      other: '{{count}} Einträge in diesem Zeitraum',
    },
    range7: '7 Tage',
    range30: '30 Tage',
    rangeAll: 'Alle',
    empty: 'Noch keine Einträge in diesem Zeitraum.',
    statChange: 'Veränderung',
    statLow: 'Tiefstwert',
    statHigh: 'Höchstwert',
  },
  settings: {
    title: 'Einstellungen',
    units: 'Einheiten',
    unitsNote:
      'Wird intern in Kilogramm gespeichert; jederzeit umschaltbar, ohne Daten zu verlieren.',
    reminder: 'Tägliche Erinnerung',
    reminderSwitch: 'Erinnere mich, mein Gewicht einzutragen',
    time: 'Zeit',
    reminderWebNote:
      'Erinnerungen sind im Web noch nicht verfügbar — öffne Trend auf iOS oder Android, um sie zu aktivieren.',
    language: 'Sprache',
    languageAuto: 'Automatisch (Gerät)',
    yourData: 'Deine Daten',
    exportJson: 'Als JSON exportieren',
    exportJsonCount: { one: '{{count}} Eintrag', other: '{{count}} Einträge' },
    exportCsv: 'Als CSV exportieren',
    exportCsvSubtitle: 'Tabellenkalkulationsfreundlich',
    importData: 'Daten importieren',
    importSubtitle: 'JSON oder CSV — Einträge mit gleichem Datum werden ersetzt',
    footer: 'Trend speichert alles auf diesem Gerät. Dein Sprössling glaubt an dich.',
  },
  alerts: {
    permissionRequired: 'Berechtigung erforderlich',
    permissionBody:
      'Aktiviere Benachrichtigungen in den Geräteeinstellungen, um Erinnerungen zu nutzen.',
    nothingToExport: 'Nichts zu exportieren',
    nothingToExportBody: 'Trage zuerst ein Gewicht ein und komm dann zurück.',
    exportFailed: 'Export fehlgeschlagen',
    importFailed: 'Import fehlgeschlagen',
    importTitle: 'Daten importieren',
    importConfirm:
      '{{count}} Einträge aus {{filename}} importieren? Bestehende Einträge mit gleichem Datum werden ersetzt.',
    importComplete: 'Import abgeschlossen',
    importCompleteBody: {
      one: '{{count}} Eintrag zusammengeführt.',
      other: '{{count}} Einträge zusammengeführt.',
    },
    cancel: 'Abbrechen',
    import: 'Importieren',
    unknownError: 'Unbekannter Fehler',
  },
  form: {
    placeholderToday: 'Heute: tippen zum Aktualisieren',
    placeholderPast: 'Tippen zum Aktualisieren',
    placeholderEmpty: 'Dein Gewicht',
    save: 'Speichern',
    saved: 'Gespeichert — gut gemacht.',
    a11yInput: 'Gewichtseingabe',
    a11ySave: 'Heutiges Gewicht speichern',
    errorEmpty: 'Gib eine Zahl ein',
    errorNotANumber: 'Das sieht nicht nach einer Zahl aus',
    errorNegative: 'Gewicht muss positiv sein',
    errorTooLarge: 'Das scheint zu hoch',
  },
  emptyState: {
    title: 'Setze deinen ersten Datenpunkt',
    subtitle: 'Trage ein Gewicht im Heute-Tab ein, dann beginnt hier dein Verlauf.',
  },
  notification: {
    channelName: 'Tägliche Erinnerung',
    title: 'Zeit, dein Gewicht einzutragen',
    body: 'Ein kurzer Tipp hält deinen Verlauf ehrlich.',
  },
  timePicker: { changeLabel: '{{label}} ändern' },
} satisfies Translations;

export default de;
