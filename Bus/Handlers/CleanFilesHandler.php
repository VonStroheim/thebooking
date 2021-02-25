<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\CleanFiles;
use TheBooking\Bus\Handler;
use VSHM_Framework\db;

defined('ABSPATH') || exit;

/**
 * CleanFilesHandler
 *
 * @package TheBooking\Classes
 */
class CleanFilesHandler implements Handler
{
    private $table_name = 'tbkl_uploaded_files';

    public function dispatch(Command $command)
    {
        /** @var $command CleanFiles */

        global $wpdb;
        $table_name_1 = $wpdb->prefix . $this->table_name;
        $table_name_2 = $wpdb->prefix . 'tbkl_reservations_meta';

        /**
         * Select all those file records having no connection with any reservation record.
         */
        $query = "SELECT * FROM $table_name_1 one WHERE NOT EXISTS (SELECT * FROM $table_name_2 two WHERE two.meta_value LIKE CONCAT('%', one.hash, '%'))";

        $results = $wpdb->get_results($query, 'OBJECT');
        $now     = time();
        foreach ($results as $file) {
            if ($now - (int)$file->created > $command->getData()) {
                wp_delete_file($file->path);
                db::delete($this->table_name, [
                    'id' => $file->id
                ]);
            }
        }

    }
}