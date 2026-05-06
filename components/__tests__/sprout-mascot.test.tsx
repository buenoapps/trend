import { render } from '@testing-library/react-native';

import { SproutMascot } from '../sprout-mascot';

describe('SproutMascot', () => {
  it('renders at default size', () => {
    expect(() => render(<SproutMascot />)).not.toThrow();
  });

  it('renders happy mood', () => {
    expect(() => render(<SproutMascot mood="happy" size={80} />)).not.toThrow();
  });
});
