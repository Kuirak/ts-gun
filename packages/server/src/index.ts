import { Deduplication } from '@ts-gun/deduplication';
import { HAM } from '@ts-gun/ham';
import { Data, Server } from 'ws';

// TODO: Check out Tapable (Webpack)
const wss = new Server({ port: 8080 });
const dedup = new Deduplication();
const root: Graph = {};

const ID_TAG = '#';
const META_TAG = '_';
const HAM_TAG = '>';

interface Wire {
  [ID_TAG]: string;
  put?: Record<string, WirePut> | null;
  get?: unknown | null;
}

type ValueTypes = number | string;
type Value = Record<string, ValueTypes>;

interface Ref {
  [ID_TAG]: string;
}

type WirePut = {
  [META_TAG]: { [ID_TAG]: string; [HAM_TAG]: Record<string, number> };
} & Record<string, Value | Ref>;

function parseGunData(data: Data): Wire | null {
  if (typeof data === 'string') {
    const msg = JSON.parse(data);
    if (msg[ID_TAG] == null) {
      return null;
    }
    return msg;
  }
  return null;
}

type Graph = Record<string, object>;

// ? naming, what means mix in HAM context ?
function mixHAM(change: Record<string, WirePut>, graph: Graph) {
  const machine = new Date().getTime();
  let diff = 0;
  Object.keys(change).forEach((soul) => {
    const node = change[soul];
    Object.keys(node).forEach((key) => {
      const val = node[key];
      if (META_TAG === key) {
        return;
      }
      // TODO: continue here and refactor this code
      const state = node[META_TAG][HAM_TAG][key];
      const was = (graph[soul] || {[META_TAG]: { [HAM_TAG]: {} } })[META_TAG][HAM_TAG][key] || -Infinity;
      const known = (graph[soul] || {})[key];
      const ham = HAM(machine, state, was, val, known);
      if (!ham.incoming) {
        if (ham.defer) {
          console.log('DEFER', key, val);
          // you'd need to implement this yourself.
        }
        return;
      }
      (diff || (diff = {}))[soul] = diff[soul] || { _: { '#': soul, '>': {} } };
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
    if (dedup.check(msg[ID_TAG])) {
      dedup.track(msg[ID_TAG]);
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
