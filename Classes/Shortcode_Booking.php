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

        foreach (tbk()->services->all() as $key => $service) {

            if (!empty($filteredServices) && !in_array($key, $filteredServices, TRUE)) {
                continue;
            }

            if (!$service->active()) {
                continue;
            }

            $serviceArray                        = tbk()->services->mapToFrontend($service->id());
            $serviceArray['meta']['blocksOther'] = [
                [
                    'by'   => 'serviceId',
                    'rule' => 'all'
                ]
            ];

            $services[ $key ] = $serviceArray;

        }

        $reservations = array_values(array_map(static function (Reservation $reservation) {
            return tbk()->reservations->mapToFrontend($reservation->id());
        }, tbk()->reservations->all()));

        $availability = [];

        foreach ($services as $service) {
            foreach (tbk()->availability->all() as $element) {
                $availability[] = [
                    'uid'               => $element['uid'],
                    'rrule'             => $element['rrule'],
                    'serviceId'         => $service['uid'],
                    'containerDuration' => [
                        'minutes' => $element['duration']
                    ],
                ];
            }
        }


        ob_start();

        ?>
        <div class="tbkBooking" id="<?= $instance_id ?>">
        </div>
        <script>
            jQuery(document).ready(function () {
                if (typeof TBK.UI.instances === 'undefined') {
                    TBK.UI.instances = {};
                }
                TBK.UI.instances['<?=$instance_id?>'] = {
                    availability          : <?= json_encode($availability) ?>,
                    services              : <?= json_encode($services) ?>,
                    reservations          : <?= json_encode($reservations) ?>,
                    groupSlots            : true,
                    monthlyViewAverageDots: 5,
                    monthlyViewShowAllDots: false
                }
            })
        </script>
        <?php

        return ob_get_clean();
    }
}