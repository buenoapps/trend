import { act, fireEvent, render, screen } from '@testing-library/react-native';

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

  it('clears the input when the date prop changes', async () => {
    const onSave = jest.fn();
    const { rerender } = render(
      <WeightEntryForm date="2026-05-01" unit="kg" onSave={onSave} />,
    );
    const input = screen.getByLabelText('Weight input');
    fireEvent.changeText(input, '72.5');
    expect(input.props.value).toBe('72.5');

    rerender(<WeightEntryForm date="2026-05-02" unit="kg" onSave={onSave} />);
    expect(screen.getByLabelText('Weight input').props.value).toBe('');
  });
});
