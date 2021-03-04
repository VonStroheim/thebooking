<?php

namespace TheBooking\Admin\UI_CoreSettings;

defined('ABSPATH') || exit;

class Panel_Maps
{
    public static function get_panel()
    {
        return [
            'panelRef'   => 'section-maps',
            'panelLabel' => __('Maps settings', 'thebooking'),
            'blocks'     => [
                [
                    'title'       => __('Load Google Maps JS library', 'thebooking'),
                    'description' => __('Turn this off if you are experiencing issues with Google Maps due to its library loaded multiple times by theme or other plugins.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'load_gmaps_library',
                            'type'      => 'toggle',
                        ]
                    ]
                ],
                [
                    'title'       => __('Google Maps API key', 'thebooking'),
                    'description' => __("You need an API key in order to use Google Maps for websites made after 22nd of June, 2016. If you don't have a Google Maps API key already, please check the documentation in order to know how to obtain it.", 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'gmaps_api_key',
                            'type'      => 'text',
                        ]
                    ]
                ]
            ]
        ];
    }
}