'use strict';

exports.present = (payload, from) => {

    if (Array.isArray(payload)) {
        return payload.map((p) => this.present(p));
    }

    const pick = (collect, key) => Object.assign(collect, { [key]: payload[key] });

    return from.reduce(pick, {});
};
