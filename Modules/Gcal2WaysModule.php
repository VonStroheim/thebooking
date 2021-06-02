<?php

namespace TheBooking\Modules;

use Google\Service\Exception;
use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\ChangeReservationDates;
use TheBooking\Bus\Commands\ChangeReservationLocation;
use TheBooking\Bus\Commands\ChangeReservationService;
use TheBooking\Bus\Commands\ChangeReservationStatus;
use TheBooking\Bus\Commands\CreateReservation;
use TheBooking\Bus\Commands\DeleteReservation;
use TheBooking\Classes\DateTimeTbk;
use TheBooking\Classes\Reservation;
use TheBooking\Classes\ValueTypes\Status;
use VSHM_Framework\Classes\REST_Error_Unauthorized;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class Gcal2WaysModule
 *
 * @package TheBooking
 * @author  VonStroheim
 */
final class Gcal2WaysModule
{

    const OPTIONS_TAG = 'tbkg_gcal_2ways';

    const CLIENT_ID          = 'gcal2ways_clientId';
    const CLIENT_SECRET      = 'gcal2ways_clientSecret';
    const APP_NAME           = 'gcal2ways_applicationName';
    const ACCESS_TOKEN       = 'gcal2ways_accessToken';
    const LINKED_GCAL        = 'gcal2ways_linkedGcal';
    const BLOCK_AVAILABILITY = 'gcal2ways_blockAvailability';
    const CREATE_EVENTS      = 'gcal2ways_createEvents';
    const DELETE_EVENTS_WHEN = 'gcal2ways_deleteEventsWhen';

    public static function bootstrap()
    {
        REST_Controller::register_routes([
            '/google/oauth'       => [
                'methods'  => \WP_REST_Server::READABLE,
                'callback' => [self::class, 'oAuthCallback'],
                'args'     => [
                    'code' => [
                        'required' => TRUE
                    ],
                ]
            ],
            '/google/revoke'      => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => [self::class, 'revokeCallback'],
            ],
            '/google/getfreebusy' => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => [self::class, 'getFreeBusy'],
            ],
        ]);

        tbkg()->loader->add_filter('tbk_backend_core_settings_panels', self::class, 'settingsPanel');
        tbkg()->loader->add_action('tbk-backend-settings-save-single', self::class, 'save_setting_callback', 10, 2);
        tbkg()->loader->add_filter('tbk_backend_settings', self::class, 'settings');
        tbkg()->loader->add_filter('tbk_frontend_middleware', self::class, 'frontend_middleware', 10, 2);
        tbkg()->loader->add_filter('tbk_backend_middleware', self::class, 'backend_middleware');
        tbkg()->loader->add_filter('tbk_frontend_busy_intervals', self::class, 'frontend_busy_intervals', 10, 2);
        tbkg()->loader->add_filter('tbk_backend_busy_intervals', self::class, 'backend_busy_intervals');
        tbkg()->loader->add_action('tbk_clean_uninstall', self::class, 'cleanup');
        tbkg()->loader->add_action('tbk_dispatched_CreateReservation', self::class, 'add_reservation_to_gcal');
        tbkg()->loader->add_action('tbk_dispatching_DeleteReservation', self::class, 'delete_reservation_from_gcal');
        tbkg()->loader->add_action('tbk_dispatched_ChangeReservationDates', self::class, 'change_gcal_event');
        tbkg()->loader->add_action('tbk_dispatched_ChangeReservationService', self::class, 'change_gcal_event');
        tbkg()->loader->add_action('tbk_dispatched_ChangeReservationStatus', self::class, 'change_gcal_event');
        tbkg()->loader->add_action('tbk_dispatched_ChangeReservationLocation', self::class, 'change_gcal_event');
        tbkg()->loader->add_filter('tbk_loaded_modules', self::class, 'isLoaded');
    }

    /**
     * @param array $modules
     *
     * @return array
     */
    public static function isLoaded($modules)
    {
        $modules[] = 'gcal2ways';

        return $modules;
    }

    /**
     * @param ChangeReservationDates | ChangeReservationService | ChangeReservationStatus | ChangeReservationLocation $command
     */
    public static function change_gcal_event(Command $command)
    {
        $options = self::_get_options();
        if (!empty($options[ self::ACCESS_TOKEN ]) && !empty($options[ self::LINKED_GCAL ])) {
            $client = self::_client();
            $client->setAccessToken($options[ self::ACCESS_TOKEN ]);
            $g_service   = new \Google_Service_Calendar($client);
            $reservation = tbkg()->reservations->all()[ $command->getUid() ];
            $service     = tbkg()->services->get($reservation->service_id());

            if ($command instanceof ChangeReservationLocation) {
                if ($reservation->getMeta('gcal_event_id')) {
                    $event = $g_service->events->get($options[ self::LINKED_GCAL ], $reservation->getMeta('gcal_event_id'));
                    if ($event instanceof \Google_Service_Calendar_Event) {
                        $event->setLocation(tbkg()->availability->locations()[ $command->getLocationId() ]['address']);
                        $g_service->events->update($options[ self::LINKED_GCAL ], $event->getId(), $event);
                    }
                }

            } elseif ($command instanceof ChangeReservationService) {
                if ($reservation->getMeta('gcal_event_id')) {
                    $event = $g_service->events->get($options[ self::LINKED_GCAL ], $reservation->getMeta('gcal_event_id'));
                    if ($event instanceof \Google_Service_Calendar_Event) {
                        $event->setSummary($service->name());
                        $g_service->events->update($options[ self::LINKED_GCAL ], $event->getId(), $event);
                    }
                }
            } elseif ($command instanceof ChangeReservationDates) {
                if ($reservation->getMeta('gcal_event_id')) {
                    $event = $g_service->events->get($options[ self::LINKED_GCAL ], $reservation->getMeta('gcal_event_id'));
                    if ($event instanceof \Google_Service_Calendar_Event) {
                        $start = new \Google_Service_Calendar_EventDateTime();
                        $start->setDateTime($reservation->start());
                        $event->setStart($start);
                        $end = new \Google_Service_Calendar_EventDateTime();
                        $end->setDateTime($reservation->end());
                        $event->setEnd($end);
                        $g_service->events->update($options[ self::LINKED_GCAL ], $event->getId(), $event);
                    }
                }
            } elseif ($command instanceof ChangeReservationStatus) {
                $summary = $service->name();
                switch ($reservation->status()->getValue()) {
                    case Status::CONFIRMED:
                        if ($reservation->getMeta('gcal_event_id')) {
                            $event = $g_service->events->get($options[ self::LINKED_GCAL ], $reservation->getMeta('gcal_event_id'));
                            if ($event instanceof \Google_Service_Calendar_Event) {
                                $event->setTransparency('opaque');
                                $event->setSummary($summary);
                                $g_service->events->update($options[ self::LINKED_GCAL ], $event->getId(), $event);
                            }
                        } else {
                            if ($options[ self::CREATE_EVENTS ] && empty($reservation->getMeta('gcal_event_id'))) {
                                self::_add_res_to_gcal($reservation);
                            }
                        }
                        break;
                    case Status::PENDING:
                        if ($reservation->getMeta('gcal_event_id')) {
                            $event = $g_service->events->get($options[ self::LINKED_GCAL ], $reservation->getMeta('gcal_event_id'));
                            if ($event instanceof \Google_Service_Calendar_Event) {
                                $event->setTransparency('opaque');
                                $summary .= ' (' . __('pending', 'thebooking') . ')';
                                $event->setSummary($summary);
                                $g_service->events->update($options[ self::LINKED_GCAL ], $event->getId(), $event);
                            }
                        } else {
                            if ($options[ self::CREATE_EVENTS ] && empty($reservation->getMeta('gcal_event_id'))) {
                                self::_add_res_to_gcal($reservation);
                            }
                        }
                        break;
                    case Status::CANCELLED:
                        if ($reservation->getMeta('gcal_event_id')) {
                            $event = $g_service->events->get($options[ self::LINKED_GCAL ], $reservation->getMeta('gcal_event_id'));
                            if ($event instanceof \Google_Service_Calendar_Event) {
                                if (isset($options[ self::DELETE_EVENTS_WHEN ]['cancelled']) && $options[ self::DELETE_EVENTS_WHEN ]['cancelled']) {
                                    $g_service->events->delete($options[ self::LINKED_GCAL ], $reservation->getMeta('gcal_event_id'));
                                    $reservation->dropMeta('gcal_event_id');
                                    tbkg()->reservations->sync_meta($reservation->id());
                                } else {
                                    $summary .= ' (' . __('cancelled', 'thebooking') . ')';
                                    $event->setTransparency('transparent');
                                    $event->setSummary($summary);
                                    $g_service->events->update($options[ self::LINKED_GCAL ], $event->getId(), $event);
                                }
                            }
                        }
                        break;
                    case Status::DECLINED:
                        if ($reservation->getMeta('gcal_event_id')) {
                            $event = $g_service->events->get($options[ self::LINKED_GCAL ], $reservation->getMeta('gcal_event_id'));
                            if ($event instanceof \Google_Service_Calendar_Event) {
                                if (isset($options[ self::DELETE_EVENTS_WHEN ]['declined']) && $options[ self::DELETE_EVENTS_WHEN ]['declined']) {
                                    $g_service->events->delete($options[ self::LINKED_GCAL ], $reservation->getMeta('gcal_event_id'));
                                    $reservation->dropMeta('gcal_event_id');
                                    tbkg()->reservations->sync_meta($reservation->id());
                                } else {
                                    $summary .= ' (' . __('declined', 'thebooking') . ')';
                                    $event->setTransparency('transparent');
                                    $event->setSummary($summary);
                                    $g_service->events->update($options[ self::LINKED_GCAL ], $event->getId(), $event);
                                }
                            }
                        }
                        break;
                    default:
                        break;
                }
            }
        }
    }

    public static function delete_reservation_from_gcal(DeleteReservation $command)
    {
        $options = self::_get_options();
        if (!empty($options[ self::ACCESS_TOKEN ])) {
            $client = self::_client();
            $client->setAccessToken($options[ self::ACCESS_TOKEN ]);
            $reservation = tbkg()->reservations->all()[ $command->getUid() ];
            if (!empty($options[ self::LINKED_GCAL ])) {
                $g_service = new \Google_Service_Calendar($client);
                if ($reservation->getMeta('gcal_event_id')) {
                    if (isset($options[ self::DELETE_EVENTS_WHEN ]['deleted']) && $options[ self::DELETE_EVENTS_WHEN ]['deleted']) {
                        try {
                            $g_service->events->delete($options[ self::LINKED_GCAL ], $reservation->getMeta('gcal_event_id'));
                        } catch (Exception $e) {
                            // Skipping
                        }
                    } else {
                        $event = $g_service->events->get($options[ self::LINKED_GCAL ], $reservation->getMeta('gcal_event_id'));
                        if ($event instanceof \Google_Service_Calendar_Event) {
                            $service = tbkg()->services->get($reservation->service_id());
                            $summary = $service->name() . ' (' . __('deleted', 'thebooking') . ')';
                            $event->setTransparency('transparent');
                            $event->setSummary($summary);
                            $g_service->events->update($options[ self::LINKED_GCAL ], $event->getId(), $event);
                        }
                    }
                }
            }
        }
    }

    private static function _add_res_to_gcal(Reservation $reservation)
    {
        $options = self::_get_options();
        $client  = self::_client();
        $client->setAccessToken($options[ self::ACCESS_TOKEN ]);
        $service   = tbkg()->services->get($reservation->service_id());
        $g_service = new \Google_Service_Calendar($client);
        $summary   = $service->name();
        if ($reservation->status()->getValue() === Status::PENDING) {
            $summary .= ' (' . __('pending', 'thebooking') . ')';
        }
        $event = new \Google_Service_Calendar_Event([
            'summary' => apply_filters('tbk_gcal2ways_event_summary', $summary, $reservation),
            'start'   => [
                'dateTime' => $reservation->start()
            ],
            'end'     => [
                'dateTime' => $reservation->end()
            ],
        ]);

        if ($reservation->getMeta('location')) {
            $event->setLocation(tbkg()->availability->locations()[ $reservation->getMeta('location') ]['address']);
        }

        $event = $g_service->events->insert($options[ self::LINKED_GCAL ], $event);
        $reservation->addMeta('gcal_event_id', $event->getId());
        tbkg()->reservations->sync_meta($reservation->id());
    }

    public static function add_reservation_to_gcal(CreateReservation $command)
    {
        $options = self::_get_options();
        if ($options[ self::CREATE_EVENTS ] && !empty($options[ self::ACCESS_TOKEN ])) {
            $reservation = tbkg()->reservations->all()[ $command->getUid() ];
            if (!empty($options[ self::LINKED_GCAL ])) {
                self::_add_res_to_gcal($reservation);
            }
        }
    }

    public static function backend_busy_intervals($intervals)
    {
        $now     = new DateTimeTbk();
        $options = self::_get_options();
        if (!empty($options[ self::LINKED_GCAL ]) && !empty($options[ self::ACCESS_TOKEN ]) && $options[ self::BLOCK_AVAILABILITY ]) {
            return array_merge($intervals, self::_getFreeBusy($now->format(\DateTime::RFC3339)));
        }

        return $intervals;
    }

    public static function frontend_busy_intervals($intervals, $shortcode_attrs)
    {
        $now     = new DateTimeTbk();
        $options = self::_get_options();
        if (!empty($options[ self::LINKED_GCAL ]) && !empty($options[ self::ACCESS_TOKEN ]) && $options[ self::BLOCK_AVAILABILITY ]) {
            return array_merge($intervals, self::_getFreeBusy($now->format(\DateTime::RFC3339)));
        }

        return $intervals;
    }

    private static function _getFreeBusy($date_rfc)
    {
        $options   = self::_get_options();
        $intervals = [];
        if (!empty($options[ self::ACCESS_TOKEN ])) {
            $client = self::_client();
            $client->setAccessToken($options[ self::ACCESS_TOKEN ]);
            $service = new \Google_Service_Calendar($client);
            if (!empty($options[ self::LINKED_GCAL ])) {
                $min      = DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $date_rfc);
                $freebusy = new \Google_Service_Calendar_FreeBusyRequest();
                $freebusy->setTimeMin($min->format(\DateTime::RFC3339));
                $freebusy->setTimeMax($min->add(new \DateInterval('P1M'))->format(\DateTime::RFC3339));
                $fbitem = new \Google_Service_Calendar_FreeBusyRequestItem();
                $fbitem->setId($options[ self::LINKED_GCAL ]);
                $freebusy->setItems([$fbitem]);
                $items = $service->freebusy->query($freebusy)->getCalendars()[ $options[ self::LINKED_GCAL ] ]->getBusy();
                foreach ($items as $item) {
                    $intervals[] = [
                        'start' => $item->getStart(),
                        'end'   => $item->getEnd()
                    ];
                }
            }
        }

        return $intervals;
    }

    public static function getFreeBusy(\WP_REST_Request $request)
    {
        $response = [
            'busyIntervals' => self::_getFreeBusy($request->get_param('targetDate'))
        ];

        return apply_filters('tbk_google_2way_get_freebusy_response', new \WP_REST_Response($response, 200));
    }

    public static function backend_middleware($middleware)
    {
        $options = self::_get_options();
        if (!empty($options[ self::LINKED_GCAL ]) && !empty($options[ self::ACCESS_TOKEN ]) && $options[ self::BLOCK_AVAILABILITY ]) {
            $middleware['reschedulerChangeMonth'][] = [
                'type'     => 'async',
                'endpoint' => '/google/getfreebusy/'
            ];
        }

        return $middleware;
    }

    public static function frontend_middleware($middleware, $shortcode_attrs)
    {
        $options = self::_get_options();
        if (!empty($options[ self::LINKED_GCAL ]) && !empty($options[ self::ACCESS_TOKEN ]) && $options[ self::BLOCK_AVAILABILITY ]) {
            $middleware['changeMonth'][] = [
                'type'     => 'async',
                'endpoint' => '/google/getfreebusy/'
            ];
        }

        return $middleware;
    }

    private static function _get_options()
    {
        $defaults = [
            self::CLIENT_ID          => '',
            self::CLIENT_SECRET      => '',
            self::APP_NAME           => '',
            self::ACCESS_TOKEN       => '',
            self::LINKED_GCAL        => NULL,
            self::CREATE_EVENTS      => FALSE,
            self::BLOCK_AVAILABILITY => TRUE,
            self::DELETE_EVENTS_WHEN => [
                'deleted' => TRUE
            ],
        ];

        return get_option(self::OPTIONS_TAG, $defaults) + $defaults;
    }

    public static function revokeCallback(\WP_REST_Request $request)
    {
        $options = self::_get_options();
        $client  = self::_client();
        $client->setAccessToken($options[ self::ACCESS_TOKEN ]);
        if ($client->revokeToken()) {
            $options[ self::ACCESS_TOKEN ] = '';
            update_option(self::OPTIONS_TAG, $options);
        }
        $response = [
            'settings' => [
                self::ACCESS_TOKEN => ''
            ]
        ];

        return apply_filters('tbk_google_2way_revoke_response', new \WP_REST_Response($response, 200));
    }

    public static function oAuthCallback(\WP_REST_Request $request)
    {
        $code  = $request->get_param('code');
        $state = json_decode(urldecode($request->get_param('state')), TRUE);

        add_filter('nonce_user_logged_out', static function ($uid, $action) use ($state) {
            if ($action === 'tbkg_google2ways_oauth') {
                return $state['user'];
            }

            return $uid;
        }, 10, 2);
        if (!wp_verify_nonce($state['nonce'], 'tbkg_google2ways_oauth')) {
            return new REST_Error_Unauthorized();
        }
        if ($code) {
            $client = self::_client();
            $client->fetchAccessTokenWithAuthCode($code);
            $options                       = self::_get_options();
            $options[ self::ACCESS_TOKEN ] = $client->getAccessToken();
            update_option(self::OPTIONS_TAG, $options);
        }
        wp_redirect(add_query_arg('page', 'thebooking-core#section-gcal2ways', admin_url('admin.php')));
        exit;
    }

    public function cleanup()
    {
        delete_option(self::OPTIONS_TAG);
    }

    public static function settings($settings)
    {
        $options = self::_get_options();

        $settings[ self::CLIENT_ID ]          = $options[ self::CLIENT_ID ];
        $settings[ self::CLIENT_SECRET ]      = $options[ self::CLIENT_SECRET ];
        $settings[ self::APP_NAME ]           = $options[ self::APP_NAME ];
        $settings[ self::ACCESS_TOKEN ]       = $options[ self::ACCESS_TOKEN ];
        $settings[ self::LINKED_GCAL ]        = $options[ self::LINKED_GCAL ];
        $settings[ self::CREATE_EVENTS ]      = $options[ self::CREATE_EVENTS ];
        $settings[ self::BLOCK_AVAILABILITY ] = $options[ self::BLOCK_AVAILABILITY ];
        $settings[ self::DELETE_EVENTS_WHEN ] = $options[ self::DELETE_EVENTS_WHEN ];

        return $settings;
    }

    public static function save_setting_callback($settingId, $value)
    {
        $options = self::_get_options();

        switch ($settingId) {
            case self::CLIENT_ID:
                $options[ self::CLIENT_ID ] = trim($value);
                break;
            case self::CLIENT_SECRET:
                $options[ self::CLIENT_SECRET ] = trim($value);
                break;
            case self::APP_NAME:
                $options[ self::APP_NAME ] = trim($value);
                break;
            case self::LINKED_GCAL:
                $options[ self::LINKED_GCAL ] = trim($value) ?: NULL;
                break;
            case self::BLOCK_AVAILABILITY:
                $options[ self::BLOCK_AVAILABILITY ] = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                break;
            case self::CREATE_EVENTS:
                $options[ self::CREATE_EVENTS ] = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                break;
            case self::DELETE_EVENTS_WHEN:
                $options[ self::DELETE_EVENTS_WHEN ] = $value;
                break;
            default:
                break;
        }

        update_option(self::OPTIONS_TAG, $options);
    }

    private static function _client()
    {
        $options = self::_get_options();
        $client  = new \Google_Client();
        $client->setClientId($options[ self::CLIENT_ID ]);
        $client->setClientSecret($options[ self::CLIENT_SECRET ]);
        $client->setApplicationName($options[ self::APP_NAME ]);
        $client->setRedirectUri(REST_Controller::get_root_rest_url() . '/google/oauth');
        $client->addScope(\Google_Service_Calendar::CALENDAR);
        $client->setAccessType('offline');

        return $client;
    }

    public static function settingsPanel($panels)
    {
        $client = self::_client();
        $state  = [
            'nonce' => wp_create_nonce('tbkg_google2ways_oauth'),
            'user'  => get_current_user_id()
        ];
        $client->setState(urlencode(json_encode($state)));
        $auth_url = $client->createAuthUrl();

        $options = self::_get_options();

        $calendarOptions = [];
        if (!empty($options[ self::ACCESS_TOKEN ])) {
            $client->setAccessToken($options[ self::ACCESS_TOKEN ]);
            $service   = new \Google_Service_Calendar($client);
            $calendars = $service->calendarList->listCalendarList();
            $colors    = $service->colors->get()->getCalendar();

            foreach ($calendars->getItems() as $item) {
                $calendarOptions[] = [
                    'label'       => $item->getSummary(),
                    'value'       => $item->getId(),
                    'avatarColor' => $colors[ $item->getColorId() ]->getBackground(),
                    'description' => $item->getAccessRole()
                ];
            }

            /*if (!empty($options[ self::LINKED_GCAL ])) {
                $now       = new DateTimeTbk();
                $optParams = [
                    'timeMin' => $now->format(\DateTime::RFC3339)
                ];
                $events    = $service->events->listEvents($options[ self::LINKED_GCAL ], $optParams);
                while (TRUE) {
                    foreach ($events->getItems() as $event) {
                        echo $event->getSummary();
                    }
                    $pageToken = $events->getNextPageToken();
                    if ($pageToken) {
                        $optParams['pageToken'] = $pageToken;
                        $events                 = $service->events->listEvents($options[ self::LINKED_GCAL ], $optParams);
                    } else {
                        break;
                    }
                }
            }*/
        }

        $panels[] = [
            'panelRef'   => 'section-gcal2ways',
            'panelLabel' => __('Google Calendar', 'thebooking'),
            'blocks'     => [
                [
                    'title'       => __('Google API configuration', 'thebooking'),
                    'description' => __('Provide the parameters required to operate with Google API.', 'thebooking') . ' ' .
                        __('In order to know how to obtain those parameters please refer to the documentation.', 'thebooking'),
                    'components'  => [
                        [
                            'type'      => 'text',
                            'settingId' => self::CLIENT_ID,
                            'label'     => __('Client ID', 'thebooking'),
                        ],
                        [
                            'type'      => 'text',
                            'settingId' => self::CLIENT_SECRET,
                            'label'     => __('Client Secret', 'thebooking'),
                        ],
                        [
                            'type'      => 'text',
                            'settingId' => self::APP_NAME,
                            'label'     => __('Application Name', 'thebooking'),
                        ],
                        [
                            'type' => 'notice',
                            'text' => sprintf(__('Authorized Redirect URI: %s', 'thebooking'), REST_Controller::get_root_rest_url() . '/google/oauth')
                        ],
                        [
                            'type' => 'notice',
                            'text' => sprintf(__('Authorized JavaScript Origin: %s', 'thebooking'), get_site_url())
                        ],
                        [
                            'type'         => 'button',
                            'intent'       => 'success',
                            'label'        => __('Connect your Google Account', 'thebooking'),
                            'href'         => $auth_url,
                            'dependencies' => [
                                [
                                    'on'    => self::CLIENT_SECRET,
                                    'being' => 'NOT_EMPTY'
                                ],
                                [
                                    'on'    => self::CLIENT_ID,
                                    'being' => 'NOT_EMPTY'
                                ],
                                [
                                    'on'    => self::APP_NAME,
                                    'being' => 'NOT_EMPTY'
                                ],
                                [
                                    'on'    => self::ACCESS_TOKEN,
                                    'being' => 'EMPTY'
                                ]
                            ]
                        ],
                        [
                            'type'         => 'button',
                            'intent'       => 'danger',
                            'label'        => __('Disconnect your Google Account', 'thebooking'),
                            'post'         => '/google/revoke/',
                            'dependencies' => [
                                [
                                    'on'    => self::CLIENT_SECRET,
                                    'being' => 'NOT_EMPTY'
                                ],
                                [
                                    'on'    => self::CLIENT_ID,
                                    'being' => 'NOT_EMPTY'
                                ],
                                [
                                    'on'    => self::APP_NAME,
                                    'being' => 'NOT_EMPTY'
                                ],
                                [
                                    'on'    => self::ACCESS_TOKEN,
                                    'being' => 'NOT_EMPTY'
                                ]
                            ]
                        ],
                    ]
                ],
                [
                    'title'        => __('Linked Google Calendar', 'thebooking'),
                    'description'  => __('Select a Google Calendar to sync with the plugin.', 'thebooking'),
                    'components'   => [
                        [
                            'type'        => 'select',
                            'options'     => $calendarOptions,
                            'settingId'   => self::LINKED_GCAL,
                            'showClear'   => TRUE,
                            'placeholder' => __('Select a Google Calendar', 'thebooking')
                        ]
                    ],
                    'dependencies' => [
                        [
                            'on'    => self::ACCESS_TOKEN,
                            'being' => 'NOT_EMPTY'
                        ]
                    ]
                ],
                [
                    'title'        => __('Block availability when busy', 'thebooking'),
                    'description'  => __('Turn this setting on if you want your events in Google Calendar to block availability of the services.', 'thebooking'),
                    'components'   => [
                        [
                            'settingId' => self::BLOCK_AVAILABILITY,
                            'type'      => 'toggle',
                        ],
                        [
                            'type' => 'notice',
                            'text' => __('The BUSY/FREE property of a Google Calendar event will determine whether it blocks availability or not.')
                        ],
                    ],
                    'dependencies' => [
                        [
                            'on'    => self::LINKED_GCAL,
                            'being' => 'NOT_EMPTY'
                        ]
                    ]
                ],
                [
                    'title'        => __('Add reservations to the calendar', 'thebooking'),
                    'description'  => __('Turn this setting on if you want a reservation to be added to your Google Calendar.', 'thebooking'),
                    'components'   => [
                        [
                            'settingId' => self::CREATE_EVENTS,
                            'type'      => 'toggle',
                        ]
                    ],
                    'dependencies' => [
                        [
                            'on'    => self::LINKED_GCAL,
                            'being' => 'NOT_EMPTY'
                        ]
                    ]
                ],
                [
                    'title'        => __('When to delete Google Calendar reservation events', 'thebooking'),
                    'description'  => __('Select the reservation statuses for which you want the event in Google Calendar to be deleted.', 'thebooking') . ' '
                        . __('If the event is preserved, the reservation status is appended to the event summary.', 'thebooking'),
                    'components'   => [
                        [
                            'settingId' => self::DELETE_EVENTS_WHEN,
                            'type'      => 'checkboxes',
                            'options'   => [
                                [
                                    'label' => __('Deleted', 'thebooking'),
                                    'value' => 'deleted'
                                ],
                                [
                                    'label' => __('Cancelled', 'thebooking'),
                                    'value' => 'cancelled'
                                ],
                                [
                                    'label' => __('Declined', 'thebooking'),
                                    'value' => 'declined'
                                ]
                            ]
                        ],
                        [
                            'type'   => 'notice',
                            'intent' => 'warning',
                            'text'   => __('If you write down additional data to the Google Calendar reservation events keep in mind that data will be lost if the event is deleted.', 'thebooking')
                        ]
                    ],
                    'dependencies' => [
                        [
                            'on'    => self::CREATE_EVENTS,
                            'being' => '=',
                            'to'    => TRUE
                        ],
                        [
                            'on'    => self::LINKED_GCAL,
                            'being' => 'NOT_EMPTY'
                        ]
                    ]
                ]
            ]
        ];

        return $panels;
    }
}