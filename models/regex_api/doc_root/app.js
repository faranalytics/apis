"use strict";

document.querySelector('[src="app.js"]').addEventListener('Entity', function ({ detail: Entity }) {


    class RegexInput extends Entity {

        constructor(name) {
            super(name);

            this.inputElement = document.querySelector('form.regex-input');

            this.inputElement.addEventListener('input', this.input.bind(this));
        }

        input(e) {

            super.notify('stateful', 'state-change', { regexInput: e.target.value });
        }
    }




    class TextInput extends Entity {

        constructor(name) {
            super(name);

            //this.hElement = document.querySelector('form div.text-input-highlight');
            this.inputElement = document.querySelector('form div.text-input');

            this.inputElement.addEventListener('input', this.input.bind(this));

            super.listen('match', this.match.bind(this));
        }

        input(e) {

            //  Strip HTML.
            console.log(this.inputElement.innerHTML)
            let test = this.inputElement.innerHTML.replace(/<br\s*>/gi, '\n').replace(/<[^>]+>/gi, '')
            console.log(test);
            //super.notify('stateful', 'state-change', { textInput: this.inputElement.innerText});
        }

        match(results) {
            //  results must be an Array that contains index-match objects.

            let indices = results.reduce((acc, cur) => {

                let index = parseInt(cur['index']);

                if (index !== null) {

                    acc.push(index);
                    acc.push(index + cur['match'].length);
                }

                return acc;

            }, [])

            indices[0] === 0 ? null : indices.unshift(0);

            indices[indices.length - 1] === this.inputElement.innerText.length ? null : indices.push(this.inputElement.innerText.length);

            let matches = results.map(x => x['match']);

            let slices = indices.reduce((acc, cur, idx, arr) => {

                if (idx !== indices.length - 1) {

                    acc.push(this.inputElement.innerText.slice(cur, arr[idx + 1]))
                }

                return acc;
            }, []);

            slices = slices.map(x => {

                if (matches.includes(x)) {
                    return '<span style="background-color:blue">' + x + '</span>'
                }
                else {
                    return x;
                }
            })
            
            // let render = slices.join('')
            // console.log('render1: ', render);
            // render = render.replace(/\n$/, '').replace(/\n/g, '<br>');
            // console.log('render2: ', render);
            // this.hElement.innerHTML = render;

            //this.inputElement.innerHTML = render;
        }
    }




    class Flavor extends Entity {

        constructor(name) {
            super(name);

            this.check = document.createElement('span');

            this.check.innerHTML = '✓'

            this.lis = document.querySelectorAll('ul.flavor li');

            if (this.lis.length > 0) {

                this.lis.forEach((x) => x.addEventListener('click', this.click.bind(this)))

                this.selected = this.lis[0];

                this.selected.appendChild(this.check);

                super.notify('stateful', 'state-change', { lang: this.selected.dataset.lang });
            }
        }

        click(e) {

            super.notify('stateful', 'state-change', { lang: e.target.dataset.lang });

            if (typeof this.selected !== 'undefined') {
                this.selected.removeChild(this.check);
            }

            this.selected = e.target;
            this.selected.appendChild(this.check);
        }
    }




    class Stateful extends Entity {
        constructor(name) {
            super(name)

            this.xhRequest.bind(this);
            super.listen('state-change', this.stateChange.bind(this));

            this.state = { regexInput: undefined, textInput: undefined, lang: undefined }

            this.xhr;
        }

        async stateChange(message = {}) {

            try {

                this.state = { ...this.state, ...message };

                if (Object.keys(this.state).every(x => ![undefined, ""].includes(this.state[x]))) {

                    if (this.xhr) {
                        this.xhr.abort()
                    }

                    let request = {
                        textInput: this.state.textInput,
                        regexInput: this.state.regexInput
                    }

                    // console.log('request: ', request);

                    let response = await this.xhRequest('regex-api/' + this.state.lang, request);

                    // console.log('response: ', response);

                    super.notify('text-input', 'match', JSON.parse(response));
                }
            }
            catch (e) {
                console.error(e);
            }
        }

        async xhRequest(url, object) {

            return new Promise((r, j) => {

                var xhr = new XMLHttpRequest();

                this.xhr = xhr;

                xhr.open('POST', url);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.setRequestHeader('Accept', 'application/json');
                xhr.addEventListener('load', (e) => {

                    if (e.currentTarget.status === 200) {

                        r(e.currentTarget.response);
                    }
                    else {
                        j(e);
                    }
                });
                xhr.addEventListener('error', (e) => {
                    j(e);
                });
                xhr.send(JSON.stringify(object));
            });
        }
    }




    window.addEventListener('load', () => {
        new Stateful('stateful');
        new Flavor('flavor');
        new RegexInput('regex-input');
        new TextInput('text-input');
    });
});