import App from "./jsx/App";

const loadInstances = (DOM, DATAOBJECT) => {
    const tbkBooking = DOM.getElementsByClassName('tbkBooking');
    for (let instance of tbkBooking) {
        DATAOBJECT.UI.instances[instance.id].doc = DOM;
        DATAOBJECT.UI.instances[instance.id].instanceId = instance.id;
        wp.element.render(wp.element.createElement(App, DATAOBJECT.UI.instances[instance.id]), instance);
    }
}

jQuery(document).ready(function ($) {
    loadInstances(document, TBK);
})
jQuery(document).on('TBK::LOAD', {DOM: document, DATAOBJECT: TBK}, function (e, DOM, TBK_OVERRIDE) {
    if (TBK_OVERRIDE) {
        // Ensures compatibility with Elementor iframe
        window['TBK'] = TBK_OVERRIDE;
    }
    loadInstances(DOM || e.data.DOM, TBK_OVERRIDE || e.data.DATAOBJECT)
});