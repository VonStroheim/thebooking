<?php

namespace TheBooking\Admin\UI_CoreSettings;

defined('ABSPATH') || exit;

class Panel_Database
{
    public static function get_panel()
    {
        return [
            'panelRef'   => 'section-db',
            'panelLabel' => __('Database settings', 'the-booking'),
            'blocks'     => [
                [
                    'title'      => __('Retain plugin settings and data when the plugin is uninstalled.', 'the-booking'),
                    'components' => [
                        [
                            'settingId' => 'retain_plugin_data',
                            'type'      => 'toggle'
                        ]
                    ]
                ],
                [
                    'title'       => __('Reservation records lifecycle', 'the-booking'),
                    'description' => sprintf(
                        __('How long reservation records should be kept in database. Recommended setting: "%s"', 'the-booking'),
                        __('Forever', 'the-booking')
                    ),
                    'components'  => [
                        [
                            'settingId' => 'reservation_records_lifecycle',
                            'type'      => 'select',
                            'options'   => [
                                [
                                    'value' => 15 * DAY_IN_SECONDS,
                                    'label' => sprintf(__('%d days', 'the-booking'), 15)
                                ],
                                [
                                    'value' => 30 * DAY_IN_SECONDS,
                                    'label' => sprintf(__('%d days', 'the-booking'), 30)
                                ],
                                [
                                    'value' => 60 * DAY_IN_SECONDS,
                                    'label' => sprintf(__('%d days', 'the-booking'), 60)
                                ],
                                [
                                    'value' => 120 * DAY_IN_SECONDS,
                                    'label' => sprintf(__('%d days', 'the-booking'), 120)
                                ],
                                [
                                    'value' => 240 * DAY_IN_SECONDS,
                                    'label' => sprintf(__('%d days', 'the-booking'), 240)
                                ],
                                [
                                    'value' => 360 * DAY_IN_SECONDS,
                                    'label' => sprintf(__('%d days', 'the-booking'), 360)
                                ],
                                [
                                    'value' => 0,
                                    'label' => __('Forever', 'the-booking')
                                ]
                            ]
                        ],
                        [
                            'type' => 'notice',
                            'text' => __('Lifecycle starts when the reservation service is fulfilled, not when the reservation is made.', 'the-booking'),
                        ]
                    ]
                ],
            ]
        ];
    }
}