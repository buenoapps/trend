import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { __resetHooksForTest, useEntries, useSettings } from '../hooks';

function SettingsProbe({ id }: { id: string }) {
  const { settings, update } = useSettings();
  return (
    <>
      <Text testID={`${id}-unit`}>{settings.unit}</Text>
      <Text testID={`${id}-update`} onPress={() => update({ unit: 'lb' })}>
        update
      </Text>
    </>
  );
}

function EntriesProbe({ id }: { id: string }) {
  const { entries, upsert } = useEntries();
  return (
    <>
      <Text testID={`${id}-count`}>{entries.length}</Text>
      <Text
        testID={`${id}-add`}
        onPress={() => {
          upsert({ date: '2026-05-01', kg: 70 });
        }}>
        add
      </Text>
    </>
  );
}

describe('useSettings (shared store)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetHooksForTest();
  });

  it('updating from one consumer re-renders all consumers', async () => {
    render(
      <>
        <SettingsProbe id="a" />
        <SettingsProbe id="b" />
      </>,
    );
    await act(async () => {});
    expect(screen.getByTestId('a-unit').props.children).toBe('kg');
    expect(screen.getByTestId('b-unit').props.children).toBe('kg');

    await act(async () => {
      screen.getByTestId('a-update').props.onPress();
    });

    expect(screen.getByTestId('a-unit').props.children).toBe('lb');
    expect(screen.getByTestId('b-unit').props.children).toBe('lb');
  });
});

describe('useEntries (shared store)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetHooksForTest();
  });

  it('upserting from one consumer re-renders all consumers', async () => {
    render(
      <>
        <EntriesProbe id="a" />
        <EntriesProbe id="b" />
      </>,
    );
    await act(async () => {});
    expect(screen.getByTestId('a-count').props.children).toBe(0);
    expect(screen.getByTestId('b-count').props.children).toBe(0);

    await act(async () => {
      await screen.getByTestId('a-add').props.onPress();
    });

    expect(screen.getByTestId('a-count').props.children).toBe(1);
    expect(screen.getByTestId('b-count').props.children).toBe(1);
  });
});
