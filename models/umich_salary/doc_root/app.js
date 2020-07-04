"use strict";

document.querySelector('[src="app.js"]').addEventListener('Entity', function ({ detail: Entity }) {


    class StatusBar extends Entity {

        constructor(name) {
            super(name);
            super.listen('message', this.message.bind(this));
            this.status = document.querySelector('body .status-bar .status ');
        }

        message(message) {
            this.status.innerHTML = message;
        }
    }


    class Search extends Entity {

        constructor(name) {
            super(name);
            super.listen('error', this.error.bind(this))
            super.listen('click', this.click.bind(this));
            this.button = document.querySelector('form button');
            this.button.addEventListener('click', this);
            this.inputs = document.querySelectorAll('form input');
            this.inputs.forEach((cur) => {

                cur.addEventListener('keyup', (event) => {
                    if (event.keyCode == 13) {
                        this.button.click();
                    }
                });
            });
            this.fnInput = document.querySelector('form input.first-name');
            this.lnInput = document.querySelector('form input.last-name');
            this.deptInput = document.querySelector('form input.department');
        }

        click() {

            super.notify('aggregator', 'search', this.fnInput.value, this.lnInput.value, this.deptInput.value);
        }

        error(message) {

            console.error(message);
        }
    }


    class Display extends Entity {

        constructor(name) {
            super(name);
            super.listen('message', this.message.bind(this));
            this.tbody = document.querySelector('body div.display table.search-results tbody')
        }

        makeTr(rep) {

            var tr = document.createElement('tr');

            var keys = Object.keys(rep);

            keys.forEach((key) => {

                var td = document.createElement('td');
                //td.setAttribute('data-' + key, rep[key]);
                //td.setAttribute('style', 'width:' + 1 / keys.length * 100 + '%;');
                td.innerHTML = rep[key];
                tr.appendChild(td);
            });

            return tr;
        }

        message(messages) {

            if (!Array.isArray(messages)) {
                messages = [messages];
            }

            this.tbody.innerHTML = '';

            messages.forEach((message) => {

                var tr = this.makeTr(message);

                this.tbody.appendChild(tr);
            });
        }
    }

    class Aggregator extends Entity {

        constructor(name) {
            super(name);
            super.listen('search', this.search.bind(this));
            this.xhrs = [];
            this.records = [];
        }

        publish(record) {

            record = JSON.parse(record);

            record = {
                department: record.department,
                first_name: record.first_name,
                last_name: record.last_name,
                ftr: record.ftr
            }

            this.records.push(record);

            this.records.sort((a, b) => {

                return (a.first_name.length - b.first_name.length) + (a.last_name.length - b.last_name.length);
            });

            super.notify('display', 'message', this.records);
        }

        abort() {

            this.xhrs.forEach((cur) => {

                cur.abort();
            });

            console.log('Aggregator aborted...')
        }

        async search(first_name, last_name, department) {

            first_name = first_name.trim();
            last_name = last_name.trim();
            department = department.trim();

            this.xhrs.forEach((cur) => {

                cur.abort();
            });

            this.records = [];

            this.xhrs = [];

            var promises = [this.xhRequest('./api')];

            while (promises.length) {

                var event = await promises.shift();

                var status = event.target.status;

                var response = event.target.response;

                var responseURL = event.target.responseURL;

                if (response === null) {

                    continue;
                }

                if (responseURL.match(
                    /campus\/[^\/]+\/year\/[^\/]+\/last_name\/[^\/]+\/first_name\/[^\/]+\/department\/[^\/]+\/[0-9]+$/
                    )) {

                    this.publish(response);

                    continue;
                }

                if (status == 403) {
                    //  This happens when the server finds too many records.
                    this.abort();

                    this.notify('display', 'message', { message: 'Your query is a little ambiguous.  Please refine your query.' });

                    return;
                }

                if (typeof response == 'object') {

                    var urls;

                    if (Array.isArray(response)) {

                        urls = response;
                    }
                    else {

                        urls = Object.values(response);
                    }

                    if (dept !== '') {
                        urls = urls.filter(url => url.match(/\/api\/appt_dept/));
                    }
                    else if (ln !== '') {
                        urls = urls.filter(url => url.match(/\/api\/last_name/));
                    }
                    else {
                        urls = urls.filter(url => url.match(/\/api\/first_name/));
                    }

                    urls = urls.filter(url => url.match(/\/api\/campus/));

                    for (var url of urls) {

                        if (url.match(/campus\?$/)) {

                            url = url + '';
                        }
                        else if (url.match(/year\?$/)) {

                            url = url + '';
                        }
                        else if (url.match(/department\?$/)) {

                            url = url + department;
                        }
                        else if (url.match(/last_name\?$/)) {

                            url = url + last_name;
                        }
                        else if (url.match(/first_name\?$/)) {

                            url = url + first_name;
                        }

                        promises.push(this.xhRequest(url));
                    }
                }
            }

            if (this.records.length === 0) {
                super.notify('display', 'message', { message: "Records weren't found for your query.  Please refine your query." })
            }
        }

        async xhRequest(resource) {

            return new Promise((r, j) => {
                var xhr = new XMLHttpRequest();

                this.xhrs.push(xhr);

                super.notify('status-bar', 'message', resource);

                xhr.open('GET', resource);
                xhr.responseType = 'json';
                xhr.setRequestHeader('Content-Type', '*/*');
                xhr.setRequestHeader('Accept', 'application/json');
                xhr.addEventListener('load', (event) => {
                    r(event);
                });
                xhr.addEventListener('error', (event) => {
                    console.log(event);
                });
                xhr.send();
            });
        }

        error(message) {

            console.error(message);
        }
    }


    window.addEventListener('load', () => {

        new Aggregator('aggregator');
        new Search('search');
        new Display('display');
        new StatusBar('status-bar');
    });
});