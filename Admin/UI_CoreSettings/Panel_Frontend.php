<?php

namespace TheBooking\Admin\UI_CoreSettings;

defined('ABSPATH') || exit;

class Panel_Frontend
{
    public static function get_panel()
    {
        return [
            'panelRef'   => 'section-frontend',
            'panelLabel' => __('Frontend', 'thebooking'),
            'blocks'     => [
                [
                    'title'       => __('Load the calendar at the closest month/week/day with available slots', 'thebooking'),
                    'description' => __('If turned on, the frontend calendar is automatically loaded at the closest free slot.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'load_calendar_at_closest_slot',
                            'type'      => 'toggle'
                        ],
                        [
                            'type'   => 'notice',
                            'intent' => 'warning',
                            'text'   => __('Page loading can be a little bit slower if this setting is active.', 'thebooking'),
                        ]
                    ]
                ],
                [
                    'title'       => __('Hide weekends from the calendar', 'thebooking'),
                    'description' => __('If turned on, the frontend calendar will not display Saturdays and Sundays.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'frontend_days_in_week',
                            'type'      => 'toggle'
                        ]
                    ]
                ],
                [
                    'title'      => __('Primary color', 'thebooking'),
                    'components' => [
                        [
                            'settingId' => 'frontend_primary_color',
                            'type'      => 'colorPicker'
                        ]
                    ]
                ],
                [
                    'title'      => __('Secondary color', 'thebooking'),
                    'components' => [
                        [
                            'settingId' => 'frontend_secondary_color',
                            'type'      => 'colorPicker'
                        ]
                    ]
                ]
            ]
        ];
    }
}