<?php

namespace TheBooking\Admin\UI_Availability;

defined('ABSPATH') || exit;

class Panel_Locations
{
    public static function get_panel()
    {
        return [
            'panelRef'   => 'section-locations',
            'panelLabel' => __('Locations', 'the-booking'),
            'noSave'     => TRUE,
            'blocks'     => [
                [
                    'title'      => __('Locations', 'the-booking'),
                    'components' => [
                        [
                            'settingId' => 'locations',
                            'type'      => 'LocationsTable'
                        ],
                    ]
                ]
            ]
        ];
    }
}