<?php

namespace TheBooking\Routes;

use TheBooking\Bus\Commands\SaveFile;
use VSHM_Framework\REST_Controller;
use function TheBooking\file_hash;

defined('ABSPATH') || exit;

/**
 * Class UploadFileRoute
 *
 * @package TheBooking\Routes
 */
final class UploadFileRoute implements Route
{
    /**
     * @var string
     */
    private static $path = '/frontend/upload/';

    public static function register()
    {
        REST_Controller::register_routes([
            self::$path => [
                'methods'  => \WP_REST_Server::CREATABLE,
                'callback' => function (\WP_REST_Request $request) {
                    $code = 200;

                    if (!function_exists('wp_handle_upload')) {
                        require_once(ABSPATH . 'wp-admin/includes/file.php');
                    }

                    $uploadedfile = $request->get_file_params();

                    if (!isset($uploadedfile['file'])) {
                        $response = [
                            'status'  => 'KO',
                            'message' => 'No file.'
                        ];
                        $code     = 404;
                    } else {
                        $upload_overrides = [
                            'test_form' => FALSE,
                        ];

                        $movefile = wp_handle_upload($uploadedfile['file'], $upload_overrides);

                        if (isset($movefile['error'])) {
                            $response = [
                                'status'  => 'KO',
                                'message' => $movefile['error']
                            ];
                            $code     = 403;
                        } else {
                            $response = [
                                'status' => 'OK',
                                'hash'   => file_hash($movefile)
                            ];
                            tbk()->bus->dispatch(new SaveFile($movefile));
                            // FILE (path) URL (url) TYPE (mime)
                        }
                    }

                    return apply_filters('tbk_frontend_upload_file_response', new \WP_REST_Response($response, $code));
                }
            ]
        ]);
    }

    public static function getPath()
    {
        return self::$path;
    }
}