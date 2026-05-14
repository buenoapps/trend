import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { PersonForm } from '../person-form';

const flush = () => act(async () => {});

describe('PersonForm', () => {
  it('shows the goal picker only for adults', () => {
    render(<PersonForm submitLabel="Save" onSubmit={jest.fn()} />);
    // Default kind is adult — the goal options are visible.
    expect(screen.queryByText('No goal, just tracking')).toBeTruthy();

    fireEvent.press(screen.getByText('Kid'));
    expect(screen.queryByText('No goal, just tracking')).toBeNull();
  });

  it('forces goal=none when saving a kid', async () => {
    const onSubmit = jest.fn();
    render(<PersonForm submitLabel="Save" onSubmit={onSubmit} initial={{ goal: 'lose' }} />);

    fireEvent.press(screen.getByText('Kid'));
    fireEvent.changeText(screen.getByLabelText('Name'), 'Robin');
    fireEvent.press(screen.getByText('Save'));
    await flush();

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Robin', kind: 'kid', goal: 'none' }),
    );
  });

  it('requires a non-empty name', async () => {
    const onSubmit = jest.fn();
    render(<PersonForm submitLabel="Save" onSubmit={onSubmit} />);

    fireEvent.press(screen.getByText('Save'));
    await flush();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Please enter a name')).toBeTruthy();
  });
});
