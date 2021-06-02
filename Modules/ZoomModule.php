<?php

namespace TheBooking\Modules;

use TheBooking\Bus\Commands\ChangeReservationCustomer;
use TheBooking\Bus\Commands\ChangeReservationDates;
use TheBooking\Bus\Commands\ChangeReservationService;
use TheBooking\Bus\Commands\ChangeReservationStatus;
use TheBooking\Bus\Commands\CreateReservation;
use TheBooking\Bus\Commands\DeleteReservation;
use TheBooking\Classes\DateTimeTbk;
use TheBooking\Classes\Reservation;
use TheBooking\Classes\ValueTypes\Status;
use VSHM_Framework\REST_Controller;
use VSHM_Framework\Tools;

defined('ABSPATH') || exit;

/**
 * Class ZoomModule
 *
 * Integrates https://github.com/skwirrel/ZoomAPIWrapper
 * Copyright (c) 2020 Ben Jefferson
 *
 * @package TheBooking
 * @author  VonStroheim
 */
final class ZoomModule
{
    const OPTIONS_TAG = 'tbkg_zoom';

    const API_KEY    = 'zoom_apiKey';
    const API_SECRET = 'zoom_apiSecret';

    const SRV_IS_VIRTUAL       = 'isVirtual';
    const META_ZOOM_MEETING_ID = 'zoomMeetingId';

    public static function bootstrap()
    {
        $options = self::_get_options();

        REST_Controller::register_routes([
            '/reservation/getmeetinglink' => [
                'methods'  => \WP_REST_Server::READABLE,
                'callback' => [self::class, 'getMeetingLinkCallback'],
                'args'     => [
                    'userHash'      => [
                        'required' => TRUE
                    ],
                    'reservationId' => [
                        'required' => TRUE
                    ],
                ]
            ],
        ]);

        tbkg()->loader->add_filter('tbk_backend_core_settings_panels', self::class, 'settingsPanel');
        tbkg()->loader->add_filter('tbk_backend_settings', self::class, 'settings');
        tbkg()->loader->add_action('tbk-backend-settings-save-single', self::class, 'save_setting_callback', 10, 2);
        tbkg()->loader->add_action('tbk_clean_uninstall', self::class, 'cleanup');
        tbkg()->loader->add_filter('tbk_loaded_modules', self::class, 'isLoaded');
        tbkg()->loader->add_action('tbk_save_service_settings', self::class, 'save_service_settings', 10, 3);
        tbkg()->loader->add_filter('tbk_reservation_as_array_mapping', self::class, 'meta_mapping', 10, 2);
        tbkg()->loader->add_filter('tbk_reservation_frontend_map', self::class, 'meta_mapping_frontend', 10, 2);

        if ($options[ self::API_KEY ] && $options[ self::API_SECRET ]) {
            // Priority is 1 because it must run before any notifications
            tbkg()->loader->add_action('tbk_dispatched_CreateReservation', self::class, 'create_meeting_after_booking', 1, 2);
            tbkg()->loader->add_action('tbk_dispatching_DeleteReservation', self::class, 'delete_meeting_after_removing_res');
            tbkg()->loader->add_action('tbk_dispatched_ChangeReservationStatus', self::class, 'change_reservation_status_callback');
            tbkg()->loader->add_action('tbk_dispatched_ChangeReservationService', self::class, 'change_reservation_service_callback');
            tbkg()->loader->add_action('tbk_dispatched_ChangeReservationCustomer', self::class, 'change_reservation_customer_callback');
            tbkg()->loader->add_action('tbk_dispatched_ChangeReservationDates', self::class, 'change_reservation_dates_callback');
            tbkg()->loader->add_filter('tbk_notification_templates', self::class, 'notificationTemplates', 10, 3);
            tbkg()->loader->add_filter('tbk_notification_template_hooks', self::class, 'notificationTemplateHooks', 10, 2);
        }

    }

    /**
     * @param \WP_REST_Request $request
     *
     * @return mixed|void
     */
    public static function getMeetingLinkCallback(\WP_REST_Request $request)
    {
        $reservation = tbkg()->reservations->all()[ $request->get_param('reservationId') ];
        $response    = [];
        if ($reservation && $reservation->getMeta(self::META_ZOOM_MEETING_ID)) {
            $customer = tbkg()->customers->get($reservation->customer_id());
            if (md5($customer->access_token()) === $request->get_param('userHash')) {
                $meeting = self::getMeeting($reservation->getMeta(self::META_ZOOM_MEETING_ID));
                if ($meeting && isset($meeting['join_url'])) {
                    $response['link'] = $meeting['join_url'];
                }
            }
        }

        return apply_filters('tbk_getmeetinglink_response', new \WP_REST_Response($response, 200));
    }

    /**
     * @param ChangeReservationDates $command
     */
    public static function change_reservation_dates_callback(ChangeReservationDates $command)
    {
        $reservation = tbkg()->reservations->all()[ $command->getUid() ];
        $service     = tbkg()->services->get($reservation->service_id());
        if ($service->getMeta(self::SRV_IS_VIRTUAL) && $reservation->getMeta(self::META_ZOOM_MEETING_ID)) {
            $startDate = DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->start());
            $startDate->setTimezone(new \DateTimeZone('UTC'));
            $endDate = DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->end());
            $endDate->setTimezone(new \DateTimeZone('UTC'));
            self::updateMeeting($reservation->getMeta(self::META_ZOOM_MEETING_ID), [
                'start_time' => $startDate->format('Y-m-d\TH:i:s\Z'),
                'duration'   => round(($endDate->getTimestamp() - $startDate->getTimestamp()) / 60),
            ]);
        }
    }

    /**
     * @param ChangeReservationCustomer $command
     */
    public static function change_reservation_customer_callback(ChangeReservationCustomer $command)
    {
        $reservation = tbkg()->reservations->all()[ $command->getUid() ];
        $service     = tbkg()->services->get($reservation->service_id());
        if ($service->getMeta(self::SRV_IS_VIRTUAL) && $reservation->getMeta(self::META_ZOOM_MEETING_ID)) {
            $customer = tbkg()->customers->get($reservation->customer_id());
            self::updateMeeting($reservation->getMeta(self::META_ZOOM_MEETING_ID), [
                'agenda' => sprintf(__('Meeting with %s', 'thebooking'), $customer->name()),
            ]);
        }
    }

    /**
     * Reacting to reservation service change
     *
     * @param ChangeReservationService $command
     */
    public static function change_reservation_service_callback(ChangeReservationService $command)
    {
        $reservation = tbkg()->reservations->all()[ $command->getUid() ];
        $service     = tbkg()->services->get($command->getServiceId());
        if ($reservation->getMeta(self::META_ZOOM_MEETING_ID)) {
            self::deleteMeeting($reservation->getMeta(self::META_ZOOM_MEETING_ID));
            $reservation->dropMeta(self::META_ZOOM_MEETING_ID);
            tbkg()->reservations->sync_meta($command->getUid());
        }
        if ($service->getMeta(self::SRV_IS_VIRTUAL)) {
            self::createMeeting($reservation);
            tbkg()->reservations->sync_meta($command->getUid());
        }
    }

    /**
     * Reacting to reservation status change
     *
     * @param ChangeReservationStatus $command
     */
    public static function change_reservation_status_callback(ChangeReservationStatus $command)
    {
        $reservation = tbkg()->reservations->all()[ $command->getUid() ];
        $service     = tbkg()->services->get($reservation->service_id());
        switch ($reservation->status()->getValue()) {
            case Status::PENDING:
            case Status::CONFIRMED:
                if ($service->getMeta(self::SRV_IS_VIRTUAL) && !$reservation->getMeta(self::META_ZOOM_MEETING_ID)) {
                    self::createMeeting($reservation);
                    tbkg()->reservations->sync_meta($command->getUid());
                }
                break;
            case Status::CANCELLED:
            case Status::DECLINED:
                if ($reservation->getMeta(self::META_ZOOM_MEETING_ID)) {
                    self::deleteMeeting($reservation->getMeta(self::META_ZOOM_MEETING_ID));
                    $reservation->dropMeta(self::META_ZOOM_MEETING_ID);
                    tbkg()->reservations->sync_meta($command->getUid());
                }
                break;
            default:
                break;
        }
    }

    /**
     * This is necessary to convey complete meeting data to the frontend (admin area)
     *
     * @param array  $mapped
     * @param string $reservation_id
     *
     * @return array
     */
    public static function meta_mapping($mapped, $reservation_id)
    {
        if (isset($mapped['meta'][ self::META_ZOOM_MEETING_ID ])) {
            $mappedMeeting = [
                'id' => $mapped['meta'][ self::META_ZOOM_MEETING_ID ]
            ];

            $options = self::_get_options();

            if ($options[ self::API_KEY ] && $options[ self::API_SECRET ]) {
                $meeting = self::getMeeting($mapped['meta'][ self::META_ZOOM_MEETING_ID ]);

                if (isset($meeting['join_url'])) {
                    $mappedMeeting['join_url'] = $meeting['join_url'];
                }
                if (isset($meeting['start_url'])) {
                    $mappedMeeting['start_url'] = $meeting['start_url'];
                }
                if (isset($meeting['password'])) {
                    $mappedMeeting['password'] = $meeting['password'];
                }
                if (isset($meeting['status'])) {
                    $mappedMeeting['status'] = $meeting['status']; //"waiting" or "started"
                }
            }

            $mapped['meta'][ self::META_ZOOM_MEETING_ID ] = $mappedMeeting;
        }

        return $mapped;
    }

    /**
     * This is necessary to convey meeting data to the frontend (widgets)
     *
     * @param array  $mapped
     * @param string $reservationId
     *
     * @return array
     */
    public static function meta_mapping_frontend($mapped, $reservationId)
    {
        $res = tbkg()->reservations->all()[ $reservationId ];
        if ($res instanceof Reservation) {
            if ($res->getMeta(self::META_ZOOM_MEETING_ID)) {
                $mapped['meta']['zoomMeetingId'] = $res->getMeta(self::META_ZOOM_MEETING_ID);
            }
        }

        return $mapped;
    }

    /**
     * A meeting should be deleted when a reservation is removed/declined/cancelled
     *
     * @param DeleteReservation $command
     */
    public static function delete_meeting_after_removing_res(DeleteReservation $command)
    {
        $reservation = tbkg()->reservations->all()[ $command->getUid() ];
        if ($reservation->getMeta(self::META_ZOOM_MEETING_ID)) {
            self::deleteMeeting($reservation->getMeta(self::META_ZOOM_MEETING_ID));
        }
    }

    /**
     * A meeting should be created when a reservation is booked/confirmed/approved
     *
     * @param CreateReservation $command
     */
    public static function create_meeting_after_booking(CreateReservation $command)
    {
        $reservation = tbkg()->reservations->all()[ $command->getUid() ];
        self::createMeeting($reservation);
        tbkg()->reservations->sync_meta($command->getUid());
    }

    public static function notificationTemplates($preparedValues, $reservation_id, $notificationType)
    {
        $reservation = tbkg()->reservations->all()[ $reservation_id ];
        $service     = tbkg()->services->get($reservation->service_id());

        if ($service->getMeta(self::SRV_IS_VIRTUAL) && $reservation->getMeta(self::META_ZOOM_MEETING_ID)) {

            $meeting = self::getMeeting($reservation->getMeta(self::META_ZOOM_MEETING_ID));

            if ($meeting && isset($meeting['join_url'])) {
                $preparedValues['reservation::meetingJoinLink'] = $meeting['join_url'];
            }


        }

        return $preparedValues;
    }

    public static function notificationTemplateHooks($hooks, $notificationType)
    {
        $hooks[] = [
            'value'        => 'reservation::meetingJoinLink',
            'label'        => __('Zoom meeting link', 'thebooking'),
            'context'      => 'reservation',
            'contextLabel' => __('Reservation', 'thebooking')
        ];

        return $hooks;
    }

    public static function save_service_settings($settingId, $value, $serviceId)
    {
        $service = tbkg()->services->get($serviceId);

        if ($settingId === 'meta::' . self::SRV_IS_VIRTUAL) {
            $service->addMeta(self::SRV_IS_VIRTUAL, filter_var($value, FILTER_VALIDATE_BOOLEAN));
        }
    }

    /**
     * @param array $modules
     *
     * @return array
     */
    public static function isLoaded($modules)
    {
        $modules[] = 'zoom';

        return $modules;
    }

    public static function settings($settings)
    {
        $options = self::_get_options();

        $settings[ self::API_KEY ]    = $options[ self::API_KEY ];
        $settings[ self::API_SECRET ] = $options[ self::API_SECRET ];

        return $settings;
    }

    public static function save_setting_callback($settingId, $value)
    {
        $options = self::_get_options();

        switch ($settingId) {
            case self::API_KEY:
                $options[ self::API_KEY ] = trim($value);
                break;
            case self::API_SECRET:
                $options[ self::API_SECRET ] = trim($value);
                break;
            default:
                break;
        }

        update_option(self::OPTIONS_TAG, $options);
    }

    public static function settingsPanel($panels)
    {
        $panels[] = [
            'panelRef'   => 'section-zoom',
            'panelLabel' => __('Zoom meetings', 'thebooking'),
            'blocks'     => [
                [
                    'title'       => __('API configuration', 'thebooking'),
                    'description' => __('Once API keys are provided, a new meeting panel will appear inside the service settings.', 'thebooking'),
                    'components'  => [
                        [
                            'type'      => 'text',
                            'settingId' => self::API_KEY,
                            'label'     => __('API key', 'thebooking'),
                        ],
                        [
                            'type'      => 'text',
                            'settingId' => self::API_SECRET,
                            'label'     => __('API Secret', 'thebooking'),
                        ],
                        [
                            'type' => 'notice',
                            'text' => __('How to get your API keys? You need to go to the Zoom "App Marketplace", log in using your zoom account and then select "Build App" from the "Develop" dropdown menu. Then you need to choose the JWT option for "server-to-server integration". Once you will out some basic information you will be taken to the "App Credentials" page which will give you your API key and API secret.', 'thebooking')
                        ]
                    ]
                ]
            ]
        ];

        return $panels;
    }

    public static function deleteMeeting($id)
    {
        $zoom     = self::getZoom();
        $response = $zoom->doRequest('DELETE', '/meetings/{meetingId}', [], ['meetingId' => $id]);

        if ($response === FALSE) {
            error_log("Errors:" . implode("\n", $zoom->requestErrors()));
        }

        return $response;
    }

    public static function updateMeeting($meetingId, $updated = [])
    {
        $zoom     = self::getZoom();
        $response = $zoom->doRequest('PATCH', '/meetings/{meetingId}', [], ['meetingId' => $meetingId], json_encode($updated, JSON_FORCE_OBJECT));
        if ($response === FALSE) {
            error_log("Errors:" . implode("\n", $zoom->requestErrors()));
        }
        if ($zoom->responseCode() !== 204) {
            error_log("Errors:" . implode("\n", $response['message']));
        }
    }

    public static function createMeeting(Reservation $reservation)
    {
        $service = tbkg()->services->get($reservation->service_id());

        if ($service->getMeta(self::SRV_IS_VIRTUAL)) {

            $customer = tbkg()->customers->get($reservation->customer_id());

            $startDate = DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->start());
            $startDate->setTimezone(new \DateTimeZone('UTC'));
            $endDate = DateTimeTbk::createFromFormatSilently(\DateTime::RFC3339, $reservation->end());
            $endDate->setTimezone(new \DateTimeZone('UTC'));

            $zoom = self::getZoom();

            // Gathering password requirements...

            $response = $zoom->doRequest('GET', '/users/me/settings', ['option' => 'meeting_security']);

            if ($zoom->responseCode() !== 200) {
                ob_start();
                var_dump($response);
                error_log(ob_get_clean());

                return;
            }

            $pwd_req  = $response['meeting_security']['meeting_password_requirement'];
            $pwd_type = 'alnum';
            $pwd_len  = 10;
            if ($pwd_req['length']) {
                $pwd_len = (int)$pwd_req['length'];
            }
            if ($pwd_req['only_allow_numeric']) {
                $pwd_type = 'numeric';
            }
            if ($pwd_req['have_special_character']) {
                $pwd_len--;
            }
            if ($pwd_req['have_upper_and_lower_characters']) {
                $pwd_len -= 2;
            }
            $pwd = Tools::generate_token($pwd_type, $pwd_len);
            if ($pwd_req['have_special_character']) {
                $pwd .= '@';
            }
            if ($pwd_req['have_upper_and_lower_characters']) {
                $pwd .= 'zZ';
            }

            $meeting = [
                'topic'      => $service->name(),
                'type'       => 2,
                'start_time' => $startDate->format('Y-m-d\TH:i:s\Z'),
                'duration'   => round(($endDate->getTimestamp() - $startDate->getTimestamp()) / 60),
                'timezone'   => $customer->timezone(),
                'password'   => $pwd,
                'agenda'     => sprintf(__('Meeting with %s', 'thebooking'), $customer->name()),
                'settings'   => [

                ]
            ];

            $response = $zoom->doRequest('POST', '/users/me/meetings', [], [], json_encode($meeting, JSON_FORCE_OBJECT));
            if ($response === FALSE) {
                error_log("Errors:" . implode("\n", $zoom->requestErrors()));
            }

            if ($zoom->responseCode() !== 201) {
                ob_start();
                var_dump($response);
                error_log(ob_get_clean());
            } else {
                if (isset($response['id'])) {
                    $reservation->addMeta(self::META_ZOOM_MEETING_ID, $response['id']);
                }
            }
        }
    }

    public static function getMeeting($id)
    {
        $zoom = self::getZoom();

        $response = $zoom->doRequest('GET', '/meetings/{meetingId}', [], ['meetingId' => $id]);

        if ($response === FALSE) {
            error_log("Errors:" . implode("\n", $zoom->requestErrors()));
        }

        return $response;
    }

    public static function getMeetings()
    {
        $zoom = self::getZoom();

        $response = $zoom->doRequest('GET', '/users/me/meetings');
        if ($response === FALSE) {
            error_log("Errors:" . implode("\n", $zoom->requestErrors()));
        }

        return $response;
    }

    /**
     * @return ZoomAPIWrapper
     */
    public static function getZoom()
    {
        $options = self::_get_options();

        return new ZoomAPIWrapper($options[ self::API_KEY ], $options[ self::API_SECRET ]);
    }

    private static function _get_options()
    {
        $defaults = [
            self::API_KEY    => '',
            self::API_SECRET => ''
        ];

        return get_option(self::OPTIONS_TAG, $defaults) + $defaults;
    }

    public function cleanup()
    {
        delete_option(self::OPTIONS_TAG);
    }

}


/*
==============================================================================
MIT License

Copyright (c) 2020 Ben Jefferson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
==============================================================================

This is a simple wrapper class to handle authenticating requests to the Zoom APIs

Usage:

$zoom = new ZoomAPIWrapper( '<your API key>', '<your API secret>' );

// It is up to you to use the right method, path and specify the path parameters
// to match the {placeholders} in the path.
// You can find all the details of method, path, placholders and body content in the Zoom
// API reference docs here: https://marketplace.zoom.us/docs/api-reference/zoom-api
// $queryParameters,$requestParameters,$bodyContent are all optional

$response = $zoom->doRequest($method,$path,$queryParameters,$requestParameters,$bodyContent);

if ($response === false) {
    // There was an error before the request was event sent to the api
    echo "Errors:".implode("\n",$zoom->requestErrors())
} esle {
    printf("Response code: %d\n",$zoom->responseCode());
    print_r($response);
}

*/

class ZoomAPIWrapper
{
    private $errors;
    private $apiKey;
    private $apiSecret;
    private $baseUrl;
    private $timeout;

    public function __construct($apiKey, $apiSecret, $options = array())
    {
        $this->apiKey = $apiKey;

        $this->apiSecret = $apiSecret;

        $this->baseUrl = 'https://api.zoom.us/v2';
        $this->timeout = 30;

        // Store any options if they map to valid properties
        foreach ($options as $key => $value) {
            if (property_exists($this, $key)) $this->$key = $value;
        }
    }

    public static function urlsafeB64Encode($string)
    {
        return str_replace('=', '', strtr(base64_encode($string), '+/', '-_'));
    }

    private function generateJWT()
    {
        $token  = array(
            'iss' => $this->apiKey,
            'exp' => time() + 60,
        );
        $header = array(
            'typ' => 'JWT',
            'alg' => 'HS256',
        );

        $toSign =
            self::urlsafeB64Encode(json_encode($header))
            . '.' .
            self::urlsafeB64Encode(json_encode($token));

        $signature = hash_hmac('SHA256', $toSign, $this->apiSecret, TRUE);

        return $toSign . '.' . self::urlsafeB64Encode($signature);
    }

    private function headers()
    {
        return array(
            'Authorization: Bearer ' . $this->generateJWT(),
            'Content-Type: application/json',
            'Accept: application/json',
        );
    }

    private function pathReplace($path, $requestParams)
    {
        $errors = array();
        $path   = preg_replace_callback('/\\{(.*?)\\}/', static function ($matches) use ($requestParams, &$errors) {
            if (!isset($requestParams[ $matches[1] ])) {
                $errors[] = 'Required path parameter was not specified: ' . $matches[1];

                return '';
            }

            return rawurlencode($requestParams[ $matches[1] ]);
        }, $path);

        if (count($errors)) $this->errors = array_merge($this->errors, $errors);

        return $path;
    }

    public function doRequest($method, $path, $queryParams = array(), $pathParams = array(), $body = '')
    {

        if (is_array($body)) {
            // Treat an empty array in the body data as if no body data was set
            if (!count($body)) $body = '';
            else $body = json_encode($body);
        }

        $this->errors       = array();
        $this->responseCode = 0;

        $path = $this->pathReplace($path, $pathParams);

        if (count($this->errors)) return FALSE;

        $method = strtoupper($method);
        $url    = $this->baseUrl . $path;

        // Add on any query parameters
        if (count($queryParams)) $url .= '?' . http_build_query($queryParams);

        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers());
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);

        if (in_array($method, array('DELETE', 'PATCH', 'POST', 'PUT'))) {

            // All except DELETE can have a payload in the body
            if ($method != 'DELETE' && strlen($body)) {
                curl_setopt($ch, CURLOPT_POST, TRUE);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
            }

            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        }

        $result = curl_exec($ch);

        $contentType        = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $this->responseCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        return json_decode($result, TRUE);
    }

    // Returns the errors responseCode returned from the last call to doRequest
    public function requestErrors()
    {
        return $this->errors;
    }

    // Returns the responseCode returned from the last call to doRequest
    public function responseCode()
    {
        return $this->responseCode;
    }
}
