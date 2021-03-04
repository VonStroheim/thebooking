<?php

namespace TheBooking\Admin\UI_Availability;

defined('ABSPATH') || exit;

class Panel_WeeklyWorkingHours
{
    public static function get_panel()
    {
        return [
            'panelRef'   => 'section-working-hours',
            'panelLabel' => __('Working hours', 'thebooking'),
            'blocks'     => [
                [
                    'title'       => __('Working hours', 'thebooking'),
                    'description' => __('Define the weekly availability schedule.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'working_hours',
                            'type'      => 'hoursPlanner'
                        ],
                    ]
                ]
            ]
        ];
    }
}