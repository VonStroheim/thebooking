<?php

namespace TheBooking\Frontend;

use VSHM_Framework\Tools;
use function TheBooking\localize_frontend_script;

defined('ABSPATH') || exit;

/**
 * Class UI
 *
 * @package TheBooking\Frontend
 */
final class UI
{
    public static function load_actions()
    {
        tbkg()->loader->add_filter('tbk_frontend_js_data_common', self::class, 'jsRoutesFrontend');
    }

    public static function jsRoutesFrontend($data)
    {
        $data['UI'] = [
            'theme' => self::get_theme()
        ];

        return $data;
    }

    public static function load_resources()
    {
        wp_enqueue_style('tbk-fonts',
            '//fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,700;1,300&display=swap" rel="stylesheet"',
            [],
            '1.0.0'
        );
        //wp_enqueue_style('wp-components');
        \VSHM_Framework\Tools::enqueue_style('tbk-frontend-style', '/css/frontend.css');
        \VSHM_Framework\Tools::enqueue_script('tbk-frontend-script', '/js/frontend/tbk.js',
            [
                'jquery',
                'wp-api',
                'wp-blocks',
                'wp-element',
                'wp-editor',
                'wp-components',
                'lodash',
                'underscore'
            ],
            TRUE);

        /**
         * JS translations
         */
        wp_set_script_translations('tbk-frontend-script', 'thebooking', WP_LANG_DIR . '/plugins/');

        wp_add_inline_script('tbk-frontend-script', 'var TBK=lodash.merge(' . json_encode(localize_frontend_script()) . ', TBK || {})', 'before');
    }

    public static function get_theme()
    {
        $base_font_size = 16;

        $primary    = tbkg()->settings->frontend_primary_color();
        $secondary  = tbkg()->settings->frontend_secondary_color();
        $background = tbkg()->settings->frontend_background_color();

        return [
            'typography' => [
                'fontFamily'   => "'Open Sans', sans-serif",
                'fontSize'     => $base_font_size * 0.875,
                'htmlFontSize' => $base_font_size,
                'overline'     => [
                    'fontSize' => $base_font_size * 0.75,
                ],
                'caption'      => [
                    'fontSize' => $base_font_size * 0.75,
                ],
                'h1'           => [
                    'fontSize' => $base_font_size * 6
                ],
                'h2'           => [
                    'fontSize' => $base_font_size * 3.75,
                ],
                'h3'           => [
                    'fontSize' => $base_font_size * 3,
                ],
                'h4'           => [
                    'fontSize' => $base_font_size * 2.125,
                ],
                'h5'           => [
                    'fontSize' => $base_font_size * 1.5,
                ],
                'h6'           => [
                    'fontSize' => $base_font_size * 1.25,
                ],
                'subtitle1'    => [
                    'fontSize' => $base_font_size * 1,
                ],
                'subtitle2'    => [
                    'fontSize' => $base_font_size * 0.875,
                ],
                'body2'        => [
                    'fontSize' => $base_font_size * 0.875,
                ],
                'body1'        => [
                    'fontSize' => $base_font_size * 0.875,
                ],
                'button'       => [
                    'fontSize' => $base_font_size * 0.875,
                ],
            ],
            'overrides'  => [
                'MuiScopedCssBaseline' => [
                    'root' => [
                        '& input'        => [
                            'padding'    => '27px 12px 10px',
                            'boxSizing'  => 'content-box',
                            'border'     => 0,
                            'outline'    => 0,
                            'background' => 'none'
                        ],
                        '& input:focus'  => [
                            'outline' => 0,
                            'border'  => 0,
                        ],
                        '& button:focus' => [
                            'outline'    => 'none',
                            'background' => 'none',
                        ],
                        '& button:hover' => [
                            'background' => 'tbkFixOverride' // Hack
                        ],
                        '& textarea'     => [
                            'background' => 'none'
                        ],
                        '& table'        => [
                            'margin' => '0'
                        ],
                        '& th'           => [
                            'border' => 'none'
                        ],
                        '& td'           => [
                            'border' => 'none'
                        ]
                    ]
                ],
                'MuiTableCell'         => [
                    'head' => [
                        'fontWeight' => 600,
                    ]
                ],
                'MuiButton'            => [
                    'root' => [
                        'textTransform'            => 'none',
                        'fontWeight'               => 600,
                        '&$containedSizeSmall'     => [
                            'fontSize' => $base_font_size * 0.75,
                        ],
                        '&$sizeSmall'              => [
                            'fontSize' => $base_font_size * 0.75,
                        ],
                        '&$containedPrimary:focus' => [
                            'background' => $primary
                        ]
                    ]
                ],
                'MuiButtonBase'        => [
                    'root' => [
                        'fontFamily'    => "'Open Sans', sans-serif",
                        'textTransform' => 'none',
                        'fontWeight'    => 400
                    ]
                ],
                'MuiToggleButton'      => [
                    'root' => [
                        '&$sizeSmall'      => [
                            'fontSize'   => $base_font_size * 0.75,
                            'padding'    => '4px 7px',
                            'fontWeight' => 600
                        ],
                        '&$selected'       => [
                            'color' => 'inherit'
                        ],
                        '&$selected:focus' => [
                            'background' => 'rgba(0, 0, 0, 0.12)'
                        ]
                    ]
                ],
                'MuiIconButton'        => [
                    'root' => [
                        'padding'  => $base_font_size * 0.625,
                        'fontSize' => $base_font_size * 1.25,
                    ]
                ],
                'MuiSvgIcon'           => [
                    'root'          => [
                        'width'                     => $base_font_size * 1.5,
                        'height'                    => $base_font_size * 1.5,
                        'fontSize'                  => $base_font_size * 1.5,
                        '&.tbkInlineFormHeaderIcon' => [
                            'width'        => 22,
                            'height'       => 22,
                            'marginBottom' => -6,
                        ]
                    ],
                    'fontSizeSmall' => [
                        'width'    => $base_font_size * 1.25,
                        'height'   => $base_font_size * 1.25,
                        'fontSize' => $base_font_size * 1.25,
                    ]
                ],
                'MuiChip'              => [
                    'root'      => [
                        'fontSize' => $base_font_size * 1,
                    ],
                    'sizeSmall' => [
                        'fontSize' => $base_font_size * 0.75,
                    ]
                ],
                'MuiFormLabel'         => [
                    'root' => [
                        'color'     => 'inherit',
                        '&$focused' => [
                            'color' => 'inherit'
                        ]
                    ]
                ],
                'MuiFilledInput'       => [
                    'underline' => [
                        '&$disabled:before' => [
                            'borderBottomStyle' => 'solid'
                        ]
                    ]
                ],
                'MuiCardHeader'        => [
                    'root'  => [
                        'alignItems' => 'start',
                        'padding'    => 12,
                        '& $action'  => [
                            'margin' => 0
                        ]
                    ],
                    'title' => [
                        'fontWeight'   => 600,
                        'marginBottom' => 4
                    ]
                ],
                'MuiCardContent'       => [
                    'root' => [
                        'padding'      => 12,
                        '&:last-child' => [
                            'paddingBottom' => 12
                        ]
                    ]
                ],
                'MuiFormControl'       => [
                    'root' => [
                        '&& svg' => [
                            'width'    => $base_font_size * 1.25,
                            'height'   => $base_font_size * 1.25,
                            'fontSize' => $base_font_size * 1.25,
                        ]
                    ]
                ],
                'MuiFormControlLabel'  => [
                    'label' => [

                    ]
                ],
                'MuiAutocomplete'      => [
                    'inputRoot' => [
                        'background'  => 'rgba(0, 0, 0, 0.09)',
                        '&& input'    => [
                            'margin'     => '0 !important',
                            'padding'    => '9.5px 4px !important',
                            'background' => 'transparent !important',
                            'minHeight'  => '0 !important',
                            'border'     => 'none !important',
                            '&:focus'    => [
                                'boxShadow' => 'none !important'
                            ]
                        ],
                        '&& fieldset' => [
                            'margin' => '0 !important'
                        ]
                    ],
                    'paper'     => [
                        'background' => Tools::adjustBrightness($background, Tools::requiresDarkTheme($background) ? '0.1' : '-0.1')
                    ]
                ],
                'MuiTextField'         => [
                    'root' => [
                        '&& input' => [
                            'margin'     => '0 !important',
                            'padding'    => '27px 12px 10px !important',
                            'background' => 'transparent !important',
                            'minHeight'  => '0 !important',
                            'border'     => 'none !important',
                            '&:focus'    => [
                                'boxShadow' => 'none !important'
                            ]
                        ]
                    ]
                ],
                'MuiBackdrop'          => [
                    'root' => [
                        'position'        => 'absolute',
                        'zIndex'          => '1101',
                        'backgroundColor' => 'rgb(255 255 255 / 50%)'
                    ]
                ],
                'MuiPaper'             => [
                    'root' => [
                        '&.tbkTransparentBg' => [
                            'background' => 'transparent'
                        ]
                    ]
                ]
            ],
            'palette'    => [
                'primary'    => [
                    'main' => $primary
                ],
                'secondary'  => [
                    'main' => $secondary
                ],
                'background' => [
                    'default' => $background,
                    'paper'   => 'rgb(255 255 255 / 20%)'
                ],
                'type'       => Tools::requiresDarkTheme($background) ? 'dark' : 'light'
            ],
            'TBK'        => [
                'availableColor'      => tbkg()->settings->frontend_available_color(),
                'availableColorLight' => Tools::adjustBrightness(tbkg()->settings->frontend_available_color(), 0.3),
                'bookedColor'         => tbkg()->settings->frontend_booked_color(),
                'bookedColorLight'    => Tools::adjustBrightness(tbkg()->settings->frontend_booked_color(), 0.3),
            ]
        ];
    }
}