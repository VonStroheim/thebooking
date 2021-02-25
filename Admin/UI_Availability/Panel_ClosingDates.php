<?php

namespace TheBooking\Admin\UI_Availability;

defined('ABSPATH') || exit;

class Panel_ClosingDates
{
    public static function get_panel()
    {
        return [
            'panelRef'   => 'section-closing-dates',
            'panelLabel' => __('Closing dates', 'the-booking'),
            'blocks'     => [
                [
                    'title'       => __('Closing dates', 'the-booking'),
                    'description' => __('Select the days in which services are not available.', 'the-booking'),
                    'components'  => [
                        [
                            'settingId' => 'working_hours',
                            'type'      => 'closingDatesPlanner'
                        ],
                    ]
                ]
            ]
        ];
    }
}