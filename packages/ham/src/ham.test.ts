import { HAM } from './ham';

describe('Hypothetical Amnesia Machine - HAM', () => {
  it('should defer future "incoming" state', () => {
    const machine = 0;
    const incoming = 1;
    const current = 0;
    expect(HAM(machine, incoming, current, 'a', 'b')).toEqual({ defer: true });
  });

  it('should discard older "incoming" state', () => {
    const machine = 1;
    const incoming = 1;
    const current = 2;
    expect(HAM(machine, incoming, current, 'a', 'b')).toEqual({ historical: true });
  });

  it('should accept "incoming" when newer than "current"', () => {
    const machine = 2;
    const incoming = 2;
    const current = 1;
    expect(HAM(machine, incoming, current, 'a', 'b')).toEqual({ converge: true, incoming: true });
  });

  it('should do nothing when the value is the same', () => {
    const state = 2;
    expect(HAM(state, state, state, 'a', 'a')).toEqual({ state: true });
  });

  it('should accept "incoming" when it is lexically bigger', () => {
    const state = 2;
    expect(HAM(state, state, state, 'b', 'a')).toEqual({ converge: true, incoming: true });
  });

  it('should accept "current" when it is lexically bigger', () => {
    const state = 2;
    expect(HAM(state, state, state, 'a', 'b')).toEqual({ converge: true, current: true });
  });

  it('should accept numbers', () => {
    const state = 2;
    expect(HAM(state, state, state, 1900023, 123232)).toEqual({ converge: true, incoming: true });
  });

  it('should accept booleans', () => {
    const state = 2;
    expect(HAM(state, state, state, true, false)).toEqual({ converge: true, incoming: true });
  });

  it('should accept "current" when nothing is "incoming"', () => {
    const state = 2;
    expect(HAM(state, state, state, undefined, 'b')).toEqual({ converge: true, current: true });
  });

  it('should accept "incoming" when nothing is "current"', () => {
    const state = 2;
    expect(HAM(state, state, state, 'a', undefined)).toEqual({ converge: true, incoming: true });
  });

  // Due to JSON compatibility null will be interpreted as a value
  it.skip('should accept "incoming" when null is "current"', () => {
    const state = 2;
    expect(HAM(state, state, state, 'a', null as any)).toEqual({ converge: true, current: true });
  });
});
