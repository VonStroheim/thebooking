<?php

namespace TheBooking\Routes;

use TheBooking\Classes\ValueTypes\FormField;
use VSHM_Framework\Classes\REST_Error_404;
use VSHM_Framework\Classes\REST_Error_Unauthorized;
use VSHM_Framework\REST_Controller;

defined('ABSPATH') || exit;

/**
 * Class GetServiceProperty
 *
 * @package TheBooking\Routes
 */
final class GetServicePropertyRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/frontend/get/service/(?P<id>[\w\-]+)/(?P<property>[\w\-]+)';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => [\WP_REST_Server::READABLE],
                'callback' => function (\WP_REST_Request $request) {
                    /**
                     * Ensures that the endpoint is internal.
                     */
                    if (!wp_verify_nonce($request['tbk_nonce'], 'tbk_nonce')) {
                        return new REST_Error_Unauthorized();
                    }

                    $service = tbkg()->services->get($request->get_param('id'));

                    if (!$service) {
                        return new REST_Error_404();
                    }

                    switch ($request->get_param('property')) {
                        case 'form':
                            $ffOrder      = $service->getMeta('formFieldsOrder');
                            $ffRequired   = $service->getMeta('formFieldsRequired');
                            $ffConditions = $service->getMeta('formFieldsConditions');
                            $ffContact    = $service->getMeta('formFieldContact');
                            $ff           = array_filter($service->metadata(), static function ($meta) {
                                return $meta instanceof FormField;
                            });
                            $ordered_ff   = [];
                            foreach ($ffOrder as $fieldKey) {

                                /**
                                 * Componsing the field
                                 */
                                $field               = $ff[ $fieldKey ]->getValue();
                                $field['required']   = in_array($fieldKey, $ffRequired, TRUE);
                                $field['conditions'] = isset($ffConditions[ $fieldKey ]) ? $ffConditions[ $fieldKey ] : [];
                                $field['isContact']  = $ffContact === $fieldKey;

                                /**
                                 * i18n TODO
                                 */

                                $ordered_ff[ $fieldKey ] = $field;
                            }
                            $response = $ordered_ff;
                            break;
                        default:
                            return new REST_Error_404();
                    }

                    return new \WP_REST_Response($response, 200);

                },
                'args'     => [
                    'tbk_nonce' => [
                        'required' => TRUE
                    ]
                ]
            ]
        ]);
    }

    public static function getPath()
    {
        return self::$path;
    }
}