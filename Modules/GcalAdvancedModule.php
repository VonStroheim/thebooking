<?php

namespace TheBooking\Modules;

use TheBooking\Classes\DateTimeTbk;
use VSHM_Framework\REST_Controller;
use VSHM_Framework\Strings;

defined('ABSPATH') || exit;

/**
 * Class GcalAdvancedModule
 *
 * @package TheBooking
 * @author  VonStroheim
 */
final class GcalAdvancedModule
{
    const OPTIONS_TAG = 'tbkg_gcal_advanced';

    const AVAILABILITY_CALENDAR = 'gcalAdvanced_availabilityCalendar';

    public static function bootstrap()
    {
        REST_Controller::register_routes([
            '/google/getavailabilityevents' => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => [self::class, 'frontendAvailability'],
            ],
        ]);

        tbkg()->loader->add_filter('tbk_module_gcal2ways_backend_settings_blocks', self::class, 'settingsBlocks');
        tbkg()->loader->add_filter('tbk_frontend_middleware', self::class, 'frontend_middleware', 10, 2);
        tbkg()->loader->add_action('tbk-backend-settings-save-single', self::class, 'save_setting_callback', 10, 2);
        tbkg()->loader->add_filter('tbk_backend_settings', self::class, 'settings');
        tbkg()->loader->add_action('tbk_clean_uninstall', self::class, 'cleanup');
        tbkg()->loader->add_filter('tbk_loaded_modules', self::class, 'isLoaded');
        tbkg()->loader->add_filter('tbk_frontend_availability', self::class, 'frontend_availability', 10, 2);
        self::getEvents();
    }

    public static function frontend_availability(\ArrayObject $availability, $shortcode_attrs)
    {
        $now          = new DateTimeTbk();
        $gcal_options = Gcal2WaysModule::_get_options();
        $self_options = self::_get_options();
        if (!empty($self_options[ self::AVAILABILITY_CALENDAR ]) && !empty($gcal_options[ Gcal2WaysModule::ACCESS_TOKEN ])) {
            $availability->exchangeArray(array_merge($availability->getArrayCopy(), self::getEvents($now->format(\DateTime::RFC3339))->getArrayCopy()));
        }

        return $availability;
    }

    public static function frontendAvailability(\WP_REST_Request $request)
    {
        $response = [
            'availability' => self::getEvents($request->get_param('targetDate'))
        ];

        return apply_filters('tbk_google_2way_get_freebusy_response', new \WP_REST_Response($response, 200));
    }

    public static function frontend_middleware($middleware, $shortcode_attrs)
    {
        $gcal_options = Gcal2WaysModule::_get_options();
        $self_options = self::_get_options();
        if (!empty($self_options[ self::AVAILABILITY_CALENDAR ]) && !empty($gcal_options[ Gcal2WaysModule::ACCESS_TOKEN ])) {
            $middleware['changeMonth'][] = [
                'type'     => 'async',
                'endpoint' => '/google/getavailabilityevents/'
            ];
        }

        return $middleware;
    }

    public static function backendAvailabilities($availabilities)
    {

        return $availabilities;
    }

    public static function getEvents($date_rfc = NULL)
    {
        $gcal_options = Gcal2WaysModule::_get_options();
        $self_options = self::_get_options();
        $client       = Gcal2WaysModule::_client();

        $serviceNames = [];

        foreach (tbkg()->services->filter_by(['active' => TRUE]) as $item) {
            $serviceNames[ Strings::vshm_mb_strtolower($item->name()) ] = $item->id();
        }

        // ArrayObject is converted to {} in the frontend even when it's empty.
        $availability = new \ArrayObject();

        if (!empty($self_options[ self::AVAILABILITY_CALENDAR ])) {
            $client->setAccessToken($gcal_options[ Gcal2WaysModule::ACCESS_TOKEN ]);
            $service     = new \Google_Service_Calendar($client);
            $min         = $date_rfc ? DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $date_rfc) : new DateTimeTbk();
            $optParams   = [
                'timeMin' => $min->format(\DateTime::RFC3339),
                'timeMax' => $min->add(new \DateInterval('P1M'))->format(\DateTime::RFC3339)
            ];
            $events      = $service->events->listEvents($self_options[ self::AVAILABILITY_CALENDAR ], $optParams);
            $recurrences = [];
            $singles     = [];
            $exceptions  = [];
            while (TRUE) {
                foreach ($events->getItems() as $event) {

                    // Excluding extraneous events
                    $normalizedSummary = Strings::vshm_mb_strtolower($event->getSummary());
                    if (!isset($serviceNames[ $normalizedSummary ]) && $normalizedSummary !== 'all' && !$event->getRecurringEventId()) {
                        continue;
                    }

                    $p_event = [
                        'summary'          => $event->getSummary(),
                        'description'      => $event->getDescription(),
                        'status'           => $event->getStatus(),
                        'recurrence'       => $event->getRecurrence(),
                        'recurringEventId' => $event->getRecurringEventId(),
                        'start'            => $event->getStart() ? $event->getStart()->getDateTime() : NULL,
                        'end'              => $event->getEnd() ? $event->getEnd()->getDateTime() : NULL,
                        'originalStart'    => $event->getOriginalStartTime() ? $event->getOriginalStartTime()->getDateTime() : NULL,
                        'timezone'         => $event->getStart() ? $event->getStart()->getTimeZone() : NULL,
                    ];
                    if (is_array($p_event['recurrence'])) {
                        $recurrences[ $event->getId() ] = $p_event;
                    } elseif ($p_event['recurringEventId']) {
                        $exceptions[ $event->getId() ] = $p_event;
                    } else {
                        $singles[ $event->getId() ] = $p_event;
                    }
                }
                $pageToken = $events->getNextPageToken();
                if ($pageToken) {
                    $optParams['pageToken'] = $pageToken;
                    $events                 = $service->events->listEvents($self_options[ self::AVAILABILITY_CALENDAR ], $optParams);
                } else {
                    break;
                }
            }

            /**
             * Preparing recurrences
             */
            foreach ($recurrences as $r_id => $recurrence) {
                if ($recurrence['start']) {
                    $dtstart = \DateTime::createFromFormat('Y-m-d\TH:i:sP', $recurrence['start'], new \DateTimeZone($recurrence['timezone']));
                    $dtstart->setTimezone(new \DateTimeZone('UTC'));
                    $end        = \DateTime::createFromFormat('Y-m-d\TH:i:sP', $recurrence['end'], new \DateTimeZone($recurrence['timezone']));
                    $rrule      = 'DTSTART:' . $dtstart->format('Ymd\THis\Z') . "\n" . $recurrence['recurrence'][0];
                    $exceptions = array_filter($exceptions, static function ($var) use ($r_id) {
                        return $var['recurringEventId'] === $r_id;
                    });
                    $exdates    = [];
                    foreach ($exceptions as $e_id => $exception) {
                        $exdate = DateTimeTbk::createFromFormatSilently('Y-m-d\TH:i:sP', $exception['originalStart']);
                        $exdate->setTimezone(new \DateTimeZone('UTC'));
                        $exdates[] = $exdate->format('Ymd\THis\Z');
                        if ($exception['status'] === 'confirmed') {
                            // Send the event to "singles"
                            $singles[ $e_id ] = $exception;
                        }
                    }
                    if ($exdates) {
                        $rrule .= "\nEXDATE:" . implode(',', $exdates);
                    }

                    $normalizedSummary = Strings::vshm_mb_strtolower($recurrence['summary']);

                    if ($normalizedSummary === 'all') {
                        foreach ($serviceNames as $serviceName => $serviceID) {
                            $availability[ $self_options[ self::AVAILABILITY_CALENDAR ] . '|' . $r_id ][] = [
                                'rrule'             => $rrule,
                                'serviceId'         => $serviceID,
                                'containerDuration' => [
                                    'minutes' => round(($end->getTimestamp() - $dtstart->getTimestamp()) / 60)
                                ]
                            ];
                        }
                    } else {
                        $availability[ $self_options[ self::AVAILABILITY_CALENDAR ] . '|' . $r_id ][] = [
                            'rrule'             => $rrule,
                            'serviceId'         => $serviceNames[ $normalizedSummary ],
                            'containerDuration' => [
                                'minutes' => round(($end->getTimestamp() - $dtstart->getTimestamp()) / 60)
                            ]
                        ];
                    }

                }
            }
            /**
             * Preparing singles
             */
            foreach ($singles as $s_id => $single) {
                $tz      = $single['timezone'] ? new \DateTimeZone($single['timezone']) : NULL;
                $dtstart = \DateTime::createFromFormat('Y-m-d\TH:i:sP', $single['start'], $tz);
                $dtstart->setTimezone(new \DateTimeZone('UTC'));
                $end   = \DateTime::createFromFormat('Y-m-d\TH:i:sP', $single['end'], $tz);
                $rrule = 'DTSTART:' . $dtstart->format('Ymd\THis\Z') . "\nFREQ=DAILY;INTERVAL=1;COUNT=1";

                $normalizedSummary = Strings::vshm_mb_strtolower($single['summary']);

                if ($normalizedSummary === 'all') {
                    foreach ($serviceNames as $serviceName => $serviceID) {
                        $availability[ $self_options[ self::AVAILABILITY_CALENDAR ] . '|' . $s_id ][] = [
                            'rrule'             => $rrule,
                            'serviceId'         => $serviceID,
                            'containerDuration' => [
                                'minutes' => round(($end->getTimestamp() - $dtstart->getTimestamp()) / 60)
                            ]
                        ];
                    }
                } else {
                    $availability[ $self_options[ self::AVAILABILITY_CALENDAR ] . '|' . $s_id ][] = [
                        'rrule'             => $rrule,
                        'serviceId'         => $serviceNames[ $normalizedSummary ],
                        'containerDuration' => [
                            'minutes' => round(($end->getTimestamp() - $dtstart->getTimestamp()) / 60)
                        ]
                    ];
                }

            }
        }

        return $availability;
    }

    public static function settingsBlocks($blocks)
    {
        // Catching Google Calendar list to avoid a second API call
        $list = [];
        foreach ($blocks as $block) {
            $linkedCalendarBlock = array_search(Gcal2WaysModule::LINKED_GCAL, array_column($block['components'], 'settingId'), TRUE);
            if ($linkedCalendarBlock !== FALSE && isset($block['components'][ $linkedCalendarBlock ]['options'])) {
                $list = $block['components'][ $linkedCalendarBlock ]['options'];
            }
        }

        $blocks[] = [
            'title'        => __('Availability Google Calendar', 'thebooking'),
            'description'  => __('If you want to provide availability through a Google Calendar, select it here.', 'thebooking'),
            'components'   => [
                [
                    'type'        => 'select',
                    'options'     => $list,
                    'settingId'   => self::AVAILABILITY_CALENDAR,
                    'showClear'   => TRUE,
                    'placeholder' => __('Select a Google Calendar', 'thebooking')
                ],
                [
                    'type' => 'notice',
                    'text' => __('This advanced feature lets you to provide availability for your services through Google Calendar, thus allowing a complete booking management without the need to use the plugin backend. To know more about the correct procedures and options, refer to the documentation.', 'thebooking')
                ]
            ],
            'dependencies' => [
                [
                    'on'    => Gcal2WaysModule::ACCESS_TOKEN,
                    'being' => 'NOT_EMPTY'
                ]
            ]
        ];

        return $blocks;
    }

    /**
     * @param array $modules
     *
     * @return array
     */
    public static function isLoaded($modules)
    {
        $modules[] = 'gcalAdvanced';

        return $modules;
    }

    public function cleanup()
    {
        delete_option(self::OPTIONS_TAG);
    }

    private static function _get_options()
    {
        $defaults = [
            self::AVAILABILITY_CALENDAR => NULL,
        ];

        return get_option(self::OPTIONS_TAG, $defaults) + $defaults;
    }

    public static function settings($settings)
    {
        $options = self::_get_options();

        $settings[ self::AVAILABILITY_CALENDAR ] = $options[ self::AVAILABILITY_CALENDAR ];

        return $settings;
    }

    public static function save_setting_callback($settingId, $value)
    {
        $options = self::_get_options();

        switch ($settingId) {
            case self::AVAILABILITY_CALENDAR:
                $options[ self::AVAILABILITY_CALENDAR ] = $value;
                break;
            default:
                break;
        }

        update_option(self::OPTIONS_TAG, $options);
    }
}