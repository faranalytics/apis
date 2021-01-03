"use strict";

(function () {

    var map = new Map()

    document.addEventListener('load', function (event) {

        if (event.target.tagName == 'SCRIPT') {

            event.target.dispatchEvent(new CustomEvent('Entity', {

                detail: (function () {

                    class Entity {

                        constructor(name) {

                            map.set(name, { name: name });
                            map.set(this, map.get(name));
                        }

                        listen(event, fn) {

                            var entity = map.get(this);

                            if (typeof entity[event] == 'undefined') {
                                entity[event] = [];
                            }

                            entity[event].push(fn);
                        }

                        notify(callee, event, ...args) {

                            var entity = map.get(callee);

                            if (typeof entity == 'undefined') {
                                if (typeof callee == 'string') {
                                    console.error('The Entity named ' + callee + ' is not present.');
                                }
                                else {
                                    console.error('The Entity is not present.');
                                }
                                return;
                            }

                            if (typeof entity[event] == 'undefined') {
                                if (typeof callee == 'string' && typeof event == 'string') {
                                    console.error('The Entity named ' + callee + ' is not listening for ' + event + '.');
                                }
                                else {
                                    console.error('The Entity is not listening for ' + event + '.');
                                }
                                return;
                            }

                            entity[event].forEach((fn) => fn(...args));
                        }

                        notifyAll(event, ...args) {

                        }

                        handleEvent(event) {

                            this.notify(this, event.type, event);
                        }
                    }
                    return Entity;
                }())
            }));
        }
    }, true);
}())

