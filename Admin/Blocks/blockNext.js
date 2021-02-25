(function (blocks, element) {
    const el = element.createElement;

    jQuery(document).ready(function () {
        const getBlockList = () => wp.data.select('core/editor').getBlocks();
        let blockList = getBlockList();
        wp.data.subscribe(() => {
            const newBlockList = getBlockList();
            const blockListChanged = newBlockList !== blockList;
            blockList = newBlockList;
            if (blockListChanged) {
                for (let i = 0; i < blockList.length; i++) {
                    if (blockList[i].name === 'tbkl/widget') {
                        setTimeout(
                            function () {
                                jQuery(document).trigger('TBK::LOAD');
                            }, 50
                        )
                    }
                }
            }
        });
    })

    const Fragment = wp.element.Fragment;

    const {
        InspectorControls,
    } = wp.blockEditor;
    const {
        CheckboxControl,
        DatePicker,
        PanelBody,
        PanelRow,
        TextControl,
        ToggleControl,
        HorizontalRule,
        SelectControl,
        RadioControl
    } = wp.components;

    const iconEl = el('svg', {width: 20, height: 20},
        [
            el('path', {
                d: "M 2.070312 9.664062 L 6.765625 9.121094 L 7.101562 12.09375 L 2.402344 12.636719 Z M 2.070312 9.664062"
            }),
            el('path', {
                d: "M 8.730469 13.40625 L 13.425781 12.863281 L 13.761719 15.835938 L 9.066406 16.378906 Z M 8.730469 13.40625"
            }),
            el('path', {
                d: "M 13.886719 3.789062 L 18.585938 3.25 L 18.921875 6.222656 L 14.222656 6.761719 Z M 13.886719 3.789062"
            }),
        ]
    );

    const tipIcon = el('svg', {width: 24, height: 24},
        el('path', {
            d: 'M 20.45 4.91 L 19.04 3.5 l -1.79 1.8 l 1.41 1.41 l 1.79 -1.8 Z M 13 4 h -2 V 1 h 2 v 3 Z m 10 9 h -3 v -2 h 3 v 2 Z m -12 6.95 v -3.96 l -1 -0.58 c -1.24 -0.72 -2 -2.04 -2 -3.46 c 0 -2.21 1.79 -4 4 -4 s 4 1.79 4 4 c 0 1.42 -0.77 2.74 -2 3.46 l -1 0.58 v 3.96 h -2 Z m -2 2 h 6 v -4.81 c 1.79 -1.04 3 -2.97 3 -5.19 c 0 -3.31 -2.69 -6 -6 -6 s -6 2.69 -6 6 c 0 2.22 1.21 4.15 3 5.19 v 4.81 Z M 4 13 H 1 v -2 h 3 v 2 Z m 2.76 -7.71 l -1.79 -1.8 L 3.56 4.9 l 1.8 1.79 l 1.4 -1.4 Z'
        })
        )
    ;

    let blockTypeAttributes = {
        restrictServices: {
            type    : 'array',
            selector: 'tbk-attr-restrictservices',
            default : []
        }
    };

    blockTypeAttributes = {...blockTypeAttributes};

    const blockTypeParams = {
        title      : 'TheBooking widget',
        description: 'Displays the booking widget',
        icon       : iconEl,
        category   : 'tbkl-bookings',
        keywords   : [
            'booking',
            'thebooking',
            'teambooking',
            'calendar',
            'reservations'
        ],
        supports   : {
            html    : false,
            reusable: false,
        },
        attributes : blockTypeAttributes,

        edit: function (props) {
            let restrictServices = props.attributes.restrictServices;

            let optionsServices = [];

            for (const [id, service] of Object.entries(tbkCommon.services)) {
                optionsServices.push(el(CheckboxControl, {
                    label   : service.name,
                    checked : restrictServices.includes(id),
                    onChange: newValue => {
                        const index = restrictServices.indexOf(id);
                        const newArr = restrictServices.slice();
                        if (newValue) {
                            newArr.push(id);
                            props.setAttributes({restrictServices: newArr});
                        } else {
                            newArr.splice(index, 1);
                            props.setAttributes({restrictServices: newArr});
                        }
                    }
                }))
            }

            let restrictionsTabServices = el(PanelBody, {title: 'Restrict services', initialOpen: false},
                el('div', {className: 'tbk-row-noflex'}, [
                    el(PanelRow, {},
                        el('div', {className: 'components-tip'}, [tipIcon, el('p', {},
                            "If you don't intend to restrict, do not select any checkbox!"
                        )])
                    ),
                    el(HorizontalRule, {}),
                    optionsServices
                ])
            );

            const customElements = [];

            tbkData.bookingWidget.customElements.forEach(function (item) {

                if (item.type !== 'independent_options') {
                    return;
                }

                let options = [];

                for (let i = 0, len = tbkData[item.loopingRef].length; i < len; i++) {
                    let srv = tbkData[item.loopingRef][i].id;
                    options.push(el(CheckboxControl, {
                            label   : tbkData[item.loopingRef][i][item.loopingLabelProp],
                            checked : props.attributes[item.refAttribute].indexOf(srv) !== -1,
                            onChange: newValue => {
                                const index = props.attributes[item.refAttribute].indexOf(srv);
                                const newArr = props.attributes[item.refAttribute].slice();
                                const obj = {};
                                if (newValue) {
                                    newArr.push(srv);
                                    obj[item.refAttribute] = newArr;
                                    props.setAttributes(obj);
                                } else {
                                    newArr.splice(index, 1);
                                    obj[item.refAttribute] = newArr;
                                    props.setAttributes(obj);
                                }
                            }
                        })
                    )
                }

                customElements.push(
                    el(
                        PanelBody,
                        {
                            title      : item.title,
                            initialOpen: item.initialOpen
                        },
                        el('div', {className: 'tbk-row-noflex'}, [
                            el(PanelRow, {},
                                el('div', {className: 'components-tip'}, [tipIcon, el('p', {}, item.tipText)])
                            ),
                            el(HorizontalRule, {}),
                            options
                        ])
                    )
                );
            });

            let content = '';

            const UUID = 'tbkxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            })

            if (typeof TBK.UI.instances === 'undefined') {
                TBK.UI.instances = {};
            }
            TBK.UI.instances[UUID] = {
                availability          : TBK_RESOURCES.availability,
                services              : _.pick(TBK_RESOURCES.services, (value, key, object) => {
                    if (props.attributes.restrictServices.length < 1) return true;
                    return props.attributes.restrictServices.includes(key);
                }),
                reservations          : TBK_RESOURCES.reservations,
                groupSlots            : true,
                monthlyViewAverageDots: 5,
                monthlyViewShowAllDots: false
            }


            return (el(
                Fragment, {},
                el(
                    InspectorControls, {},
                    restrictionsTabServices,
                    ...customElements,
                ),
                el(
                    'div',
                    {className: 'tbkBooking', id: UUID},
                    content
                )
            ));
        }
    };

    blocks.registerBlockType('tbkl/widget', blockTypeParams);
}(
    window.wp.blocks,
    window.wp.element
));