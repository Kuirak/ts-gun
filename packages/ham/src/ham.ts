const Lexical = JSON.stringify;

interface Defer { defer: true }
interface Historical { historical: true }
interface ConvergeIncoming { converge: true; incoming: true }
interface ConvergeCurrent { converge: true; current: true }
interface State { state: true }
interface InvalidCRDT { err: string }

type Value = string | number | boolean | undefined;
type MachineState = number;

/* Based on the Hypothetical Amnesia Machine thought experiment */
function HAM(
  machineState: MachineState,
  incomingState: MachineState,
  currentState: MachineState,
  incomingValue: Value,
  currentValue: Value
): Defer | Historical | ConvergeIncoming | State | ConvergeCurrent | InvalidCRDT {
  if (machineState < incomingState) {
    return { defer: true }; // the incoming value is outside the boundary of the machine's state, it must be reprocessed in another state.
  }
  if (incomingState < currentState) {
    return { historical: true }; // the incoming value is within the boundary of the machine's state, but not within the range.
  }
  if (currentState < incomingState) {
    return { converge: true, incoming: true }; // the incoming value is within both the boundary and the range of the machine's state.
  }
  if (incomingState === currentState) {
    const incoming = Lexical(incomingValue) || '';
    const current = Lexical(currentValue) || '';
    if (incoming === current) {
      // Note: while these are practically the same, the deltas could be technically different
      return { state: true };
    }
    /*
			The following is a naive implementation, but will always work.
			Never change it unless you have specific needs that absolutely require it.
			If changed, your data will diverge unless you guarantee every peer's algorithm has also been changed to be the same.
			As a result, it is highly discouraged to modify despite the fact that it is naive,
			because convergence (data integrity) is generally more important.
			Any difference in this algorithm must be given a new and different name.
		*/
    if (incoming < current) {
      // Lexical only works on simple value types!
      return { converge: true, current: true };
    }
    if (current < incoming) {
      // Lexical only works on simple value types!
      return { converge: true, incoming: true };
    }
  }
  return {
    err: `Invalid CRDT Data: ${incomingValue} to ${currentValue} at ${incomingState} to ${currentState} !`,
  };
}

export { HAM };
