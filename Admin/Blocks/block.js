(function (blocks, element) {
    const el = element.createElement;

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

    const blockStyle = {
        backgroundColor: '#e0e0e0',
        borderRadius   : '4px',
        padding        : '10px',
        textAlign      : 'center',
        minHeight      : '250px',
        fontFamily     : '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif'
    };

    const subHeaderStyle = {
        textAlign    : 'center',
        fontFamily   : 'inherit',
        textTransform: 'uppercase',
        fontSize     : '10px',
        fontWeight   : 700,
        lineHeight   : 1,
    };

    const selectorsStyle = {
        width    : '100%',
        display  : 'flex',
        marginTop: '10px'
    };

    const selectorPlaceholderStyle = {
        width       : '33%',
        height      : '28px',
        background  : 'white',
        margin      : '0 10px',
        borderRadius: '4px'
    };

    const monthlyPlaceholderStyle = {
        width       : 'calc(100% - 20px)',
        height      : '200px',
        background  : 'white',
        borderRadius: '4px',
        margin      : '10px'
    };

    const weeklyPlaceholderStyle = {
        width       : 'calc(100% / 7 - 20px)',
        height      : '200px',
        background  : 'white',
        borderRadius: '4px',
        margin      : '10px 10px 0',
        display     : 'inline-block'
    };

    const dailyPlaceholderStyle = {
        width       : 'calc(100% - 20px)',
        height      : '200px',
        background  : 'white',
        borderRadius: '4px',
        margin      : '10px'
    };

    const upcomingPlaceholderStyle = {
        display: 'flex',
        padding: '10px'
    };

    const upcomingPlaceholderCalStyle = {
        display     : 'inline-block',
        width       : '80px',
        height      : '90px',
        background  : 'white',
        borderRadius: '4px',
        marginRight : '10px'
    };

    const upcomingPlaceholderEvStyle = {
        display     : 'inline-block',
        width       : 'calc(100% - 90px)',
        height      : '140px',
        background  : 'white',
        borderRadius: '4px',
    };

    let blockTypeAttributes = {
        readOnly              : {
            type    : 'boolean',
            selector: 'tbk-attr-readonly',
            default : false,
        },
        loggedOnly            : {
            type    : 'boolean',
            selector: 'tbk-attr-loggedonly',
            default : false,
        },
        showMore              : {
            type    : 'boolean',
            selector: 'tbk-attr-showmore',
            default : false,
        },
        showSelectors         : {
            type    : 'boolean',
            selector: 'tbk-attr-showselectors',
            default : true,
        },
        showFilterService     : {
            type    : 'boolean',
            selector: 'tbk-attr-showfilterservice',
            default : true,
        },
        showFilterServiceClass: {
            type    : 'boolean',
            selector: 'tbk-attr-showfilterserviceclass',
            default : true,
        },
        showSelectorTimezone  : {
            type    : 'boolean',
            selector: 'tbk-attr-showselectortimezone',
            default : true,
        },
        defaultDateActive     : {
            type    : 'boolean',
            selector: 'tbk-attr-defaultdateactive',
            default : false,
        },
        defaultDate           : {
            type    : 'string',
            selector: 'tbk-attr-defaultdate',
            default : null,
        },
        upcomingEvents        : {
            type    : 'integer',
            selector: 'tbk-attr-upcomingevents',
            default : 5,
        },
        upcomingLimit         : {
            type    : 'integer',
            selector: 'tbk-attr-upcominglimit',
            default : 0,
        },
        view                  : {
            type    : 'string',
            selector: 'tbk-attr-viewmode',
            default : 'monthly',
        },
        workflow              : {
            type    : 'string',
            selector: 'tbk-attr-workflow',
            default : 'date_first',
        },
        restrictServices      : {
            type    : 'array',
            selector: 'tbk-attr-restrictservices',
            default : []
        },
        restrictServiceClasses: {
            type    : 'array',
            selector: 'tbk-attr-restrictserviceclasses',
            default : []
        }
    };

    blockTypeAttributes = {...blockTypeAttributes, ...tbkData.bookingWidget.customAttributes};

    const blockTypeParams = {
        title      : 'TheBooking widget',
        description: 'Displays the booking widget',
        icon       : iconEl,
        category   : 'tbkl-bookings',
        keywords   : [
            'booking',
            'thebooking',
            'teambooking',
            'calendar'
        ],
        supports   : {
            html    : false,
            reusable: false,
        },
        attributes : blockTypeAttributes,

        edit       : function (props) {

            let readOnly = props.attributes.readOnly;
            let loggedOnly = props.attributes.loggedOnly;
            let showMore = props.attributes.showMore;
            let upcomingEvents = props.attributes.upcomingEvents;
            let upcomingLimit = props.attributes.upcomingLimit;
            let defaultDateActive = props.attributes.defaultDateActive;
            let defaultDate = props.attributes.defaultDate;
            let restrictServices = props.attributes.restrictServices;
            let restrictServiceClasses = props.attributes.restrictServiceClasses;
            let view = props.attributes.view;
            let workflow = props.attributes.workflow;
            let showSelectors = props.attributes.showSelectors;
            let showFilterService = props.attributes.showFilterService;
            let showFilterServiceClass = props.attributes.showFilterServiceClass;
            let showSelectorTimezone = props.attributes.showSelectorTimezone;

            let elements = [];
            let subHeaders = [];
            let subHeader = el('div', {style: subHeaderStyle}, subHeaders);
            let content = [el('div', {class: 'tbk-placeholder-title'}, ['TheBooking widget', subHeader]), elements];

            if (readOnly) {
                subHeaders.push(el('span', {
                    style: {
                        color: 'indianred'
                    }
                }, 'read-only'));
                subHeaders.push(el('span', {}, ' | '))
            }
            if (loggedOnly && !readOnly) {
                subHeaders.push(el('span', {
                    style: {
                        color: 'indianred'
                    }
                }, 'logged-only'));
                subHeaders.push(el('span', {}, ' | '))
            }
            if (restrictServices.length) {
                subHeaders.push(el('span', {
                    style: {
                        color: '#607d8b'
                    }
                }, 'restricted services'));
                subHeaders.push(el('span', {}, ' | '))
            }

            if (restrictServiceClasses.length) {
                subHeaders.push(el('span', {
                    style: {
                        color: '#607d8b'
                    }
                }, 'restricted classes'));
                subHeaders.push(el('span', {}, ' | '))
            }

            tbkData.bookingWidget.subHeaderDynamics.forEach(function (entry) {
                if (props.attributes[entry.refAttribute] && props.attributes[entry.refAttribute].length) {
                    subHeaders.push(el(entry.element.tag, {
                        style: entry.element.style
                    }, entry.element.text));
                    subHeaders.push(el('span', {}, ' | '))
                }
            });

            subHeaders.pop();

            if (showSelectors) {
                const selectorsPlaceholders = [
                    el('div', {style: selectorPlaceholderStyle}),
                    el('div', {style: selectorPlaceholderStyle}),
                    el('div', {style: selectorPlaceholderStyle})
                ];
                elements.push(el('div', {style: selectorsStyle}, selectorsPlaceholders));
            }

            switch (view) {
                case 'weekly':
                    elements.push(el('div', {style: weeklyPlaceholderStyle}));
                    elements.push(el('div', {style: weeklyPlaceholderStyle}));
                    elements.push(el('div', {style: weeklyPlaceholderStyle}));
                    elements.push(el('div', {style: weeklyPlaceholderStyle}));
                    elements.push(el('div', {style: weeklyPlaceholderStyle}));
                    elements.push(el('div', {style: weeklyPlaceholderStyle}));
                    elements.push(el('div', {style: weeklyPlaceholderStyle}));
                    break;
                case 'daily':
                    elements.push(el('div', {style: dailyPlaceholderStyle}));
                    break;
                case 'upcoming':
                    elements.push(el('div', {style: upcomingPlaceholderStyle}, [
                        el('div', {style: upcomingPlaceholderCalStyle}),
                        el('div', {style: upcomingPlaceholderEvStyle})
                    ]));
                    elements.push(el('div', {style: upcomingPlaceholderStyle}, [
                        el('div', {style: upcomingPlaceholderCalStyle}),
                        el('div', {style: upcomingPlaceholderEvStyle})
                    ]));
                    elements.push(el('div', {style: upcomingPlaceholderStyle}, [
                        el('div', {style: upcomingPlaceholderCalStyle}),
                        el('div', {style: upcomingPlaceholderEvStyle})
                    ]));
                    break;
                default:
                    elements.push(el('div', {style: monthlyPlaceholderStyle}));
                    break;
            }

            let selectorsList = [
                el(PanelRow, {},
                    el(ToggleControl,
                        {
                            label   : 'Show selectors',
                            help    : 'Displays some controls for the customer above the widget area',
                            checked : showSelectors,
                            onChange: newValue => {
                                props.setAttributes({showSelectors: newValue});
                            }
                        })
                ),
                showSelectors && el(PanelRow, {},
                    el(ToggleControl,
                        {
                            label   : 'Show service selector',
                            help    : 'A dropdown to filter by service',
                            checked : showFilterService,
                            onChange: newValue => {
                                props.setAttributes({showFilterService: newValue});
                            }
                        })
                ),
                showSelectors && el(PanelRow, {},
                    el(ToggleControl,
                        {
                            label   : 'Show service class selector',
                            help    : 'A dropdown to filter by service class',
                            checked : showFilterServiceClass,
                            onChange: newValue => {
                                props.setAttributes({showFilterServiceClass: newValue});
                            }
                        })
                ),
                showSelectors && el(PanelRow, {},
                    el(ToggleControl,
                        {
                            label   : 'Show timezone selector',
                            help    : 'A dropdown to change the display timezone',
                            checked : showSelectorTimezone,
                            onChange: newValue => {
                                props.setAttributes({showSelectorTimezone: newValue});
                            }
                        })
                )
            ];

            tbkData.bookingWidget.customElements.forEach(function (item) {
                if (item.childOf !== 'filterSelectors') {
                    return;
                }
                selectorsList.push(
                    showSelectors && el(PanelRow, {},
                    el(ToggleControl,
                        {
                            label   : item.title,
                            help    : item.helpText,
                            checked : props.attributes[item.refAttribute],
                            onChange: newValue => {
                                let obj = {};
                                obj[item.refAttribute] = newValue;
                                props.setAttributes(obj);
                            }
                        })
                    )
                );
            });

            let selectorsTab = el(PanelBody, {title: 'Selectors panel', initialOpen: false}, selectorsList);

            let workflowTab = el(PanelBody, {title: 'Workflow', initialOpen: false},
                el(PanelRow, {},
                    el(SelectControl, {
                        label   : 'Initial user choice',
                        value   : workflow,
                        options : [
                            {
                                label: 'Date first',
                                value: 'date_first'
                            },
                            {
                                label: 'Service first',
                                value: 'service_first'
                            }
                        ],
                        onChange: newValue => {
                            props.setAttributes({workflow: newValue});
                        }
                    })
                )
            );

            let permissionsTab = el(PanelBody, {title: 'Permissions', initialOpen: false},
                el(PanelRow, {},
                    el(ToggleControl,
                        {
                            label   : 'Read-only',
                            help    : 'Makes booking not possible through this widget instance',
                            checked : readOnly,
                            onChange: newValue => {
                                props.setAttributes({readOnly: newValue});
                            }
                        }
                    ),
                ),
                readOnly || el(PanelRow, {},
                el(ToggleControl,
                    {
                        label   : 'Logged-only',
                        help    : 'Makes booking not possible through this widget instance for guests',
                        checked : loggedOnly,
                        onChange: newValue => {
                            props.setAttributes({loggedOnly: newValue});
                        }
                    }
                ),
                ),
                el(PanelRow, {},
                    el('div', {className: 'components-tip'}, [tipIcon, el('p', {},
                        'Those permissions are applied to all the services presented through this widget, regardless of the service-specific permission settings.'
                    )])
                )
            );

            let optionsServices = [];

            for (let i = 0, len = tbkData.services.length; i < len; i++) {
                let srv = tbkData.services[i].id;
                optionsServices.push(el(CheckboxControl, {
                        label   : tbkData.services[i].name,
                        checked : restrictServices.indexOf(srv) !== -1,
                        onChange: newValue => {
                            const index = restrictServices.indexOf(srv);
                            const newArr = restrictServices.slice();
                            if (newValue) {
                                newArr.push(srv);
                                props.setAttributes({restrictServices: newArr});
                            } else {
                                newArr.splice(index, 1);
                                props.setAttributes({restrictServices: newArr});
                            }
                        }
                    })
                )
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

            let viewModeTab = el(PanelBody, {title: 'View mode', initialOpen: true},
                el(PanelRow, {},
                    el(RadioControl,
                        {
                            label   : 'Layout',
                            selected: view,
                            options : [
                                {
                                    label      : 'Monthly calendar',
                                    value      : 'monthly',
                                    description: 'ciao'
                                },
                                {
                                    label: 'Weekly calendar',
                                    value: 'weekly'
                                },
                                {
                                    label: 'Daily calendar',
                                    value: 'daily'
                                },
                                {
                                    label: 'Upcoming events',
                                    value: 'upcoming'
                                }
                            ],
                            onChange: newValue => {
                                props.setAttributes({view: newValue});
                            }
                        }
                    ),
                ),
                el(HorizontalRule, {}),
                view !== 'upcoming' && el(ToggleControl, {
                    label   : 'Load the calendar at specific date',
                    help    : 'Instructs the widget to point at a specific date by default',
                    checked : defaultDateActive,
                    onChange: newValue => {
                        props.setAttributes({defaultDateActive: newValue});
                    }
                }),
                view !== 'upcoming' && defaultDateActive && [
                    el(DatePicker, {
                        currentDate: defaultDate,
                        onChange   : newValue => {
                            props.setAttributes({defaultDate: newValue});
                        }
                    }),
                    el(PanelRow, {},
                        el('div', {className: 'components-tip'}, [tipIcon, el('p', {},
                            'To choose a default month in case of mothly view mode, just pick a day in that month. The same applies for the week.'
                        )])
                    )
                ],
                view === 'upcoming' && el(TextControl, {
                    label   : 'Displayed events',
                    help    : 'The number of upcoming events that are displayed on the page',
                    type    : 'number',
                    step    : 1,
                    min     : 1,
                    value   : upcomingEvents,
                    onChange: newValue => {
                        let value = Math.max(1, Math.floor(newValue));
                        props.setAttributes({upcomingEvents: value});
                    }
                }),
                view === 'upcoming' && el(PanelRow, {},
                el(ToggleControl,
                    {
                        label   : 'Show more',
                        help    : 'Shows a button to load more events',
                        checked : showMore,
                        onChange: newValue => {
                            props.setAttributes({showMore: newValue});
                        }
                    })
                ),
                view === 'upcoming' && showMore && el(TextControl, {
                    label   : 'Maximum fetched events',
                    help    : 'Limit the number of maximum events that can be loaded. 0 means no limit.',
                    type    : 'number',
                    step    : 1,
                    min     : 0,
                    value   : upcomingLimit,
                    onChange: newValue => {
                        let value = Math.max(0, Math.floor(newValue));
                        props.setAttributes({upcomingLimit: value});
                    }
                }),
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

            return (el(
                Fragment, {},
                el(
                    InspectorControls, {},
                    //viewModeTab,
                    //workflowTab,
                    //selectorsTab,
                    restrictionsTabServices,
                    ...customElements,
                    //permissionsTab,
                ),
                el(
                    'div',
                    {style: blockStyle},
                    content
                )
            ));
        },
        save       : function (props) {

            if (!props.attributes.defaultDateActive) {
                props.attributes.defaultDate = null;
            }

            let attrs = '';

            if (props.attributes.readOnly) {
                attrs += ' read_only="true"';
            }

            if (props.attributes.loggedOnly) {
                attrs += ' logged_only="true"';
            }

            if (props.attributes.showMore) {
                attrs += ' show_more="true"';
            }

            if (!props.attributes.showSelectors) {
                attrs += ' nofilter="true"';
            }

            if (!props.attributes.showFilterService) {
                attrs += ' filter-services="false"';
            }
            if (!props.attributes.showFilterServiceClass) {
                attrs += ' filter-service-classes="false"';
            }

            if (!props.attributes.showSelectorTimezone) {
                attrs += ' notimezone="true"';
            }

            if (props.attributes.defaultDate) {
                attrs += ' date="' + props.attributes.defaultDate + '"';
            }

            if (props.attributes.upcomingEvents !== 5) {
                attrs += ' upcoming_events="' + props.attributes.upcomingEvents + '"';
            }

            if (props.attributes.upcomingLimit > 0) {
                attrs += ' upcoming_limit="' + props.attributes.upcomingLimit + '"';
            }

            if (props.attributes.restrictServices.length) {
                attrs += ' service="' + props.attributes.restrictServices.join(',') + '"';
            }
            if (props.attributes.restrictServiceClasses.length) {
                attrs += ' service_class="' + props.attributes.restrictServiceClasses.join(',') + '"';
            }

            tbkData.bookingWidget.shortcodeAttrs.forEach(function (item) {
                if (props.attributes[item.refAttribute]) {
                    if (item.type === 'list' && props.attributes[item.refAttribute].length) {
                        attrs += ' ' + item.attrKey + '="' + props.attributes[item.refAttribute].join(',') + '"';
                    }
                    if (item.type === 'bool' && !props.attributes[item.refAttribute]) {
                        attrs += ' ' + item.attrKey + '="false"';
                    }
                }
            });

            switch (props.attributes.view) {
                case 'weekly':
                    attrs += ' view="weekly"';
                    break;
                case 'daily':
                    attrs += ' view="daily"';
                    break;
                case 'upcoming':
                    attrs += ' view="upcoming"';
                    break;
                default:
                    break;
            }

            switch (props.attributes.workflow) {
                case 'service_first':
                    attrs += ' workflow="service_first"';
                    break;
                default:
                    break;
            }

            return '[tbk-calendar' + attrs + ']';
        },
    };

    blocks.registerBlockType('tbkl/widget', blockTypeParams);
}(
    window.wp.blocks,
    window.wp.element
));