<?php

namespace TheBooking\Classes;

use TheBooking\Bus\Commands\CleanFiles;
use VSHM_Framework\Tools;
use function TheBooking\Frontend\icon_arrow_left;
use function TheBooking\Frontend\icon_arrow_right;

defined('ABSPATH') || exit;

/**
 * Class Shortcode_Booking
 *
 * @package TheBooking\Classes
 * @author  VonStroheim
 */
class Shortcode_Booking extends Shortcode
{
    /**
     * The shortcode name
     */
    const SHORTCODE = 'tbk-booking';

    public static function render($atts)
    {
        $instance_id = 'tbk_instance_' . Tools::generate_token();

        $services         = [];
        $filteredServices = isset($atts['service']) ? array_map('trim', explode(',', $atts['service'])) : [];

        foreach (tbkg()->services->all() as $key => $service) {

            if (!empty($filteredServices) && !in_array($key, $filteredServices, TRUE)) {
                continue;
            }

            if (!$service->active()) {
                continue;
            }

            $services[ $key ] = tbkg()->services->mapToFrontend($service->id());

        }

        $reservations = array_values(array_map(static function (Reservation $reservation) {
            return tbkg()->reservations->mapToFrontend($reservation->id());
        }, tbkg()->reservations->all()));

        $availability = new \ArrayObject();

        foreach ($services as $service) {
            foreach (tbkg()->availability->all() as $uid => $elements) {

                if (isset($service['meta']['overrideAvailability'])
                    && $service['meta']['overrideAvailability']
                    && $uid !== 'service_' . $service['uid']) {
                    continue;
                }

                if ((!isset($service['meta']['overrideAvailability'])
                        || (isset($service['meta']['overrideAvailability']) && !$service['meta']['overrideAvailability'])) && $uid !== 'availabilityGlobal_1') {
                    continue;
                }

                foreach ($elements as $element) {
                    $availability[ $uid ][] = [
                        'rrule'             => $element['rrule'],
                        'serviceId'         => $service['uid'],
                        'containerDuration' => [
                            'minutes' => $element['duration']
                        ],
                    ];
                }
            }
        }

        $defaultView = 'monthlyCalendar';
        if (isset($_GET['tbkg_view'])) {
            $defaultView = sanitize_text_field($_GET['tbkg_view']);
            switch (sanitize_text_field($_GET['tbkg_view'])) {
                case 'reservations':
                    $defaultView = 'reservations';
                    break;
                default:
                    break;
            }
        }

        ob_start();

        ?>
        <div class="tbkBooking" id="<?php echo esc_attr($instance_id) ?>">
        </div>
        <script>
            jQuery(document).ready(function () {
                if (typeof TBK.UI.instances === 'undefined') {
                    TBK.UI.instances = {};
                }
                <?php if (isset($_GET['tbkg_customer_hash'])) { ?>
                TBK.currentUserHash = '<?php echo sanitize_text_field($_GET['tbkg_customer_hash']) ?>';
                <?php } ?>
                TBK.UI.instances['<?php echo esc_attr($instance_id) ?>'] = {
                    availability          : <?php echo json_encode(apply_filters('tbk_frontend_availability', $availability, $atts)) ?>,
                    middleware            : <?php echo json_encode(apply_filters('tbk_frontend_middleware', [
                        'changeMonth' => []
                    ], $atts)) ?>,
                    busyIntervals         : <?php echo json_encode(apply_filters('tbk_frontend_busy_intervals', [], $atts)) ?>,
                    services              : <?php echo json_encode($services) ?>,
                    reservations          : <?php echo json_encode($reservations) ?>,
                    groupSlots            : true,
                    viewMode              : '<?php echo $defaultView ?>',
                    monthlyViewAverageDots: 5,
                    monthlyViewShowAllDots: false
                }
            })
        </script>
        <?php

        return ob_get_clean();
    }
}