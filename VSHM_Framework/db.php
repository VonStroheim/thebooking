<?php

namespace VSHM_Framework;

defined('ABSPATH') || exit;

if (!class_exists(db::class)) {

    /**
     * Class db
     *
     * @author  VonStroheim
     * @package VSHM_Framework
     */
    class db
    {

        /**
         * @param string $table_name
         * @param array  $columns
         *
         * @return string
         */
        public static function create_table($table_name, $columns)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . $table_name;
            if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") !== $table_name) {
                $charset_collate = $wpdb->get_charset_collate();
                $sql             = "CREATE TABLE $table_name (id int NOT NULL AUTO_INCREMENT, ";
                foreach ($columns as $name => $attrs) {
                    if ($name === 'id') {
                        continue;
                    }
                    $sql .= self::_prepare_column($name, $attrs) . ', ';
                }
                $sql .= "UNIQUE KEY id (id)) $charset_collate;";
                require_once ABSPATH . 'wp-admin/includes/upgrade.php';
                dbDelta($sql);
            }

            return $table_name;

        }

        /**
         * @param string $table_name
         * @param array  $columns
         *
         * @return string
         */
        public static function alter_table($table_name, $columns)
        {
            global $wpdb;
            $table_name      = $wpdb->prefix . $table_name;
            $charset_collate = $wpdb->get_charset_collate();
            $sql             = "CREATE TABLE $table_name (id int NOT NULL AUTO_INCREMENT, ";
            foreach ($columns as $name => $attrs) {
                if ($name === 'id') {
                    continue;
                }
                $sql .= self::_prepare_column($name, $attrs) . ', ';
            }
            $sql .= "UNIQUE KEY id (id)) $charset_collate;";
            require_once ABSPATH . 'wp-admin/includes/upgrade.php';
            dbDelta($sql);

            return $table_name;

        }

        /**
         * @param string $table_name
         *
         * @return bool
         */
        public static function drop_table($table_name)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . $table_name;
            $wpdb->query("DROP TABLE IF EXISTS {$table_name}");

            return TRUE;
        }

        /**
         * @param string $table_name
         *
         * @return false|int
         */
        public static function truncate_table($table_name)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . $table_name;

            return $wpdb->query("TRUNCATE TABLE $table_name");
        }

        /**
         * @param              $table_name
         * @param              $other_table_name
         * @param              $where
         * @param              $where_alias
         * @param string|array $what
         * @param bool         $multisite
         * @param string       $output_mode
         *
         * @return array|object|null
         */
        public static function select_where_is_not($table_name, $other_table_name, $where, $where_alias = NULL, $what = '*', $multisite = FALSE, $output_mode = 'OBJECT')
        {
            global $wpdb;
            $table_name_1 = $wpdb->prefix . $table_name;
            $table_name_2 = $wpdb->prefix . $other_table_name;
            if (NULL === $where_alias) {
                $where_alias = $where;
            }
            $columns = is_array($what)
                ? rtrim(implode(', ', $what), ', ')
                : $what;
            $query   = "SELECT $columns FROM $table_name_1 WHERE $where NOT IN (SELECT $where_alias FROM $table_name_2)";
            $results = $wpdb->get_results($query, $output_mode);

            return $results;
        }

        /**
         * @param string       $table_name
         * @param string|array $what
         * @param string       $order_by
         * @param string       $order
         * @param int          $items
         * @param int          $page
         *
         * @return array|object|null
         */
        public static function paginate($table_name, $what = '*', $order_by = 'created', $order = 'ASC', $items = 10, $page = 1)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . $table_name;
            $offset     = ($page - 1) * $items;
            $columns    = is_array($what)
                ? rtrim(implode(', ', $what), ', ')
                : $what;
            $query      = "
                    SELECT $columns 
                    FROM $table_name
                    ORDER BY $order_by $order
                    LIMIT $items OFFSET $offset;
            ";

            return $wpdb->get_results($query);
        }

        /**
         * @param string       $table_name
         * @param string|array $what
         * @param array        $where     optional conditions
         * @param bool         $multisite If TRUE, the query is expected to be performed in the whole network
         *                                if the multisite support setting of the plugin is active.
         * @param string       $output_mode
         *
         * @return array|null|object
         */
        public static function select($table_name, $what = '*', array $where = [], $multisite = FALSE, $output_mode = 'OBJECT')
        {
            global $wpdb;
            $table_name_c = $wpdb->prefix . $table_name;
            $columns      = is_array($what)
                ? rtrim(implode(', ', $what), ', ')
                : $what;
            $query        = "SELECT $columns FROM $table_name_c";

            if (!empty($where)) {
                $query .= ' WHERE ';
                foreach ($where as $column => $value) {
                    $query .= $column . ' = ' . (is_int($value) ? '%d' : '%s') . ' AND ';
                }
                $query = $wpdb->prepare(rtrim($query, ' AND '), array_values($where));
            }

            $results = $wpdb->get_results($query, $output_mode);

            if ($multisite
                && function_exists('is_multisite')
                && is_multisite()
            ) {
                $to_be_merged[0] = $results;
                require_once ABSPATH . '/wp-admin/includes/plugin.php';
                $original_blog = get_current_blog_id();
                foreach ($wpdb->get_col("SELECT blog_id FROM $wpdb->blogs") as $blog_id) {
                    $switched = switch_to_blog($blog_id);
                    if ($switched
                        && (int)$blog_id !== $original_blog
                        && is_plugin_active(plugin_basename(__TBK_FILE__))) {
                        $table_name_c = $wpdb->prefix . $table_name;
                        $columns      = is_array($what)
                            ? rtrim(implode(', ', $what), ', ')
                            : $what;
                        $query        = "SELECT $columns FROM $table_name_c";

                        if (!empty($where)) {
                            $query .= ' WHERE ';
                            foreach ($where as $column => $value) {
                                $query .= $column . ' = ' . (is_int($value) ? '%d' : '%s') . ' AND ';
                            }
                            $query = $wpdb->prepare(rtrim($query, ' AND '), array_values($where));
                        }

                        $to_be_merged[] = $wpdb->get_results($query, $output_mode);
                    }
                    restore_current_blog();
                }
                $results = array_merge(...$to_be_merged);
            }

            if ($wpdb->last_error) {
                $code = 500;
                if (preg_match("/^\b(Table)\b[\s\S]*\b(doesn't exist)\b/", $wpdb->last_error)) {
                    $code = 404;
                }

                return new \WP_Error($code, $wpdb->last_error, $query);
            }

            return $results;
        }


        /**
         * @param $table_name
         *
         * @return string|int
         */
        public static function count($table_name)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . $table_name;

            return $wpdb->get_var('SELECT COUNT(*) FROM ' . $table_name);
        }

        /**
         * @param string $table_name
         * @param array  $record
         *
         * @return int
         */
        public static function insert($table_name, array $record)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . $table_name;
            $wpdb->insert($table_name, $record);

            return $wpdb->insert_id;
        }

        /**
         * @param string $table_name
         * @param array  $record
         * @param array  $keys
         *
         * @return false|int
         */
        public static function update($table_name, array $record, array $keys)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . $table_name;

            return $wpdb->update($table_name, $record, $keys);
        }

        /**
         * @param string $table_name
         * @param array  $conditions
         *
         * @return false|int
         */
        public static function delete($table_name, array $conditions)
        {
            global $wpdb;
            $table_name = $wpdb->prefix . $table_name;

            return $wpdb->delete($table_name, $conditions);
        }

        /**
         * @param string       $name
         * @param array|string $attrs
         *
         * @return string
         */
        protected static function _prepare_column($name, $attrs)
        {
            if (!is_array($attrs)) {
                $attrs = ['type' => $attrs];
            }
            $attrs = array_merge(
                [
                    'type'    => NULL,
                    'null'    => FALSE,
                    'chars'   => 255,
                    'primary' => FALSE
                ],
                $attrs
            );
            $type  = strtolower($attrs['type']);
            switch ($type) {
                case 'text':
                case 'tinytext':
                case 'int':
                case 'longtext':
                case 'tinyint':
                    return $name . ' ' . $type . ($attrs['null'] ? '' : ' NOT NULL') . ($attrs['primary'] ? ' PRIMARY KEY' : '');
                case 'decimal':
                    return $name . ' decimal(20,2)' . ($attrs['null'] ? '' : ' NOT NULL');
                case 'datetime':
                    return $name . " datetime DEFAULT '0000-00-00 00:00:00'"
                        . ($attrs['null'] ? '' : ' NOT NULL');
                case 'timestamp':
                    return $name . ' timestamp' . ($attrs['null'] ? '' : ' NOT NULL')
                        . ' DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP';
                case 'char':
                case 'varchar':
                    return $name . ' ' . $type . '(' . $attrs['chars'] . ')'
                        . ($attrs['null'] ? '' : ' NOT NULL') . ($attrs['primary'] ? ' PRIMARY KEY' : '');
                default:
                    return '';
            }
        }

        /**
         * @param $key
         *
         * @return bool
         */
        public static function tbk_check_sql_key($key)
        {
            $string = 'A,ABORT,ABS,ABSOLUTE,ACCESS,ACTION,ADA,ADD,ADMIN,AFTER,AGGREGATE,ALIAS,ALL,ALLOCATE,ALSO,ALTER,ALWAYS,ANALYSE,ANALYZE,AND,ANY,ARE,ARRAY,AS,ASC,ASENSITIVE,ASSERTION,ASSIGNMENT,ASYMMETRIC,AT,ATOMIC,ATTRIBUTE,ATTRIBUTES,AUDIT,AUTHORIZATION,AUTO_INCREMENT,AVG,AVG_ROW_LENGTH,BACKUP,BACKWARD,BEFORE,BEGIN,BERNOULLI,BETWEEN,BIGINT,BINARY,BIT,BIT_LENGTH,BITVAR,BLOB,BOOL,BOOLEAN,BOTH,BREADTH,BREAK,BROWSE,BULK,BY,C,CACHE,CALL,CALLED,CARDINALITY,CASCADE,CASCADED,CASE,CAST,CATALOG,CATALOG_NAME,CEIL,CEILING,CHAIN,CHANGE,CHAR,CHAR_LENGTH,CHARACTER,CHARACTER_LENGTH,CHARACTER_SET_CATALOG,CHARACTER_SET_NAME,CHARACTER_SET_SCHEMA,CHARACTERISTICS,CHARACTERS,CHECK,CHECKED,CHECKPOINT,CHECKSUM,CLASS,CLASS_ORIGIN,CLOB,CLOSE,CLUSTER,CLUSTERED,COALESCE,COBOL,COLLATE,COLLATION,COLLATION_CATALOG,COLLATION_NAME,COLLATION_SCHEMA,COLLECT,COLUMN,COLUMN_NAME,COLUMNS,COMMAND_FUNCTION,COMMAND_FUNCTION_CODE,COMMENT,COMMIT,COMMITTED,COMPLETION,COMPRESS,COMPUTE,CONDITION,CONDITION_NUMBER,CONNECT,CONNECTION,CONNECTION_NAME,CONSTRAINT,CONSTRAINT_CATALOG,CONSTRAINT_NAME,CONSTRAINT_SCHEMA,CONSTRAINTS,CONSTRUCTOR,CONTAINS,CONTAINSTABLE,CONTINUE,CONVERSION,CONVERT,COPY,CORR,CORRESPONDING,COUNT,COVAR_POP,COVAR_SAMP,CREATE,CREATEDB,CREATEROLE,CREATEUSER,CROSS,CSV,CUBE,CUME_DIST,CURRENT,CURRENT_DATE,CURRENT_DEFAULT_TRANSFORM_GROUP,CURRENT_PATH,CURRENT_ROLE,CURRENT_TIME,CURRENT_TIMESTAMP,CURRENT_TRANSFORM_GROUP_FOR_TYPE,CURRENT_USER,CURSOR,CURSOR_NAME,CYCLE,DATA,DATABASE,DATABASES,DATE,DATETIME,DATETIME_INTERVAL_CODE,DATETIME_INTERVAL_PRECISION,DAY,DAY_HOUR,DAY_MICROSECOND,DAY_MINUTE,DAY_SECOND,DAYOFMONTH,DAYOFWEEK,DAYOFYEAR,DBCC,DEALLOCATE,DEC,DECIMAL,DECLARE,DEFAULT,DEFAULTS,DEFERRABLE,DEFERRED,DEFINED,DEFINER,DEGREE,DELAY_KEY_WRITE,DELAYED,DELETE,DELIMITER,DELIMITERS,DENSE_RANK,DENY,DEPTH,DEREF,DERIVED,DESC,DESCRIBE,DESCRIPTOR,DESTROY,DESTRUCTOR,DETERMINISTIC,DIAGNOSTICS,DICTIONARY,DISABLE,DISCONNECT,DISK,DISPATCH,DISTINCT,DISTINCTROW,DISTRIBUTED,DIV,DO,DOMAIN,DOUBLE,DROP,DUAL,DUMMY,DUMP,DYNAMIC,DYNAMIC_FUNCTION,DYNAMIC_FUNCTION_CODE,EACH,ELEMENT,ELSE,ELSEIF,ENABLE,ENCLOSED,ENCODING,ENCRYPTED,END,END-EXEC,ENUM,EQUALS,ERRLVL,ESCAPE,ESCAPED,EVERY,EXCEPT,EXCEPTION,EXCLUDE,EXCLUDING,EXCLUSIVE,EXEC,EXECUTE,EXISTING,EXISTS,EXIT,EXP,EXPLAIN,EXTERNAL,EXTRACT,FALSE,FETCH,FIELDS,FILE,FILLFACTOR,FILTER,FINAL,FIRST,FLOAT,FLOAT4,FLOAT8,FLOOR,FLUSH,FOLLOWING,FOR,FORCE,FOREIGN,FORTRAN,FORWARD,FOUND,FREE,FREETEXT,FREETEXTTABLE,FREEZE,FROM,FULL,FULLTEXT,FUNCTION,FUSION,G,GENERAL,GENERATED,GET,GLOBAL,GO,GOTO,GRANT,GRANTED,GRANTS,GREATEST,GROUP,GROUPING,HANDLER,HAVING,HEADER,HEAP,HIERARCHY,HIGH_PRIORITY,HOLD,HOLDLOCK,HOST,HOSTS,HOUR,HOUR_MICROSECOND,HOUR_MINUTE,HOUR_SECOND,IDENTIFIED,IDENTITY,IDENTITY_INSERT,IDENTITYCOL,IF,IGNORE,ILIKE,IMMEDIATE,IMMUTABLE,IMPLEMENTATION,IMPLICIT,IN,INCLUDE,INCLUDING,INCREMENT,INDEX,INDICATOR,INFILE,INFIX,INHERIT,INHERITS,INITIAL,INITIALIZE,INITIALLY,INNER,INOUT,INPUT,INSENSITIVE,INSERT,INSERT_ID,INSTANCE,INSTANTIABLE,INSTEAD,INT,INT1,INT2,INT3,INT4,INT8,INTEGER,INTERSECT,INTERSECTION,INTERVAL,INTO,INVOKER,IS,ISAM,ISNULL,ISOLATION,ITERATE,JOIN,K,KEY,KEY_MEMBER,KEY_TYPE,KEYS,KILL,LANCOMPILER,LANGUAGE,LARGE,LAST,LAST_INSERT_ID,LATERAL,LEADING,LEAST,LEAVE,LEFT,LENGTH,LESS,LEVEL,LIKE,LIMIT,LINENO,LINES,LISTEN,LN,LOAD,LOCAL,LOCALTIME,LOCALTIMESTAMP,LOCATION,LOCATOR,LOCK,LOGIN,LOGS,LONG,LONGBLOB,LONGTEXT,LOOP,LOW_PRIORITY,LOWER,M,MAP,MATCH,MATCHED,MAX,MAX_ROWS,MAXEXTENTS,MAXVALUE,MEDIUMBLOB,MEDIUMINT,MEDIUMTEXT,MEMBER,MERGE,MESSAGE_LENGTH,MESSAGE_OCTET_LENGTH,MESSAGE_TEXT,METHOD,MIDDLEINT,MIN,MIN_ROWS,MINUS,MINUTE,MINUTE_MICROSECOND,MINUTE_SECOND,MINVALUE,MLSLABEL,MOD,MODE,MODIFIES,MODIFY,MODULE,MONTH,MONTHNAME,MORE,MOVE,MULTISET,MUMPS,MYISAM,NAME,NAMES,NATIONAL,NATURAL,NCHAR,NCLOB,NESTING,NEW,NEXT,NO,NO_WRITE_TO_BINLOG,NOAUDIT,NOCHECK,NOCOMPRESS,NOCREATEDB,NOCREATEROLE,NOCREATEUSER,NOINHERIT,NOLOGIN,NONCLUSTERED,NONE,NORMALIZE,NORMALIZED,NOSUPERUSER,NOT,NOTHING,NOTIFY,NOTNULL,NOWAIT,NULL,NULLABLE,NULLIF,NULLS,NUMBER,NUMERIC,OBJECT,OCTET_LENGTH,OCTETS,OF,OFF,OFFLINE,OFFSET,OFFSETS,OIDS,OLD,ON,ONLINE,ONLY,OPEN,OPENDATASOURCE,OPENQUERY,OPENROWSET,OPENXML,OPERATION,OPERATOR,OPTIMIZE,OPTION,OPTIONALLY,OPTIONS,OR,ORDER,ORDERING,ORDINALITY,OTHERS,OUT,OUTER,OUTFILE,OUTPUT,OVER,OVERLAPS,OVERLAY,OVERRIDING,OWNER,PACK_KEYS,PAD,PARAMETER,PARAMETER_MODE,PARAMETER_NAME,PARAMETER_ORDINAL_POSITION,PARAMETER_SPECIFIC_CATALOG,PARAMETER_SPECIFIC_NAME,PARAMETER_SPECIFIC_SCHEMA,PARAMETERS,PARTIAL,PARTITION,PASCAL,PASSWORD,PATH,PCTFREE,PERCENT,PERCENT_RANK,PERCENTILE_CONT,PERCENTILE_DISC,PLACING,PLAN,PLI,POSITION,POSTFIX,POWER,PRECEDING,PRECISION,PREFIX,PREORDER,PREPARE,PREPARED,PRESERVE,PRIMARY,PRINT,PRIOR,PRIVILEGES,PROC,PROCEDURAL,PROCEDURE,PROCESS,PROCESSLIST,PUBLIC,PURGE,QUOTE,RAID0,RAISERROR,RANGE,RANK,RAW,READ,READS,READTEXT,REAL,RECHECK,RECONFIGURE,RECURSIVE,REF,REFERENCES,REFERENCING,REGEXP,REGR_AVGX,REGR_AVGY,REGR_COUNT,REGR_INTERCEPT,REGR_R2,REGR_SLOPE,REGR_SXX,REGR_SXY,REGR_SYY,REINDEX,RELATIVE,RELEASE,RELOAD,RENAME,REPEAT,REPEATABLE,REPLACE,REPLICATION,REQUIRE,RESET,RESIGNAL,RESOURCE,RESTART,RESTORE,RESTRICT,RESULT,RETURN,RETURNED_CARDINALITY,RETURNED_LENGTH,RETURNED_OCTET_LENGTH,RETURNED_SQLSTATE,RETURNS,REVOKE,RIGHT,RLIKE,ROLE,ROLLBACK,ROLLUP,ROUTINE,ROUTINE_CATALOG,ROUTINE_NAME,ROUTINE_SCHEMA,ROW,ROW_COUNT,ROW_NUMBER,ROWCOUNT,ROWGUIDCOL,ROWID,ROWNUM,ROWS,RULE,SAVE,SAVEPOINT,SCALE,SCHEMA,SCHEMA_NAME,SCHEMAS,SCOPE,SCOPE_CATALOG,SCOPE_NAME,SCOPE_SCHEMA,SCROLL,SEARCH,SECOND,SECOND_MICROSECOND,SECTION,SECURITY,SELECT,SELF,SENSITIVE,SEPARATOR,SEQUENCE,SERIALIZABLE,SERVER_NAME,SESSION,SESSION_USER,SET,SETOF,SETS,SETUSER,SHARE,SHOW,SHUTDOWN,SIGNAL,SIMILAR,SIMPLE,SIZE,SMALLINT,SOME,SONAME,SOURCE,SPACE,SPATIAL,SPECIFIC,SPECIFIC_NAME,SPECIFICTYPE,SQL,SQL_BIG_RESULT,SQL_BIG_SELECTS,SQL_BIG_TABLES,SQL_CALC_FOUND_ROWS,SQL_LOG_OFF,SQL_LOG_UPDATE,SQL_LOW_PRIORITY_UPDATES,SQL_SELECT_LIMIT,SQL_SMALL_RESULT,SQL_WARNINGS,SQLCA,SQLCODE,SQLERROR,SQLEXCEPTION,SQLSTATE,SQLWARNING,SQRT,SSL,STABLE,START,STARTING,STATE,STATEMENT,STATIC,STATISTICS,STATUS,STDDEV_POP,STDDEV_SAMP,STDIN,STDOUT,STORAGE,STRAIGHT_JOIN,STRICT,STRING,STRUCTURE,STYLE,SUBCLASS_ORIGIN,SUBLIST,SUBMULTISET,SUBSTRING,SUCCESSFUL,SUM,SUPERUSER,SYMMETRIC,SYNONYM,SYSDATE,SYSID,SYSTEM,SYSTEM_USER,TABLE,TABLE_NAME,TABLES,TABLESAMPLE,TABLESPACE,TEMP,TEMPLATE,TEMPORARY,TERMINATE,TERMINATED,TEXT,TEXTSIZE,THAN,THEN,TIES,TIME,TIMESTAMP,TIMEZONE_HOUR,TIMEZONE_MINUTE,TINYBLOB,TINYINT,TINYTEXT,TO,TOAST,TOP,TOP_LEVEL_COUNT,TRAILING,TRAN,TRANSACTION,TRANSACTION_ACTIVE,TRANSACTIONS_COMMITTED,TRANSACTIONS_ROLLED_BACK,TRANSFORM,TRANSFORMS,TRANSLATE,TRANSLATION,TREAT,TRIGGER,TRIGGER_CATALOG,TRIGGER_NAME,TRIGGER_SCHEMA,TRIM,TRUE,TRUNCATE,TRUSTED,TSEQUAL,TYPE,UESCAPE,UID,UNBOUNDED,UNCOMMITTED,UNDER,UNDO,UNENCRYPTED,UNION,UNIQUE,UNKNOWN,UNLISTEN,UNLOCK,UNNAMED,UNNEST,UNSIGNED,UNTIL,UPDATE,UPDATETEXT,UPPER,USAGE,USE,USER,USER_DEFINED_TYPE_CATALOG,USER_DEFINED_TYPE_CODE,USER_DEFINED_TYPE_NAME,USER_DEFINED_TYPE_SCHEMA,USING,UTC_DATE,UTC_TIME,UTC_TIMESTAMP,VACUUM,VALID,VALIDATE,VALIDATOR,VALUE,VALUES,VAR_POP,VAR_SAMP,VARBINARY,VARCHAR,VARCHAR2,VARCHARACTER,VARIABLE,VARIABLES,VARYING,VERBOSE,VIEW,VOLATILE,WAITFOR,WHEN,WHENEVER,WHERE,WHILE,WIDTH_BUCKET,WINDOW,WITH,WITHIN,WITHOUT,WORK,WRITE,WRITETEXT,X509,XOR,YEAR,YEAR_MONTH,ZEROFILL,ZONE';
            $array  = explode(',', $string);

            return in_array(strtoupper($key), $array, FALSE);
        }

        /**
         * @param $obj
         *
         * @return mixed
         */
        public static function decode_object($obj)
        {
            $obj_base = base64_decode($obj, TRUE);
            if (!$obj_base) {
                $obj = maybe_unserialize($obj);
            } else {
                $obj = unserialize(gzinflate($obj_base));
            }

            return $obj;
        }

        /**
         * @param $obj
         *
         * @return mixed
         */
        public static function encode_object($obj)
        {
            return base64_encode(gzdeflate(serialize($obj)));
        }

    }

}