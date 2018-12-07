interface DeduplicationOptions {
  max?: number
  age?: number
}

type GunID = string;

const stack = Symbol("ts-gun Deduplication Cache")

export class Deduplication {
  [stack]: Record<GunID,Date> // TODO: ExpiringCacheImplementation
  options: DeduplicationOptions;

  constructor(options: DeduplicationOptions = {}) {
    this.options = {max: options.max ||1000 , age: options.age || 9*1000};
    this[stack] = {};
  }

  check(id: GunID): boolean {
    return this[stack][id] != null;
  }

  track(id: GunID): GunID {
      this[stack][id] = new Date()

      return id
  }
}

