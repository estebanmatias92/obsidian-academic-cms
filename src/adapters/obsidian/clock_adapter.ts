import { ClockPort } from '../../ports/clock_port';

export class ObsidianClockAdapter implements ClockPort {
  constructor(private moment: any) {}

  now(format = 'YYYY-MM-DD'): string {
    return this.moment().format(format);
  }
}