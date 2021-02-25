<?php

namespace TheBooking\Admin\UI_Availability;

defined('ABSPATH') || exit;

class Panel_WeeklyWorkingHours
{
    public static function get_panel()
    {
        return [
            'panelRef'   => 'section-working-hours',
            'panelLabel' => __('Working hours', 'the-booking'),
            'blocks'     => [
                [
                    'title'       => __('Working hours', 'the-booking'),
                    'description' => __('Define the weekly availability schedule.', 'the-booking'),
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