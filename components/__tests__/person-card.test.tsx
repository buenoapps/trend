import { act, fireEvent, render, screen } from '@testing-library/react-native';

import type { Person } from '@/lib/types';

import { PersonCard } from '../person-card';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const flush = () => act(async () => {});

const PERSON: Person = {
  id: 'p1',
  name: 'Ada',
  colorKey: 'leaf',
  kind: 'adult',
  goal: 'none',
  cardDisplay: 'big',
  createdAt: 1,
};

describe('PersonCard', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders the person name and an inline weight input', async () => {
    render(<PersonCard person={PERSON} entries={[]} unit="kg" onSave={jest.fn()} />);
    await flush();
    expect(screen.getByText('Ada')).toBeTruthy();
    expect(screen.getByLabelText('Weight input')).toBeTruthy();
  });

  it('navigates to the person detail when the header is tapped', async () => {
    render(<PersonCard person={PERSON} entries={[]} unit="kg" onSave={jest.fn()} />);
    await flush();

    fireEvent.press(screen.getByLabelText('Ada'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/person/[id]',
      params: { id: 'p1' },
    });
  });

  it('does not navigate when the weight input is touched', async () => {
    render(<PersonCard person={PERSON} entries={[]} unit="kg" onSave={jest.fn()} />);
    await flush();

    fireEvent.changeText(screen.getByLabelText('Weight input'), '72');
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('renders a small card variant without crashing', async () => {
    render(
      <PersonCard
        person={{ ...PERSON, cardDisplay: 'small' }}
        entries={[]}
        unit="kg"
        onSave={jest.fn()}
      />,
    );
    await flush();
    expect(screen.getByText('Ada')).toBeTruthy();
  });
});
