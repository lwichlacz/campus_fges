<?php
// Désinstallation de l'extension : on efface ses réglages, son journal et les demandes en attente.
if (!defined('WP_UNINSTALL_PLUGIN')) exit;
foreach (['cfges_settings', 'cfges_log', 'cfges_queue', 'cfges_last_test', 'cfges_last_mail', 'cfges_seen_campus', 'cfges_block_used'] as $o) delete_option($o);
foreach (['cfges_formations', 'cfges_campus_check', 'cfges_welcome'] as $t) delete_transient($t);
wp_clear_scheduled_hook('cfges_retry_event');
