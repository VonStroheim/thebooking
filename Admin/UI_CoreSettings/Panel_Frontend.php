<?php

namespace TheBooking\Admin\UI_CoreSettings;

defined('ABSPATH') || exit;

class Panel_Frontend
{
    public static function get_panel()
    {
        return [
            'panelRef'   => 'section-frontend',
            'panelLabel' => __('Frontend', 'the-booking'),
            'blocks'     => [
                [
                    'title'       => __('Load the calendar at the closest month/week/day with available slots', 'the-booking'),
                    'description' => __('If turned on, the frontend calendar is automatically loaded at the closest free slot.', 'the-booking'),
                    'components'  => [
                        [
                            'settingId' => 'load_calendar_at_closest_slot',
                            'type'      => 'toggle'
                        ],
                        [
                            'type'   => 'notice',
                            'intent' => 'warning',
                            'text'   => __('Page loading can be a little bit slower if this setting is active.', 'the-booking'),
                        ]
                    ]
                ],
                [
                    'title'       => __('Hide weekends from the calendar', 'the-booking'),
                    'description' => __('If turned on, the frontend calendar will not display Saturdays and Sundays.', 'the-booking'),
                    'components'  => [
                        [
                            'settingId' => 'frontend_days_in_week',
                            'type'      => 'toggle'
                        ]
                    ]
                ],
                [
                    'title'      => __('Primary color', 'the-booking'),
                    'components' => [
                        [
                            'settingId' => 'frontend_primary_color',
                            'type'      => 'colorPicker'
                        ]
                    ]
                ],
                [
                    'title'      => __('Secondary color', 'the-booking'),
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