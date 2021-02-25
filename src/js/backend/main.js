import App from "./jsx/App";

const tbk = document.getElementById('tbkl');

jQuery(document).ready(function ($) {
    wp.element.render(wp.element.createElement(App), tbk);
})