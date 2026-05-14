import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { todayKey } from './dates';
import {
  decodeBackup,
  decodeCsv,
  encodeBackup,
  entriesToCsv,
  sniffFormat,
  type DecodeResult,
  type ImportResult,
} from './serialize';
import type { DraftEntry, Person, WeightEntry } from './types';

const JSON_MIME = 'application/json';
const CSV_MIME = 'text/csv';
const JSON_UTI = 'public.json';
const CSV_UTI = 'public.comma-separated-values-text';

async function writeAndShare(
  filename: string,
  body: string,
  mime: string,
  uti: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([body], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(body);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: mime, UTI: uti });
  }
}

/** Global JSON backup — every person plus every entry, round-trippable. */
export async function exportBackup(persons: Person[], entries: WeightEntry[]): Promise<void> {
  await writeAndShare(
    `trend-backup-${todayKey()}.json`,
    encodeBackup(persons, entries),
    JSON_MIME,
    JSON_UTI,
  );
}

function slug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'person';
}

/** Per-person CSV — `date,kg` rows, no person column. */
export async function exportPersonCsv(name: string, entries: DraftEntry[]): Promise<void> {
  await writeAndShare(
    `trend-${slug(name)}-${todayKey()}.csv`,
    entriesToCsv(entries),
    CSV_MIME,
    CSV_UTI,
  );
}

export type ImportPayload = { filename: string; text: string };

async function pickWeb(): Promise<ImportPayload | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json,application/json,text/csv';
    input.style.display = 'none';
    input.onchange = async () => {
      const file = input.files?.[0];
      document.body.removeChild(input);
      if (!file) return resolve(null);
      const text = await file.text();
      resolve({ filename: file.name, text });
    };
    document.body.appendChild(input);
    input.click();
  });
}

export async function importFromPicker(): Promise<ImportPayload | null> {
  if (Platform.OS === 'web') return pickWeb();
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/csv', 'text/comma-separated-values', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!asset) return null;
  const file = new File(asset.uri);
  const text = await file.text();
  return { filename: asset.name ?? 'import', text };
}

export function decodePayload(payload: ImportPayload): DecodeResult<ImportResult> {
  const lower = payload.filename.toLowerCase();
  const format = lower.endsWith('.csv')
    ? 'csv'
    : lower.endsWith('.json')
      ? 'json'
      : sniffFormat(payload.text);
  if (format === 'csv') {
    const r = decodeCsv(payload.text);
    return r.ok ? { ok: true, value: { kind: 'entries', entries: r.value } } : r;
  }
  return decodeBackup(payload.text);
}
