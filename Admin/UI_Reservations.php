<?php

namespace TheBooking\Admin;

use TheBooking\Bus\Commands\CreateReservation;
use TheBooking\Bus\Commands\DeleteReservation;
use TheBooking\Bus\Commands\SaveFile;
use TheBooking\Classes\Reservation;
use TheBooking\Classes\ValueTypes\UserInput;
use VSHM_Framework\Classes\REST_Error_404;
use VSHM_Framework\Classes\REST_Error_Unauthorized;
use VSHM_Framework\Tools;
use function TheBooking\file_hash;

defined('ABSPATH') || exit;

/**
 * Class UI_Reservations
 *
 * @package TheBooking\Admin
 */
final class UI_Reservations
{
}