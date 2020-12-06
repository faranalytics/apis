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

            this.inputElement = document.querySelector('form div.text-input');

            this.inputElement.addEventListener('input', this.input.bind(this));
        }

        input(e) {
            super.notify('stateful', 'state-change', { textInput: e.data });
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

            this.state = { ...this.state, ...message };

            if (Object.keys(this.state).every(x => ![undefined, ""].includes(this.state[x]))) {

                console.log(this.state);
                
                if (this.xhr) {
                    this.xhr.abort()
                }

                let r = await this.xhRequest('regex-api/' + this.state.lang, 
                {
                    textInput: this.state.textInput,
                    regexInput: this.state.regexInput
                });

                console.log(r);
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
                    r(e.currentTarget);
                });
                xhr.addEventListener('error', (e) => {
                    console.log(e);
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