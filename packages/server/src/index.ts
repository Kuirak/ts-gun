import { Deduplication } from '@ts-gun/deduplication';
import { ConvergeIncoming, Defer, HAM } from '@ts-gun/ham';
import { Data, Server } from 'ws';

// TODO: Check out Tapable (Webpack)
const wss = new Server({ port: 8080 });
const dedup = new Deduplication();
const root: Graph = {};

const SOUL_TAG: '#' = '#';
const META_TAG: '_' = '_';
const HAM_TAG: '>' = '>';
type Soul = string;

interface Wire {
  [SOUL_TAG]: Soul;
  put?: Record<Soul, Node> | null;
  get?: unknown | null;
}

type ValueTypes = string | number | boolean | undefined;
type Value = Record<string, ValueTypes>;

interface Ref {
  [SOUL_TAG]: Soul;
}

type Node = {
  [META_TAG]: { [SOUL_TAG]: Soul; [HAM_TAG]: Record<string, number> };
} & GunData;

type GunData = Record<string, Value | Ref>;

function parseGunData(data: Data): Wire | null {
  if (typeof data === 'string') {
    const msg = JSON.parse(data);
    if (msg[SOUL_TAG] == null) {
      return null;
    }
    return msg;
  }
  return null;
}

type Graph = Record<string, Node>;



// ? naming, what means mix in HAM context ?
function mixHAM(change: Record<string, Node>, graph: Graph) {
  const machine = new Date().getTime();
  let diff = 0;
  Object.keys(change).forEach((soul: Soul) => {
    const node = change[soul];
    Object.keys(node).forEach((key: typeof META_TAG | string) => {
      if (META_TAG === key) {
        return;
      }
      const val = node[key];
      // TODO: continue here and refactor this code
      const state = node[META_TAG][HAM_TAG][key];
      const was = (graph[soul] || { [META_TAG]: { [HAM_TAG]: {} } })[META_TAG][HAM_TAG][key] || -Infinity;
      const known = (graph[soul] || {})[key];

      const ham = HAM(machine, state, was, val, known);
      if (!(ham as ConvergeIncoming).incoming) {
        if ((ham as Defer).defer) {
          // tslint:disable-next-line:no-console
          console.log('DEFER', key, val);
          // you'd need to implement this yourself.
        }
        return;
      }
      (diff || (diff = {}))[soul] = diff[soul] || { [META_TAG]: { [SOUL_TAG]: soul, [HAM_TAG]: {} } };
      graph[soul] = graph[soul] || { _: { '#': soul, '>': {} } };
      graph[soul][key] = diff[soul][key] = val;
      graph[soul]._['>'][key] = diff[soul]._['>'][key] = state;
    });
  });
  return diff;
}

wss.on('listening', () => {
  // tslint:disable-next-line:no-console
  console.log('Websockt server running');
});

wss.on('connection', (peer) => {
  peer.on('message', (data) => {
    // TODO: Raw Hook
    if (typeof data !== 'string') {
      return;
    }
    // TODO: Parse Hook
    const msg = parseGunData(data);
    if (msg === null) {
      // tslint:disable-next-line:no-console
      console.log('GUN-ID "#" missing. Not redistributing or tracking the data.');
      return;
    }
    // tslint:disable-next-line:no-console
    console.log('Received valid GunData:');
    // tslint:disable-next-line:no-console
    console.dir(msg, { depth: 10 });
    if (dedup.check(msg[SOUL_TAG])) {
      dedup.track(msg[SOUL_TAG]);
      return;
    }
    if (typeof msg.put === 'object' && msg.put != null) {
      mixHAM(msg.put, root);
    }
    // TODO: Validate Hook

    wss.clients.forEach((otherPeer) => {
      if (otherPeer !== peer && otherPeer.readyState === otherPeer.OPEN) {
        otherPeer.send(data);
      }
    });
  });
});

// TODO: external API should be a createGunServer(options: GunServerOptions) which returns a wss instance to be attached to other server parts
