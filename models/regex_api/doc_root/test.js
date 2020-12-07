
window.addEventListener('load', function () {
    console.log('load');

    let render = document.querySelector('form.text-input .render');
    let textarea = document.querySelector('form.text-input textarea');

    textarea.addEventListener('input', handleInput);

    function handleInput(e) {
        // h.innerHTML = e.target.value.replace(/\n$/gi, '&NewLine;&NewLine;').replace(/\n/gi, '&NewLine;').replace(/ /gi, '&nbsp;')
        render.innerHTML = e.target.value.replace(/\n$/gi, '<br><br>').replace(/\n/gi, '<span><br></span>').replace(/ /gi, '<span> </span>')
        render.scrollTo(0, e.target.scrollTop);
    }

    textarea.addEventListener('scroll', function(e){
        console.log('scroll');
        console.log(e);
        render.scrollTo(0, e.target.scrollTop)
    });
});