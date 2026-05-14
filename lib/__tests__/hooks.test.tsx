import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import {
  __resetHooksForTest,
  useActiveDate,
  useEntries,
  useEntriesForPerson,
  usePersons,
  useSettings,
} from '../hooks';
import type { Person } from '../types';

const PERSON: Person = {
  id: 'p1',
  name: 'Ada',
  colorKey: 'leaf',
  kind: 'adult',
  goal: 'none',
  cardDisplay: 'big',
  createdAt: 1,
};

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
          upsert({ personId: 'p1', date: '2026-05-01', kg: 70 });
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

function PersonsProbe({ id }: { id: string }) {
  const { persons, upsert } = usePersons();
  return (
    <>
      <Text testID={`${id}-count`}>{persons.length}</Text>
      <Text testID={`${id}-add`} onPress={() => upsert(PERSON)}>
        add
      </Text>
    </>
  );
}

describe('usePersons (shared store)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetHooksForTest();
  });

  it('adding from one consumer re-renders all consumers', async () => {
    render(
      <>
        <PersonsProbe id="a" />
        <PersonsProbe id="b" />
      </>,
    );
    await act(async () => {});
    expect(screen.getByTestId('a-count').props.children).toBe(0);

    await act(async () => {
      await screen.getByTestId('a-add').props.onPress();
    });

    expect(screen.getByTestId('a-count').props.children).toBe(1);
    expect(screen.getByTestId('b-count').props.children).toBe(1);
  });
});

function PersonEntriesProbe() {
  const { entries, upsert } = useEntriesForPerson('p1');
  return (
    <>
      <Text testID="p1-count">{entries.length}</Text>
      <Text
        testID="add-p1"
        onPress={() => upsert({ personId: 'p1', date: '2026-05-01', kg: 70 })}>
        add-p1
      </Text>
      <Text
        testID="add-p2"
        onPress={() => upsert({ personId: 'p2', date: '2026-05-01', kg: 60 })}>
        add-p2
      </Text>
    </>
  );
}

describe('useEntriesForPerson', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetHooksForTest();
  });

  it('filters the shared store to one person', async () => {
    render(<PersonEntriesProbe />);
    await act(async () => {});
    expect(screen.getByTestId('p1-count').props.children).toBe(0);

    await act(async () => {
      await screen.getByTestId('add-p2').props.onPress();
    });
    expect(screen.getByTestId('p1-count').props.children).toBe(0);

    await act(async () => {
      await screen.getByTestId('add-p1').props.onPress();
    });
    expect(screen.getByTestId('p1-count').props.children).toBe(1);
  });
});

function ActiveDateProbe({ id }: { id: string }) {
  const [date, setDate] = useActiveDate();
  return (
    <>
      <Text testID={`${id}-date`}>{date}</Text>
      <Text testID={`${id}-set`} onPress={() => setDate('2026-05-04')}>
        set
      </Text>
    </>
  );
}

describe('useActiveDate (shared store)', () => {
  beforeEach(() => {
    __resetHooksForTest();
  });

  it('setting from one consumer re-renders all consumers', async () => {
    render(
      <>
        <ActiveDateProbe id="a" />
        <ActiveDateProbe id="b" />
      </>,
    );
    await act(async () => {});

    await act(async () => {
      screen.getByTestId('a-set').props.onPress();
    });

    expect(screen.getByTestId('a-date').props.children).toBe('2026-05-04');
    expect(screen.getByTestId('b-date').props.children).toBe('2026-05-04');
  });
});
