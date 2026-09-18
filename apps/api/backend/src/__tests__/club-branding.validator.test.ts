import { describe, expect, it } from 'vitest';
import { validateCreateClubInput } from '../validators/club.validator';

describe('club branding input', () => {
  it('leaves unspecified colours empty so logo analysis can provide them', () => {
    const result = validateCreateClubInput({ name: 'Lions', city: 'Lomé', logoUrl: 'data:image/png;base64,abc' });

    expect(result.valid).toBe(true);
    expect(result.data?.primaryColor).toBeUndefined();
    expect(result.data?.secondaryColor).toBeUndefined();
    expect(result.data?.accentColor).toBeUndefined();
  });

  it('preserves a manually chosen colour over analysed colours', () => {
    const result = validateCreateClubInput({ name: 'Lions', city: 'Lomé', primaryColor: '#123456' });

    expect(result.data?.primaryColor).toBe('#123456');
  });
});
