import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { todayKey } from '@/lib/dates';
import { WeightEntryForm } from '../weight-entry-form';

const flush = () => act(async () => {});

describe('WeightEntryForm', () => {
  it('saves a kg input as kg', async () => {
    const onSave = jest.fn();
    render(<WeightEntryForm unit="kg" onSave={onSave} />);
    fireEvent.changeText(screen.getByLabelText('Weight input'), '72.5');
    fireEvent.press(screen.getByLabelText("Save today's weight"));
    await flush();
    expect(onSave).toHaveBeenCalledWith({ date: todayKey(), kg: 72.5 });
  });

  it('converts lb input to kg before saving', async () => {
    const onSave = jest.fn();
    render(<WeightEntryForm unit="lb" onSave={onSave} />);
    fireEvent.changeText(screen.getByLabelText('Weight input'), '165');
    fireEvent.press(screen.getByLabelText("Save today's weight"));
    await flush();
    expect(onSave).toHaveBeenCalledTimes(1);
    const arg = onSave.mock.calls[0][0];
    expect(arg.date).toBe(todayKey());
    expect(arg.kg).toBeCloseTo(74.84, 1);
  });

  it('shows an error and does not save on bad input', async () => {
    const onSave = jest.fn();
    render(<WeightEntryForm unit="kg" onSave={onSave} />);
    fireEvent.changeText(screen.getByLabelText('Weight input'), 'abc');
    fireEvent.press(screen.getByLabelText("Save today's weight"));
    await flush();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText("That doesn't look like a number")).toBeTruthy();
  });
});
