<?php

namespace TheBooking\Admin\UI_CoreSettings;

defined('ABSPATH') || exit;

class Panel_Database
{
    public static function get_panel()
    {
        return [
            'panelRef'   => 'section-db',
            'panelLabel' => __('Database settings', 'thebooking'),
            'blocks'     => [
                [
                    'title'      => __('Retain plugin settings and data when the plugin is uninstalled.', 'thebooking'),
                    'components' => [
                        [
                            'settingId' => 'retain_plugin_data',
                            'type'      => 'toggle'
                        ]
                    ]
                ],
                [
                    'title'       => __('Reservation records lifecycle', 'thebooking'),
                    'description' => sprintf(
                        __('How long reservation records should be kept in database. Recommended setting: "%s"', 'thebooking'),
                        __('Forever', 'thebooking')
                    ),
                    'components'  => [
                        [
                            'settingId' => 'reservation_records_lifecycle',
                            'type'      => 'select',
                            'options'   => [
                                [
                                    'value' => 15 * DAY_IN_SECONDS,
                                    'label' => sprintf(__('%d days', 'thebooking'), 15)
                                ],
                                [
                                    'value' => 30 * DAY_IN_SECONDS,
                                    'label' => sprintf(__('%d days', 'thebooking'), 30)
                                ],
                                [
                                    'value' => 60 * DAY_IN_SECONDS,
                                    'label' => sprintf(__('%d days', 'thebooking'), 60)
                                ],
                                [
                                    'value' => 120 * DAY_IN_SECONDS,
                                    'label' => sprintf(__('%d days', 'thebooking'), 120)
                                ],
                                [
                                    'value' => 240 * DAY_IN_SECONDS,
                                    'label' => sprintf(__('%d days', 'thebooking'), 240)
                                ],
                                [
                                    'value' => 360 * DAY_IN_SECONDS,
                                    'label' => sprintf(__('%d days', 'thebooking'), 360)
                                ],
                                [
                                    'value' => 0,
                                    'label' => __('Forever', 'thebooking')
                                ]
                            ]
                        ],
                        [
                            'type' => 'notice',
                            'text' => __('Lifecycle starts when the reservation service is fulfilled, not when the reservation is made.', 'thebooking'),
                        ]
                    ]
                ],
            ]
        ];
    }
}