<?php

namespace TheBooking\Bus\Handlers;

use TheBooking\Bus\Command;
use TheBooking\Bus\Commands\SaveFile;
use TheBooking\Bus\Handler;
use VSHM_Framework\db;
use function TheBooking\file_hash;

defined('ABSPATH') || exit;

/**
 * SaveFileHandler
 *
 * @package TheBooking\Classes
 */
class SaveFileHandler implements Handler
{
    private $table_name = 'tbkl_uploaded_files';

    private $table_structure = [
        'hash'    => 'varchar',
        'path'    => 'text',
        'url'     => 'text',
        'mime'    => 'varchar',
        'created' => 'int',
        'updated' => 'timestamp'
    ];

    public function dispatch(Command $command)
    {
        /** @var $command SaveFile */

        db::create_table($this->table_name, $this->table_structure);
        db::insert($this->table_name, [
            'hash'    => file_hash($command->getData()),
            'path'    => $command->getData()['file'],
            'url'     => $command->getData()['url'],
            'mime'    => $command->getData()['type'],
            'created' => time()
        ]);

        do_action('tbk_file_is_uploaded', $command->getData());

    }
}