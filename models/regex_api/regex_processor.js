{ regexInput, textInput }

try {

    let regex = new RegExp(regexInput, 'g');

    let matches = [...textInput.matchAll(regex)].map(

        x => ({ match: x[0], index: x.index })
    );

    return matches;
}
catch {

}