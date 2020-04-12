class CacheManager {
    constructor() {
        this.caches = new Discord.Collection();
    }

    new (name, model, keyField, expectsOne = true) {
        if (this.caches.has(name)) return;
        this.caches.set(name, new Cache(model, keyField, expectsOne));
    }

    set (model, record) {
        this.caches.forEach((cache) => {
            if (cache.model === model && typeof record[ cache.keyField ] !== 'undefined') {
                if (cache.expectsOne) {
                    cache.set(record[ cache.keyField ], record);
                } else {
                    var records = cache.get(record[ cache.keyField ]);
                    if (records && records.filter) {
                        records = records.filter((rec) => rec.id !== record.id);
                        records.push(record);
                        cache.set(record[ cache.keyField ], records);
                    }
                }
            }
        })
    }

    del (model, record) {
        this.caches.forEach((cache) => {
            if (cache.model === model && typeof record[ cache.keyField ] !== 'undefined') {
                if (cache.expectsOne) {
                    cache.del(record[ cache.keyField ]);
                } else {
                    var records = cache.get(record[ cache.keyField ]);
                    if (records && records.filter) {
                        records = records.filter((rec) => rec.id !== record.id);
                        cache.set(record[ cache.keyField ], records);
                    }
                }
            }
        });
    }

    get (name, key, filter = null) {
        if (this.caches.has(name)) {
            var cache = this.caches.get(name);
            var records = cache.get(key);
            if (records && records.filter && filter) {
                records = records.filter(filter);
            }
            return records;
        }
        return null;
    }
}

class Cache {

    constructor(model, keyField, expectsOne = true) {
        this.keyField = keyField;
        this.model = model;
        this.expectsOne = expectsOne;
        this.cache = new Discord.Collection();
        this.initialized = false;

        // Initialize data
        // TODO: Find a better way to handle this without having to load all data in immediately
        sails.models[ this.model ].find().then((results) => {
            if (expectsOne) {
                results.forEach((result) => {
                    this.cache.set(result[ this.keyField ], result);
                });
            } else {
                var records = {};
                results.forEach((result) => {
                    if (typeof records[ result[ this.keyField ] ] === 'undefined') {
                        records[ result[ this.keyField ] ] = [];
                    }
                    records[ result[ this.keyField ] ].push(result);
                });

                for (var key in records) {
                    if (Object.prototype.hasOwnProperty.call(records, key)) {
                        this.cache.set(key, records[ key ]);
                    }
                }
            }
            this.initialized = true;
        });
    }

    // Get something from cache, or the database if not in cache
    get (key) {
        if (this.cache.has(key)) {
            const value = this.cache.get(key);
            if (value) {
                return value;
            }
        }

        return this.expectsOne ? {} : [];
    }

    // NOTE: Deletes cache, not the actual records
    del (key) {
        this.cache.delete(key);
    }

    flush () {
        this.cache.clear();
    }

    // Sets cache
    set (key, value) {
        this.cache.set(key, value);
    }
}

module.exports = CacheManager;