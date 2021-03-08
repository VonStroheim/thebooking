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
                    'title'       => __('Primary color', 'thebooking'),
                    'description' => __('Used by primary elements such as action buttons.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'frontend_primary_color',
                            'type'      => 'colorPicker'
                        ]
                    ]
                ],
                [
                    'title'       => __('Secondary color', 'thebooking'),
                    'description' => __('Used by secondary elements such as form field labels.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'frontend_secondary_color',
                            'type'      => 'colorPicker'
                        ]
                    ]
                ],
                [
                    'title'       => __('Background color', 'thebooking'),
                    'description' => __('Background color of the entire booking widget. Foreground text adapts automatically.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'frontend_background_color',
                            'type'      => 'colorPicker'
                        ]
                    ]
                ],
                [
                    'title'       => __('Color of days with available time slots', 'thebooking'),
                    'description' => __('A day of the calendar has this color if it contains at least one available time slot.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'frontend_available_color',
                            'type'      => 'colorPicker'
                        ]
                    ]
                ],
                [
                    'title'       => __('Color of days with booked time slots', 'thebooking'),
                    'description' => __('A day of the calendar has this color if it only contains booked timeslots.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'frontend_booked_color',
                            'type'      => 'colorPicker'
                        ]
                    ]
                ]
            ]
        ];
    }
}