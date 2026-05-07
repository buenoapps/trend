import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { todayKey } from '@/lib/dates';

import { WeightEntryForm } from '../weight-entry-form';

const flush = () => act(async () => {});

describe('WeightEntryForm', () => {
  it('saves a kg input as kg for the given date', async () => {
    const onSave = jest.fn();
    render(<WeightEntryForm date="2026-05-01" unit="kg" onSave={onSave} />);
    fireEvent.changeText(screen.getByLabelText('Weight input'), '72.5');
    fireEvent.press(screen.getByLabelText("Save today's weight"));
    await flush();
    expect(onSave).toHaveBeenCalledWith({ date: '2026-05-01', kg: 72.5 });
  });

  it('converts lb input to kg before saving', async () => {
    const onSave = jest.fn();
    render(<WeightEntryForm date="2026-05-02" unit="lb" onSave={onSave} />);
    fireEvent.changeText(screen.getByLabelText('Weight input'), '165');
    fireEvent.press(screen.getByLabelText("Save today's weight"));
    await flush();
    expect(onSave).toHaveBeenCalledTimes(1);
    const arg = onSave.mock.calls[0][0];
    expect(arg.date).toBe('2026-05-02');
    expect(arg.kg).toBeCloseTo(74.84, 1);
  });

  it('shows an error and does not save on bad input', async () => {
    const onSave = jest.fn();
    render(<WeightEntryForm date="2026-05-01" unit="kg" onSave={onSave} />);
    fireEvent.changeText(screen.getByLabelText('Weight input'), 'abc');
    fireEvent.press(screen.getByLabelText("Save today's weight"));
    await flush();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("That doesn't look like a number")).toBeTruthy();
  });

  it('prefills the input from initialKg and refreshes when the date changes', async () => {
    const onSave = jest.fn();
    const { rerender } = render(
      <WeightEntryForm date="2026-05-01" unit="kg" initialKg={72.5} onSave={onSave} />,
    );
    expect(screen.getByLabelText('Weight input').props.value).toBe('72.5');

    rerender(<WeightEntryForm date="2026-05-02" unit="kg" initialKg={70} onSave={onSave} />);
    expect(screen.getByLabelText('Weight input').props.value).toBe('70.0');

    rerender(<WeightEntryForm date="2026-05-03" unit="kg" onSave={onSave} />);
    expect(screen.getByLabelText('Weight input').props.value).toBe('');
  });

  it('uses a today-specific placeholder only when the date is today', async () => {
    const onSave = jest.fn();
    const { rerender } = render(
      <WeightEntryForm date={todayKey()} unit="kg" initialKg={72} onSave={onSave} />,
    );
    expect(screen.getByLabelText('Weight input').props.placeholder).toBe('Today: tap to update');

    rerender(<WeightEntryForm date="2020-01-01" unit="kg" initialKg={72} onSave={onSave} />);
    expect(screen.getByLabelText('Weight input').props.placeholder).toBe('Tap to update');

    rerender(<WeightEntryForm date="2020-01-02" unit="kg" onSave={onSave} />);
    expect(screen.getByLabelText('Weight input').props.placeholder).toBe('Your weight');
  });
});
