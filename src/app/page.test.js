import { describe, it, expect } from 'vitest';
import { formatStopwatchTime } from '../lib/time';

describe('formatStopwatchTime', () => {
  it('formats milliseconds correctly for hour and sub-second precision', () => {
    const result = formatStopwatchTime(3723450, true);
    expect(result).toEqual({
      h: '01',
      m: '02',
      s: '03',
      cs: '45',
    });
  });

  it('hides hours when zero and showHours is false', () => {
    const result = formatStopwatchTime(65000, false);
    expect(result).toEqual({
      h: null,
      m: '01',
      s: '05',
      cs: '00',
    });
  });
});
