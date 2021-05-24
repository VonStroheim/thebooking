<?php

namespace TheBooking\Admin\UI_Availability;

defined('ABSPATH') || exit;

class Panel_ClosingDates
{
    public static function get_panel()
    {
        return [
            'panelRef'   => 'section-closing-dates',
            'panelLabel' => __('Closing dates', 'thebooking'),
            'blocks'     => [
                [
                    'title'       => __('Closing dates', 'thebooking'),
                    'description' => __('Select the days in which services are not available.', 'thebooking'),
                    'components'  => [
                        [
                            'settingId' => 'availabilityGlobal_1',
                            'type'      => 'closingDatesPlanner'
                        ],
                    ]
                ]
            ]
        ];
    }
}