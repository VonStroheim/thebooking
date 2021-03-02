<?php

namespace VSHM_Framework;

defined('ABSPATH') || exit;

if (!class_exists(Tools::class)) {

    /**
     * Class Tools
     *
     * @package VSHM_Framework
     * @author  VonStroheim
     */
    class Tools
    {
        /**
         * Insert a value or key/value pair after a specific key in an array.  If key doesn't exist, value is appended
         * to the end of the array.
         *
         * @credits https://gist.github.com/wpscholar/0deadce1bbfa4adb4e4c
         *
         * @param array  $array
         * @param string $key
         * @param array  $new
         *
         * @return array
         */
        public static function array_insert_after(array $array, $key, array $new)
        {
            $keys  = array_keys($array);
            $index = array_search($key, $keys, TRUE);
            $pos   = FALSE === $index ? count($array) : $index + 1;

            return array_merge(array_slice($array, 0, $pos), $new, array_slice($array, $pos));
        }

        /**
         * Maps MIME types to relative file extensions.
         *
         * @credits https://gist.github.com/alexcorvi/df8faecb59e86bee93411f6a7967df2c
         *
         * @param string $mime
         *
         * @return bool|mixed
         */
        public static function mime_to_ext($mime)
        {
            $mime_map = [
                'video/3gpp2'                                                               => '3g2',
                'video/3gp'                                                                 => '3gp',
                'video/3gpp'                                                                => '3gp',
                'application/x-compressed'                                                  => '7zip',
                'audio/x-acc'                                                               => 'aac',
                'audio/ac3'                                                                 => 'ac3',
                'application/postscript'                                                    => 'ai',
                'audio/x-aiff'                                                              => 'aif',
                'audio/aiff'                                                                => 'aif',
                'audio/x-au'                                                                => 'au',
                'video/x-msvideo'                                                           => 'avi',
                'video/msvideo'                                                             => 'avi',
                'video/avi'                                                                 => 'avi',
                'application/x-troff-msvideo'                                               => 'avi',
                'application/macbinary'                                                     => 'bin',
                'application/mac-binary'                                                    => 'bin',
                'application/x-binary'                                                      => 'bin',
                'application/x-macbinary'                                                   => 'bin',
                'image/bmp'                                                                 => 'bmp',
                'image/x-bmp'                                                               => 'bmp',
                'image/x-bitmap'                                                            => 'bmp',
                'image/x-xbitmap'                                                           => 'bmp',
                'image/x-win-bitmap'                                                        => 'bmp',
                'image/x-windows-bmp'                                                       => 'bmp',
                'image/ms-bmp'                                                              => 'bmp',
                'image/x-ms-bmp'                                                            => 'bmp',
                'application/bmp'                                                           => 'bmp',
                'application/x-bmp'                                                         => 'bmp',
                'application/x-win-bitmap'                                                  => 'bmp',
                'application/cdr'                                                           => 'cdr',
                'application/coreldraw'                                                     => 'cdr',
                'application/x-cdr'                                                         => 'cdr',
                'application/x-coreldraw'                                                   => 'cdr',
                'image/cdr'                                                                 => 'cdr',
                'image/x-cdr'                                                               => 'cdr',
                'zz-application/zz-winassoc-cdr'                                            => 'cdr',
                'application/mac-compactpro'                                                => 'cpt',
                'application/pkix-crl'                                                      => 'crl',
                'application/pkcs-crl'                                                      => 'crl',
                'application/x-x509-ca-cert'                                                => 'crt',
                'application/pkix-cert'                                                     => 'crt',
                'text/css'                                                                  => 'css',
                'text/x-comma-separated-values'                                             => 'csv',
                'text/comma-separated-values'                                               => 'csv',
                'application/vnd.msexcel'                                                   => 'csv',
                'application/x-director'                                                    => 'dcr',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'   => 'docx',
                'application/x-dvi'                                                         => 'dvi',
                'message/rfc822'                                                            => 'eml',
                'application/x-msdownload'                                                  => 'exe',
                'video/x-f4v'                                                               => 'f4v',
                'audio/x-flac'                                                              => 'flac',
                'video/x-flv'                                                               => 'flv',
                'image/gif'                                                                 => 'gif',
                'application/gpg-keys'                                                      => 'gpg',
                'application/x-gtar'                                                        => 'gtar',
                'application/x-gzip'                                                        => 'gzip',
                'application/mac-binhex40'                                                  => 'hqx',
                'application/mac-binhex'                                                    => 'hqx',
                'application/x-binhex40'                                                    => 'hqx',
                'application/x-mac-binhex40'                                                => 'hqx',
                'text/html'                                                                 => 'html',
                'image/x-icon'                                                              => 'ico',
                'image/x-ico'                                                               => 'ico',
                'image/vnd.microsoft.icon'                                                  => 'ico',
                'text/calendar'                                                             => 'ics',
                'application/java-archive'                                                  => 'jar',
                'application/x-java-application'                                            => 'jar',
                'application/x-jar'                                                         => 'jar',
                'image/jp2'                                                                 => 'jp2',
                'video/mj2'                                                                 => 'jp2',
                'image/jpx'                                                                 => 'jp2',
                'image/jpm'                                                                 => 'jp2',
                'image/jpeg'                                                                => 'jpeg',
                'image/pjpeg'                                                               => 'jpeg',
                'application/x-javascript'                                                  => 'js',
                'application/json'                                                          => 'json',
                'text/json'                                                                 => 'json',
                'application/vnd.google-earth.kml+xml'                                      => 'kml',
                'application/vnd.google-earth.kmz'                                          => 'kmz',
                'text/x-log'                                                                => 'log',
                'audio/x-m4a'                                                               => 'm4a',
                'application/vnd.mpegurl'                                                   => 'm4u',
                'audio/midi'                                                                => 'mid',
                'application/vnd.mif'                                                       => 'mif',
                'video/quicktime'                                                           => 'mov',
                'video/x-sgi-movie'                                                         => 'movie',
                'audio/mpeg'                                                                => 'mp3',
                'audio/mpg'                                                                 => 'mp3',
                'audio/mpeg3'                                                               => 'mp3',
                'audio/mp3'                                                                 => 'mp3',
                'video/mp4'                                                                 => 'mp4',
                'video/mpeg'                                                                => 'mpeg',
                'application/oda'                                                           => 'oda',
                'audio/ogg'                                                                 => 'ogg',
                'video/ogg'                                                                 => 'ogg',
                'application/ogg'                                                           => 'ogg',
                'application/x-pkcs10'                                                      => 'p10',
                'application/pkcs10'                                                        => 'p10',
                'application/x-pkcs12'                                                      => 'p12',
                'application/x-pkcs7-signature'                                             => 'p7a',
                'application/pkcs7-mime'                                                    => 'p7c',
                'application/x-pkcs7-mime'                                                  => 'p7c',
                'application/x-pkcs7-certreqresp'                                           => 'p7r',
                'application/pkcs7-signature'                                               => 'p7s',
                'application/pdf'                                                           => 'pdf',
                'application/octet-stream'                                                  => 'pdf',
                'application/x-x509-user-cert'                                              => 'pem',
                'application/x-pem-file'                                                    => 'pem',
                'application/pgp'                                                           => 'pgp',
                'application/x-httpd-php'                                                   => 'php',
                'application/php'                                                           => 'php',
                'application/x-php'                                                         => 'php',
                'text/php'                                                                  => 'php',
                'text/x-php'                                                                => 'php',
                'application/x-httpd-php-source'                                            => 'php',
                'image/png'                                                                 => 'png',
                'image/x-png'                                                               => 'png',
                'application/powerpoint'                                                    => 'ppt',
                'application/vnd.ms-powerpoint'                                             => 'ppt',
                'application/vnd.ms-office'                                                 => 'ppt',
                'application/msword'                                                        => 'ppt',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
                'application/x-photoshop'                                                   => 'psd',
                'image/vnd.adobe.photoshop'                                                 => 'psd',
                'audio/x-realaudio'                                                         => 'ra',
                'audio/x-pn-realaudio'                                                      => 'ram',
                'application/x-rar'                                                         => 'rar',
                'application/rar'                                                           => 'rar',
                'application/x-rar-compressed'                                              => 'rar',
                'audio/x-pn-realaudio-plugin'                                               => 'rpm',
                'application/x-pkcs7'                                                       => 'rsa',
                'text/rtf'                                                                  => 'rtf',
                'text/richtext'                                                             => 'rtx',
                'video/vnd.rn-realvideo'                                                    => 'rv',
                'application/x-stuffit'                                                     => 'sit',
                'application/smil'                                                          => 'smil',
                'text/srt'                                                                  => 'srt',
                'image/svg+xml'                                                             => 'svg',
                'application/x-shockwave-flash'                                             => 'swf',
                'application/x-tar'                                                         => 'tar',
                'application/x-gzip-compressed'                                             => 'tgz',
                'image/tiff'                                                                => 'tiff',
                'text/plain'                                                                => 'txt',
                'text/x-vcard'                                                              => 'vcf',
                'application/videolan'                                                      => 'vlc',
                'text/vtt'                                                                  => 'vtt',
                'audio/x-wav'                                                               => 'wav',
                'audio/wave'                                                                => 'wav',
                'audio/wav'                                                                 => 'wav',
                'application/wbxml'                                                         => 'wbxml',
                'video/webm'                                                                => 'webm',
                'audio/x-ms-wma'                                                            => 'wma',
                'application/wmlc'                                                          => 'wmlc',
                'video/x-ms-wmv'                                                            => 'wmv',
                'video/x-ms-asf'                                                            => 'wmv',
                'application/xhtml+xml'                                                     => 'xhtml',
                'application/excel'                                                         => 'xl',
                'application/msexcel'                                                       => 'xls',
                'application/x-msexcel'                                                     => 'xls',
                'application/x-ms-excel'                                                    => 'xls',
                'application/x-excel'                                                       => 'xls',
                'application/x-dos_ms_excel'                                                => 'xls',
                'application/xls'                                                           => 'xls',
                'application/x-xls'                                                         => 'xls',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'         => 'xlsx',
                'application/vnd.ms-excel'                                                  => 'xlsx',
                'application/xml'                                                           => 'xml',
                'text/xml'                                                                  => 'xml',
                'text/xsl'                                                                  => 'xsl',
                'application/xspf+xml'                                                      => 'xspf',
                'application/x-compress'                                                    => 'z',
                'application/x-zip'                                                         => 'zip',
                'application/zip'                                                           => 'zip',
                'application/x-zip-compressed'                                              => 'zip',
                'application/s-compressed'                                                  => 'zip',
                'multipart/x-zip'                                                           => 'zip',
                'text/x-scriptzsh'                                                          => 'zsh',
            ];

            return isset($mime_map[ $mime ]) === TRUE ? $mime_map[ $mime ] : FALSE;
        }

        /**
         * Makes an array ready for HTML attribute insertion.
         *
         * @param array $params
         *
         * @return string
         */
        public static function prepare_attribute_params(array $params)
        {
            return htmlspecialchars(json_encode($params), ENT_QUOTES);
        }

        /**
         * @param array $arr
         *
         * @return bool
         */
        public static function array_is_assoc(array $arr)
        {
            if ([] === $arr) {
                return FALSE;
            }

            return array_keys($arr) !== range(0, count($arr) - 1);
        }

        /**
         * @param $string
         *
         * @return mixed
         */
        public static function escapeJavaScriptText($string)
        {
            return str_replace(['"', "\n"], ['\"', '\n'], addcslashes(str_replace("\r", '', (string)$string), "\0..\37'\\"));
        }

        /**
         * Generates a secure token
         * (source https://gist.github.com/raveren/5555297)
         *
         * @param string $type
         * @param int    $length
         *
         * @return string
         */
        public static function generate_token($type = 'alnum', $length = 32)
        {
            switch ($type) {
                case 'alnum':
                    $pool = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    break;
                case 'alpha':
                    $pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    break;
                case 'hexdec':
                    $pool = '0123456789abcdef';
                    break;
                case 'numeric':
                    $pool = '0123456789';
                    break;
                case 'nozero':
                    $pool = '123456789';
                    break;
                case 'distinct':
                    $pool = '2345679ACDEFHJKLMNPRSTUVWXYZ';
                    break;
                case 'alnum_upper':
                    $pool = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    break;
                default:
                    $pool = (string)$type;
                    break;
            }

            $crypto_rand_secure = function ($min, $max) {
                $range = $max - $min;
                if ($range < 0) {
                    return $min;
                }
                $log    = log($range, 2);
                $bytes  = (int)($log / 8) + 1; // length in bytes
                $bits   = (int)$log + 1; // length in bits
                $filter = (1 << $bits) - 1; // set all lower bits to 1
                do {
                    $rnd = hexdec(bin2hex(random_bytes($bytes)));
                    $rnd &= $filter; // discard irrelevant bits
                } while ($rnd >= $range);

                return $min + $rnd;
            };

            $token = '';
            $max   = strlen($pool);
            for ($i = 0; $i < $length; $i++) {
                $token .= $pool[ $crypto_rand_secure(0, $max) ];
            }

            return $token;
        }

        /**
         * Serialize data, if needed.
         *
         * Conversely to WordPress core function, this one
         * prevents double-serialization.
         *
         * @param $data
         *
         * @return string
         */
        public static function maybe_serialize($data)
        {
            if (is_array($data) || is_object($data)) {
                return serialize($data);
            }

            return $data;
        }

        /**
         * Changes a key in the array while keeping its order.
         *
         * @param array  $array
         * @param string $old_k
         * @param string $new_k
         *
         * @return array
         */
        public static function change_array_key($array, $old_k, $new_k)
        {
            if (!array_key_exists($old_k, $array)) {
                return $array;
            }
            $keys = array_keys($array);

            $keys[ array_search($old_k, $keys, TRUE) ] = $new_k;

            return array_combine($keys, $array);
        }

        /**
         * Looks for a JSON string inside a generic string
         * which is supposed to contain one JSON string only.
         *
         * Returns any decoded finding.
         *
         * @param $string
         *
         * @return array|bool|mixed|object
         */
        public static function looking_for_json($string)
        {
            $regex   = "/(\{.*?\})/s";
            $matches = array();
            preg_match($regex, $string, $matches);

            return isset($matches[0]) ? self::json_validate($matches[0]) : FALSE;
        }

        /**
         * @param $string
         *
         * @return array|bool|mixed|object
         */
        public static function json_validate($string)
        {
            $result = json_decode($string, FALSE);

            switch (json_last_error()) {
                case JSON_ERROR_NONE:
                    $error = '';
                    break;
                case JSON_ERROR_DEPTH:
                    $error = 'The maximum stack depth has been exceeded.';
                    break;
                case JSON_ERROR_STATE_MISMATCH:
                    $error = 'Invalid or malformed JSON.';
                    break;
                case JSON_ERROR_CTRL_CHAR:
                    $error = 'Control character error, possibly incorrectly encoded.';
                    break;
                case JSON_ERROR_SYNTAX:
                    $error = 'Syntax error, malformed JSON.';
                    break;
                // PHP >= 5.3.3
                case JSON_ERROR_UTF8:
                    $error = 'Malformed UTF-8 characters, possibly incorrectly encoded.';
                    break;
                // PHP >= 5.5.0
                case JSON_ERROR_RECURSION:
                    $error = 'One or more recursive references in the value to be encoded.';
                    break;
                // PHP >= 5.5.0
                case JSON_ERROR_INF_OR_NAN:
                    $error = 'One or more NAN or INF values in the value to be encoded.';
                    break;
                case JSON_ERROR_UNSUPPORTED_TYPE:
                    $error = 'A value of a type that cannot be encoded was given.';
                    break;
                default:
                    $error = 'Unknown JSON error occured.';
                    break;
            }

            if (!empty($error)) {
                $result = FALSE;
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    $error .= ' Original string: ' . $string;
                    trigger_error(esc_html($error));
                }
            }

            return $result;
        }

        /**
         * @param $var
         *
         * @return string
         */
        public static function stringify_dump($var)
        {
            ob_start();
            var_dump($var);

            return ob_get_clean();
        }

        /**
         * @param string $type
         *
         * @return bool
         */
        public static function is_request($type)
        {
            switch ($type) {
                case 'admin':
                    return is_admin();
                case 'ajax':
                    return defined('DOING_AJAX') && DOING_AJAX;
                case 'rest':
                    if ((defined('REST_REQUEST') && REST_REQUEST)
                        || (isset($_GET['rest_route']) && strpos(sanitize_text_field($_GET['rest_route']), REST_Controller::NAME_SPACE))) {
                        return TRUE;
                    }
                    $is_rest = FALSE;
                    if (!empty($_SERVER['REQUEST_URI'])) {
                        $rest_url     = self::get_rest_url(get_current_blog_id(), '/');
                        $rest_path    = trim(parse_url($rest_url, PHP_URL_PATH), '/');
                        $request_path = trim(sanitize_text_field($_SERVER['REQUEST_URI']), '/');
                        $is_rest      = (strpos($request_path, $rest_path) === 0);
                    }

                    return $is_rest;
                case 'cron':
                    return defined('DOING_CRON') && DOING_CRON;
                case 'frontend':
                    return (!is_admin() || (defined('DOING_AJAX') && DOING_AJAX))
                        && (!defined('DOING_CRON') || !DOING_CRON)
                        && (!defined('REST_REQUEST') || !REST_REQUEST);
            }

            return FALSE;
        }

        /**
         * This function is a bypass of WordPress original function
         * as it calls WP_Rewrite and we need it too early.
         *
         * Todo: check when WordPress will drop the WP_Rewrite call, as it is not actually necessary.
         *
         * @param null   $blog_id
         * @param string $path
         * @param string $scheme
         *
         * @return mixed|void
         */
        public static function get_rest_url($blog_id = NULL, $path = '/', $scheme = 'rest')
        {
            if (empty($path)) {
                $path = '/';
            }

            $path = '/' . ltrim($path, '/');

            if (get_option('permalink_structure')) {

                if (preg_match('#^/*index.php#', get_option('permalink_structure'))) {
                    $url = get_home_url($blog_id, 'index.php/' . rest_get_url_prefix(), $scheme);
                } else {
                    $url = get_home_url($blog_id, rest_get_url_prefix(), $scheme);
                }

                $url .= $path;
            } else {
                $url = trailingslashit(get_home_url($blog_id, '', $scheme));
                if ('index.php' !== substr($url, 9)) {
                    $url .= 'index.php';
                }
                $url = add_query_arg('rest_route', $path, $url);
            }

            if (is_ssl()) {
                if ($_SERVER['SERVER_NAME'] === parse_url(get_home_url($blog_id), PHP_URL_HOST)) {
                    $url = set_url_scheme($url, 'https');
                }
            }

            if (is_admin() && force_ssl_admin()) {
                $url = set_url_scheme($url, 'https');
            }

            return apply_filters('rest_url', $url, $path, $blog_id, $scheme);
        }

        /**
         * @param string $handle
         * @param string $path
         * @param array  $deps
         */
        public static function enqueue_style($handle, $path, $deps = [])
        {
            wp_enqueue_style($handle,
                TBKG_URL__ . $path,
                $deps,
                filemtime(TBKG_DIR__ . implode(DIRECTORY_SEPARATOR, explode('/', $path)))
            );
        }

        /**
         * @param string $handle
         * @param string $path
         * @param array  $deps
         * @param bool   $footer
         */
        public static function enqueue_script($handle, $path, $deps = [], $footer = FALSE)
        {
            if ($path[0] . $path[1] !== '//') {
                wp_enqueue_script($handle,
                    TBKG_URL__ . $path,
                    $deps,
                    filemtime(TBKG_DIR__ . implode(DIRECTORY_SEPARATOR, explode('/', $path))),
                    $footer
                );
            } else {
                wp_enqueue_script($handle,
                    $path,
                    $deps,
                    NULL,
                    $footer
                );
            }
        }

        /**
         * @param string $format
         *
         * @return array
         */
        public static function i18n_weekdays_labels($format = 'l')
        {
            $return = [];
            for ($i = 0; $i < 7; $i++) {
                $return[ $i ] = wp_date($format, strtotime("Sunday +{$i} days"));
            }

            return $return;
        }

        /**
         * @param string $format
         *
         * @return array
         */
        public static function i18n_months_labels($format = 'F')
        {
            $return = [];
            for ($i = 0; $i < 12; $i++) {
                $return[ $i ] = wp_date($format, strtotime("1st January +{$i} months"));
            }

            return $return;
        }

        /**
         * @return string
         */
        public static function get_ip_address()
        {
            foreach (['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_X_CLUSTER_CLIENT_IP', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'] as $key) {
                if (array_key_exists($key, $_SERVER) === TRUE) {
                    foreach (explode(',', $_SERVER[ $key ]) as $ip) {
                        $ip = trim($ip);
                        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== FALSE) {
                            return $ip;
                        }
                    }
                }
            }
        }

    }
}