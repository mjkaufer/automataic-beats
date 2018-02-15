var quack = new Wad({
    source: 'sawtooth',
    pitch: 'A4',
    env: {
        attack: 0.05,
        decay: 0.05,
        hold: 0,
        hold: 0.1
    }, filter  : {
        type      : 'highpass',
        frequency : 200,
        q         : 10,
        env       : {
            frequency : 5000,
            attack    : 0.4
        }
    }
});

var bass = new Wad({
    source: 'sawtooth',
    pitch: 'A3',
    env: {
        attack: 0.05,
        decay: 0.05,
        hold: 0.2
    }, filter  : {
        type      : 'lowpass',
        frequency : 500,
        q         : 10,
        env       : {
            frequency : 0,
            attack    : 0.2
        }
    }
});