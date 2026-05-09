import { act, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { __resetI18nForTest, getLocale, setLocale, t, type TFunction, type TranslationKey, useT } from '../i18n';
import de from '../i18n/de';
import en from '../i18n/en';
import es from '../i18n/es';
import fr from '../i18n/fr';
import italian from '../i18n/it';

type Shape = string | { [k: string]: Shape };

function walk(value: unknown): Shape {
  if (value && typeof value === 'object') {
    const out: Record<string, Shape> = {};
    for (const k of Object.keys(value as object)) {
      out[k] = walk((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return 'string';
}

describe('i18n locale shape', () => {
  it.each([
    ['de', de],
    ['es', es],
    ['fr', fr],
    ['it', italian],
  ])('%s exports the same key shape as en', (_name, locale) => {
    expect(walk(locale)).toEqual(walk(en));
  });
});

describe('i18n runtime', () => {
  beforeEach(() => {
    __resetI18nForTest();
  });

  it('defaults to English', () => {
    expect(getLocale()).toBe('en');
    expect(t('tabs.today')).toBe('Today');
  });

  it('switches translations when setLocale is called', () => {
    setLocale('de');
    expect(t('tabs.today')).toBe('Heute');
    setLocale('it');
    expect(t('tabs.today')).toBe('Oggi');
  });

  it('falls back to English for missing keys', () => {
    setLocale('de');
    expect(t('does.not.exist' as TranslationKey)).toContain('does.not.exist');
  });

  it('interpolates parameters', () => {
    setLocale('en');
    expect(t('today.deltaUp', { weight: '1.2 kg', date: 'May 6' })).toBe(
      '▲ 1.2 kg since May 6',
    );
  });

  it('selects plural forms by count', () => {
    setLocale('en');
    expect(t('history.entriesInWindow', { count: 1 })).toBe('1 entry in this window');
    expect(t('history.entriesInWindow', { count: 5 })).toBe('5 entries in this window');
    setLocale('de');
    expect(t('history.entriesInWindow', { count: 1 })).toBe('1 Eintrag in diesem Zeitraum');
    expect(t('history.entriesInWindow', { count: 5 })).toBe('5 Einträge in diesem Zeitraum');
  });
});

describe('useT', () => {
  beforeEach(() => {
    __resetI18nForTest();
  });

  it('returns a new function reference whenever the locale changes', () => {
    const refs: TFunction[] = [];
    function Probe() {
      refs.push(useT());
      return <Text testID="probe">x</Text>;
    }
    render(<Probe />);
    const first = refs[refs.length - 1];

    act(() => {
      setLocale('de');
    });
    const second = refs[refs.length - 1];
    expect(second).not.toBe(first);
    expect(second('tabs.today')).toBe('Heute');

    act(() => {
      setLocale('fr');
    });
    const third = refs[refs.length - 1];
    expect(third).not.toBe(second);
    expect(third('tabs.today')).toBe('Aujourd’hui');
  });

  it('keeps the same reference across renders when the locale is unchanged', () => {
    const refs: TFunction[] = [];
    function Probe({ tick }: { tick: number }) {
      refs.push(useT());
      return <Text testID="probe">{tick}</Text>;
    }
    const { rerender } = render(<Probe tick={0} />);
    const first = refs[refs.length - 1];
    rerender(<Probe tick={1} />);
    const second = refs[refs.length - 1];
    expect(second).toBe(first);
  });
});
