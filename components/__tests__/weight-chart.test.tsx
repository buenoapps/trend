import { render } from '@testing-library/react-native';

import { WeightChart } from '../weight-chart';

describe('WeightChart', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders single-entry card', () => {
    expect(() =>
      render(<WeightChart entries={[{ date: '2026-05-01', kg: 72 }]} unit="kg" width={320} />)
    ).not.toThrow();
  });

  it('renders multi-entry curve', () => {
    expect(() =>
      render(
        <WeightChart
          entries={[
            { date: '2026-05-01', kg: 72.5 },
            { date: '2026-05-02', kg: 72.0 },
            { date: '2026-05-03', kg: 71.8 },
            { date: '2026-05-04', kg: 71.5 },
          ]}
          unit="kg"
          width={320}
        />
      )
    ).not.toThrow();
  });

  it('renders flat line (all values equal)', () => {
    expect(() =>
      render(
        <WeightChart
          entries={[
            { date: '2026-05-01', kg: 75 },
            { date: '2026-05-02', kg: 75 },
            { date: '2026-05-03', kg: 75 },
          ]}
          unit="kg"
          width={320}
        />
      )
    ).not.toThrow();
  });
});
