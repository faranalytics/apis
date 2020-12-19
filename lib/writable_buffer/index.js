const { Writable, Readable, Duplex } = require('stream');

class WritableBuffer extends Writable {

    constructor(r, j, options = {}, encoding = 'utf8') {

        super({ ...options, ...{ decodeStrings: false, objectMode: false } });

        this.encoding = [];
        this.data = [];

        this.on('finish', () => {

            try {

                let data = this.data.reduce((acc, cur, idx, arr) => {

                    switch (this.encoding[idx]) {

                        case 'buffer':
                            return acc + cur.toString(encoding);
                        default:
                            return acc + cur;
                    }
                }, '');

                r(data);
            }
            catch (e) {

                delete this.encoding;
                delete this.data;
                j(e);
            }
        });

        this.on('error', (e) => {

            delete this.encoding;
            delete this.data;
            j(e);
        });
    }

    _write(chunk, encoding, callback) {
        // encoding is either buffer, object, or the intended encoding of the string.

        try {

            this.encoding.push(encoding);
            this.data.push(chunk);

            callback(null);
        }
        catch (e) {
            callback(e);
        }
    }
};

// (async function () {

//     try {

//         let result = await new Promise((r, j) => {

//             let readable = Readable.from('something');

//             readable.on('error', j).pipe(new WritableBuffer(r, j));

//         });

//         console.log(result);

//     }
//     catch (e) {

//         console.error(e)
//     }

// })();

exports.WritableBuffer = WritableBuffer;

