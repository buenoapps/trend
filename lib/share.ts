import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { todayKey } from './dates';
import {
  entriesFromCsv,
  entriesFromJson,
  entriesToCsv,
  entriesToJson,
  sniffFormat,
  type DecodeResult,
} from './serialize';
import type { WeightEntry } from './types';

type ExportKind = 'json' | 'csv';

const MIME = {
  json: 'application/json',
  csv: 'text/csv',
};

const UTI = {
  json: 'public.json',
  csv: 'public.comma-separated-values-text',
};

function buildBody(entries: WeightEntry[], kind: ExportKind): string {
  return kind === 'json' ? entriesToJson(entries) : entriesToCsv(entries);
}

export async function exportEntries(entries: WeightEntry[], kind: ExportKind): Promise<void> {
  const body = buildBody(entries, kind);
  const filename = `trend-${todayKey()}.${kind}`;

  if (Platform.OS === 'web') {
    const blob = new Blob([body], { type: MIME[kind] });
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
    await Sharing.shareAsync(file.uri, { mimeType: MIME[kind], UTI: UTI[kind] });
  }
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

export function decodePayload(payload: ImportPayload): DecodeResult<WeightEntry[]> {
  const lower = payload.filename.toLowerCase();
  const format = lower.endsWith('.csv')
    ? 'csv'
    : lower.endsWith('.json')
      ? 'json'
      : sniffFormat(payload.text);
  return format === 'json' ? entriesFromJson(payload.text) : entriesFromCsv(payload.text);
}
