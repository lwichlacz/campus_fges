<?php
/**
 * Plugin Name:       Campus FGES 3D
 * Description:       Relie le campus 3D de la FGES au site : les demandes de plaquettes arrivent dans le CRM, les plaquettes PDF se choisissent ici, et un bloc « Campus 3D » s'ajoute à n'importe quelle page.
 * Version:           2.0.2
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            FGES · Université Catholique de Lille
 * Text Domain:       campus-fges
 *
 * Tout se règle dans le menu « Campus 3D » du back-office. Pour les équipes techniques, les réglages sensibles
 * peuvent aussi être posés dans wp-config.php (ils sont alors verrouillés dans l'écran de réglages) :
 *   define('CAMPUS_FGES_CRM_URL',   'https://adresse-du-crm');
 *   define('CAMPUS_FGES_CRM_TOKEN', 'la-clé-d-import');
 *   define('CAMPUS_FGES_CRM_LIVE',  true);
 *   define('CAMPUS_FGES_ORIGINS',   'https://campus.fges.fr');
 */

if (!defined('ABSPATH')) exit;

define('CFGES_VERSION', '2.0.2');
define('CFGES_FILE', __FILE__);
define('CFGES_URL', plugin_dir_url(__FILE__));
define('CFGES_DIR', plugin_dir_path(__FILE__));
define('CFGES_PAGE', 'campus-fges');
define('CFGES_LOG_MAX', 500);

/* =====================================================================
   Réglages
   ===================================================================== */

function cfges_defaults() {
	return [
		'campus_url'    => 'https://lwichlacz.github.io/campus_fges/',
		'crm_url'       => '',
		'token'         => '',
		'live'          => false,
		'origins_extra' => '',
		'notify'        => true,
		'notify_email'  => '',
		'plaquettes'    => [],
	];
}
function cfges_settings() {
	$s = get_option('cfges_settings', []);
	return array_merge(cfges_defaults(), is_array($s) ? $s : []);
}
function cfges_const($k) {
	$map = ['crm_url' => 'CAMPUS_FGES_CRM_URL', 'token' => 'CAMPUS_FGES_CRM_TOKEN', 'live' => 'CAMPUS_FGES_CRM_LIVE', 'origins_extra' => 'CAMPUS_FGES_ORIGINS'];
	return isset($map[$k]) ? $map[$k] : null;
}
function cfges_locked($k) { $c = cfges_const($k); return $c && defined($c); }
function cfges_get($k) {
	if (cfges_locked($k)) return constant(cfges_const($k));
	$s = cfges_settings();
	return isset($s[$k]) ? $s[$k] : null;
}
function cfges_campus_url() {
	$u = trim((string) cfges_get('campus_url'));
	return $u === '' ? '' : trailingslashit($u);
}
function cfges_origin_of($url) {
	$p = wp_parse_url($url);
	if (empty($p['scheme']) || empty($p['host'])) return '';
	return strtolower($p['scheme'] . '://' . $p['host'] . (isset($p['port']) ? ':' . $p['port'] : ''));
}
function cfges_origins() {
	$list = [cfges_origin_of(cfges_campus_url())];
	foreach (preg_split('/[\s,]+/', (string) cfges_get('origins_extra')) as $o) $list[] = rtrim(strtolower(trim($o)), '/');
	return array_values(array_unique(array_filter($list)));
}
function cfges_endpoint() { return rest_url('campus-fges/v1/lead'); }
function cfges_ready() {
	return filter_var(cfges_get('crm_url'), FILTER_VALIDATE_URL) && strlen((string) cfges_get('token')) >= 16;
}
function cfges_live() { return cfges_ready() && (bool) cfges_get('live'); }

/* =====================================================================
   Formations (lues sur le campus, avec une copie dans l'extension)
   ===================================================================== */

function cfges_formations($refresh = false) {
	$cached = get_transient('cfges_formations');
	if (!$refresh && is_array($cached)) return $cached;
	$list = null;
	$campus = cfges_campus_url();
	if ($campus) {
		$r = wp_remote_get($campus . 'formations.json', ['timeout' => 8]);
		if (!is_wp_error($r) && wp_remote_retrieve_response_code($r) === 200) {
			$j = json_decode(wp_remote_retrieve_body($r), true);
			if (is_array($j) && !empty($j['formations'])) $list = $j['formations'];
		}
	}
	if (!$list) {
		$j = json_decode((string) @file_get_contents(CFGES_DIR . 'formations.json'), true);
		$list = is_array($j) && !empty($j['formations']) ? $j['formations'] : [];
	}
	set_transient('cfges_formations', $list, 12 * HOUR_IN_SECONDS);
	return $list;
}
function cfges_formation($id) {
	foreach (cfges_formations() as $f) if ($f['id'] === $id) return $f;
	return null;
}
function cfges_games() { return array_values(array_filter(cfges_formations(), function ($f) { return !empty($f['game']); })); }

/* Lien vers le campus, avec les paramètres de suivi transmis au CRM avec chaque demande */
function cfges_link($formation = '', $medium = 'page', $campaign = '', $source = 'fges.fr') {
	$args = [];
	if ($formation) $args['jeu'] = $formation;
	$args['utm_source'] = $source;
	if ($medium) $args['utm_medium'] = $medium;
	if ($campaign || $formation) $args['utm_campaign'] = $campaign ?: $formation;
	return add_query_arg(array_map('rawurlencode', $args), cfges_campus_url());
}

/* =====================================================================
   Journal des demandes et file d'attente
   ===================================================================== */

function cfges_log_all() { $l = get_option('cfges_log', []); return is_array($l) ? $l : []; }
function cfges_log_save($l) {
	$limit = time() - 400 * DAY_IN_SECONDS;
	$l = array_values(array_filter($l, function ($e) use ($limit) { return $e['t'] >= $limit; }));
	if (count($l) > CFGES_LOG_MAX) $l = array_slice($l, -CFGES_LOG_MAX);
	update_option('cfges_log', $l, false);
}
function cfges_log_add($e) { $l = cfges_log_all(); $l[] = $e; cfges_log_save($l); }
function cfges_log_update($id, $changes) {
	$l = cfges_log_all();
	foreach ($l as &$e) if ($e['id'] === $id) $e = array_merge($e, $changes);
	unset($e);
	cfges_log_save($l);
}
function cfges_queue() { $q = get_option('cfges_queue', []); return is_array($q) ? $q : []; }
function cfges_queue_save($q) { update_option('cfges_queue', $q, false); }

function cfges_mask_email($e) {
	$p = explode('@', $e);
	if (count($p) !== 2) return '…';
	return mb_substr($p[0], 0, 1) . str_repeat('•', max(2, min(6, mb_strlen($p[0]) - 1))) . '@' . $p[1];
}

/* =====================================================================
   Envoi au CRM
   ===================================================================== */

/** Envoie une fiche au CRM. Renvoie true, ou un message d'erreur en français. */
function cfges_send($payload) {
	$r = wp_remote_post(rtrim((string) cfges_get('crm_url'), '/') . '/api/webhooks/wordpress-form', [
		'timeout' => 12,
		'headers' => ['Content-Type' => 'application/json', 'X-Import-Token' => (string) cfges_get('token')],
		'body'    => wp_json_encode($payload),
	]);
	if (is_wp_error($r)) return 'Le CRM ne répond pas (' . $r->get_error_message() . ').';
	$code = (int) wp_remote_retrieve_response_code($r);
	if ($code === 200 || $code === 201) return true;
	if ($code === 403 || $code === 401) return 'Le CRM refuse la clé d\'import : vérifie-la dans Réglages.';
	if ($code === 429) return 'Le CRM reçoit trop de demandes en même temps : nouvel essai automatique.';
	if ($code === 404) return 'Adresse du CRM introuvable (erreur 404) : vérifie-la dans Réglages.';
	if ($code === 422) return 'Le CRM a refusé les données de la demande (erreur 422).';
	return 'Réponse inattendue du CRM (code ' . $code . ').';
}
/** Envoie plusieurs fiches ; renvoie [restantes, dernière erreur]. */
function cfges_send_all($payloads) {
	$left = []; $err = '';
	foreach ($payloads as $p) {
		$res = cfges_send($p);
		if ($res !== true) { $left[] = $p; $err = $res; }
	}
	return [$left, $err];
}

function cfges_notify($err) {
	if (!cfges_get('notify')) return;
	$last = (int) get_option('cfges_last_mail', 0);
	if (time() - $last < HOUR_IN_SECONDS) return;
	update_option('cfges_last_mail', time(), false);
	$to = cfges_get('notify_email') ?: get_option('admin_email');
	$link = admin_url('admin.php?page=' . CFGES_PAGE . '&tab=demandes');
	wp_mail($to, '[Campus 3D] Des demandes de plaquettes attendent d\'arriver au CRM',
		"Bonjour,\n\nUne ou plusieurs demandes de plaquettes venues du campus 3D n'ont pas pu être transmises au CRM.\n\nRaison : $err\n\n" .
		"Rien n'est perdu : elles sont gardées et renvoyées automatiquement toutes les quelques minutes pendant 7 jours.\n" .
		"Pour voir le détail ou les renvoyer tout de suite : $link\n\n(Message envoyé au plus une fois par heure.)");
}

/* Nouvel essai des demandes en attente (toutes les 5 minutes, et à la demande) */
function cfges_retry($force = false) {
	$q = cfges_queue();
	if (!$q) return [0, 0];
	$ok = 0; $ko = 0; $now = time();
	foreach ($q as $id => $item) {
		if (!$force && $item['next'] > $now) continue;
		if (!cfges_live()) break;
		list($left, $err) = cfges_send_all($item['p']);
		if (!$left) {
			unset($q[$id]); $ok++;
			cfges_log_update($id, ['status' => 'envoye', 'err' => '', 'tries' => $item['tries'] + 1]);
		} elseif ($now - $item['since'] > 7 * DAY_IN_SECONDS) {
			unset($q[$id]); $ko++;   // données personnelles effacées après 7 jours d'échec
			cfges_log_update($id, ['status' => 'echec', 'err' => $err . ' Abandon après 7 jours.', 'tries' => $item['tries'] + 1]);
		} else {
			$q[$id]['p'] = $left; $q[$id]['tries']++; $ko++;
			$q[$id]['next'] = $now + min(HOUR_IN_SECONDS, 300 * (2 ** min(4, $q[$id]['tries'] - 1)));
			cfges_log_update($id, ['err' => $err, 'tries' => $q[$id]['tries']]);
		}
	}
	cfges_queue_save($q);
	return [$ok, $ko];
}
add_filter('cron_schedules', function ($s) {
	$s['cfges_5min'] = ['interval' => 300, 'display' => 'Toutes les 5 minutes (Campus 3D)'];
	return $s;
});
add_action('cfges_retry_event', 'cfges_retry');
register_activation_hook(__FILE__, function () {
	if (!wp_next_scheduled('cfges_retry_event')) wp_schedule_event(time() + 300, 'cfges_5min', 'cfges_retry_event');
	// reprise des réglages de l'ancienne extension « relais » s'ils existaient dans wp-config.php : rien à faire, ils restent lus
	add_option('cfges_settings', cfges_defaults(), '', false);
	set_transient('cfges_welcome', 1, 60);
});
register_deactivation_hook(__FILE__, function () { wp_clear_scheduled_hook('cfges_retry_event'); });

/* =====================================================================
   Le relais : POST /wp-json/campus-fges/v1/lead
   ===================================================================== */

add_action('rest_api_init', function () {
	register_rest_route('campus-fges/v1', '/lead', [
		'methods'             => 'POST',
		'callback'            => 'cfges_rest_lead',
		'permission_callback' => function (WP_REST_Request $req) {
			$origin = rtrim(strtolower((string) $req->get_header('origin')), '/');
			return $origin === '' || in_array($origin, cfges_origins(), true);
		},
	]);
	// le campus peut demander les plaquettes à l'avance (lecture seule, aucune donnée personnelle)
	register_rest_route('campus-fges/v1', '/plaquettes', [
		'methods'             => 'GET',
		'callback'            => function () { return new WP_REST_Response(cfges_plaquettes(), 200); },
		'permission_callback' => '__return_true',
	]);
});

function cfges_plaquettes() {
	$p = cfges_settings()['plaquettes'];
	return is_array($p) ? array_filter($p) : [];
}
function cfges_clip($v, $n) {
	$v = is_string($v) ? trim(wp_strip_all_tags($v)) : '';
	return $v === '' ? null : mb_substr($v, 0, $n);
}
function cfges_reply($code, $data) { return new WP_REST_Response($data, $code); }

/* Adresse du visiteur. Derrière un proxy de confiance (à confirmer avec l'hébergeur), poser dans wp-config.php :
   define('CAMPUS_FGES_TRUSTED_PROXY', true); l'adresse est alors lue dans X-Forwarded-For. */
function cfges_client_ip() {
	$ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
	if (defined('CAMPUS_FGES_TRUSTED_PROXY') && CAMPUS_FGES_TRUSTED_PROXY && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
		$first = trim(explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
		if (filter_var($first, FILTER_VALIDATE_IP)) $ip = $first;
	}
	return $ip;
}

/* Anti-rafale, pensé pour la JPO : tout le Wi-Fi du campus et la borne sortent par la même adresse.
   - 5 envois par 10 minutes pour un même couple adresse + e-mail (le vrai visiteur qui insiste) ;
   - 60 envois par 10 minutes pour une même adresse (une salle entière, pas un robot) ;
   - au-delà de 150 envois dans l'heure, tous visiteurs confondus, un e-mail d'alerte part (au plus une fois par heure) ;
   - au-delà de 600 dans l'heure, le relais refuse : un salon entier n'atteint pas ce rythme. */
define('CFGES_MAX_PAIR', 5);
define('CFGES_MAX_IP', 60);
define('CFGES_ALERT_HOUR', 150);
define('CFGES_MAX_HOUR', 600);

function cfges_busy() { return cfges_reply(429, ['ok' => false, 'error' => "Trop d'envois, réessaie dans quelques minutes."]); }
function cfges_hit($key, $ttl) { set_transient($key, (int) get_transient($key) + 1, $ttl); }
function cfges_global_key() { return 'cfges_glob_' . gmdate('YmdH'); }
function cfges_alert_volume($n) {
	$last = (int) get_option('cfges_last_volume_mail', 0);
	if (time() - $last < HOUR_IN_SECONDS) return;
	update_option('cfges_last_volume_mail', time(), false);
	$to = cfges_get('notify_email') ?: get_option('admin_email');
	wp_mail($to, '[Campus 3D] Volume inhabituel de demandes de plaquettes',
		"Bonjour,\n\nLe campus 3D a reçu $n demandes de plaquettes dans l'heure.\n\n" .
		"C'est peut-être un temps fort (journée portes ouvertes, salon), ou un robot. Le détail est dans le back-office : " .
		admin_url('admin.php?page=' . CFGES_PAGE . '&tab=demandes') . "\n\n" .
		"Au-delà de " . CFGES_MAX_HOUR . " demandes dans l'heure, le relais les refuse jusqu'à l'heure suivante.\n\n(Message envoyé au plus une fois par heure.)");
}

function cfges_rest_lead(WP_REST_Request $req) {
	$ip = cfges_client_ip();
	$ipKey = 'cfges_ip_' . md5($ip);
	if ((int) get_transient($ipKey) >= CFGES_MAX_IP) return cfges_busy();
	if ((int) get_transient(cfges_global_key()) >= CFGES_MAX_HOUR) return cfges_busy();

	$raw = $req->get_body();
	if (strlen($raw) > 8000) return cfges_reply(400, ['ok' => false, 'error' => 'Demande illisible.']);
	$d = json_decode($raw, true);
	if (!is_array($d)) return cfges_reply(400, ['ok' => false, 'error' => 'Demande illisible.']);

	// anti-robots : champ piège rempli ou formulaire envoyé trop vite → on fait semblant
	if (!empty($d['website']) || (int) ($d['elapsed'] ?? 0) < 3000) return cfges_reply(200, ['ok' => true]);

	$email = strtolower(trim((string) ($d['email'] ?? '')));
	if (!is_email($email)) return cfges_reply(400, ['ok' => false, 'error' => 'Adresse e-mail invalide.']);
	if (($d['consentement'] ?? null) !== true) return cfges_reply(400, ['ok' => false, 'error' => 'Le consentement est nécessaire pour te recontacter.']);
	$pairKey = 'cfges_pair_' . md5($ip . '|' . $email);
	if ((int) get_transient($pairKey) >= CFGES_MAX_PAIR) return cfges_busy();
	cfges_hit($pairKey, 10 * MINUTE_IN_SECONDS);
	cfges_hit($ipKey, 10 * MINUTE_IN_SECONDS);
	cfges_hit(cfges_global_key(), HOUR_IN_SECONDS + 5 * MINUTE_IN_SECONDS);
	$volume = (int) get_transient(cfges_global_key());
	if ($volume >= CFGES_ALERT_HOUR) cfges_alert_volume($volume);

	$formations = array_slice(array_values(array_filter((array) ($d['formations'] ?? []), 'is_array')), 0, 12);
	$base = [
		'prenom'                => cfges_clip($d['prenom'] ?? '', 80),
		'nom'                   => cfges_clip($d['nom'] ?? '', 80),
		'email'                 => $email,
		'telephone'             => cfges_clip($d['telephone'] ?? '', 30),
		'code_postal'           => cfges_clip($d['code_postal'] ?? '', 10),
		'consentement'          => true,
		'tracking_consentement' => ($d['tracking'] ?? null) === true,
		'source_formulaire'     => 'Campus FGES (jeu 3D)',
		'utm_source'            => cfges_clip($d['utm_source'] ?? '', 80) ?: 'campus-3d',
		'utm_medium'            => cfges_clip($d['utm_medium'] ?? '', 80),
		'utm_campaign'          => cfges_clip($d['utm_campaign'] ?? '', 80),
		// quel jeu a amené la demande : le CRM ignore ces deux champs tant qu'il ne les attend pas
		'jeu_campus'            => cfges_clip($d['jeu'] ?? '', 80),
		'jeux_termines'         => cfges_clip(implode(', ', array_filter(array_map(function ($t) { return is_string($t) ? $t : ''; }, array_slice((array) ($d['jeux_termines'] ?? []), 0, 20)))), 400),
	];
	$payloads = [];
	foreach ($formations ?: [[]] as $f) {
		$p = $base;
		if (!empty($f['name'])) $p['filieres_visees'] = cfges_clip($f['name'], 160);
		if (in_array($f['school'] ?? '', ['FGES', 'ISEA', 'EDN'], true)) $p['entite'] = $f['school'];
		$payloads[] = $p;
	}

	// plaquettes PDF choisies dans le back-office pour les formations demandées
	$plaq = cfges_plaquettes(); $mine = [];
	foreach ($formations as $f) if (!empty($f['id']) && !empty($plaq[$f['id']])) $mine[$f['id']] = $plaq[$f['id']];

	$entry = [
		'id'     => wp_generate_uuid4(),
		't'      => time(),
		'who'    => trim(($base['prenom'] ?: '') . ' ' . ($base['nom'] ? mb_substr($base['nom'], 0, 1) . '.' : '')),
		'email'  => cfges_mask_email($email),
		'f'      => array_values(array_filter(array_map(function ($f) { return isset($f['name']) ? mb_substr((string) $f['name'], 0, 120) : null; }, $formations))),
		'src'    => $base['utm_source'], 'med' => $base['utm_medium'], 'camp' => $base['utm_campaign'],
		'jeu'    => $base['jeu_campus'],
		'status' => 'essai', 'tries' => 0, 'err' => '',
	];
	update_option('cfges_seen_campus', time(), false);

	if (!cfges_live()) {
		cfges_log_add($entry);
		return cfges_reply(200, ['ok' => true, 'sent' => count($payloads), 'dryRun' => true, 'plaquettes' => (object) $mine]);
	}
	list($left, $err) = cfges_send_all($payloads);
	$entry['tries'] = 1;
	if (!$left) $entry['status'] = 'envoye';
	else {
		// le visiteur n'y est pour rien : on garde la demande et on la renverra
		$entry['status'] = 'attente'; $entry['err'] = $err;
		$q = cfges_queue();
		$q[$entry['id']] = ['p' => $left, 'tries' => 1, 'since' => time(), 'next' => time() + 300];
		cfges_queue_save($q);
		cfges_notify($err);
	}
	cfges_log_add($entry);
	return cfges_reply(200, ['ok' => true, 'sent' => count($payloads) - count($left), 'queued' => count($left), 'plaquettes' => (object) $mine]);
}

/* =====================================================================
   Vérifications (tableau de bord)
   ===================================================================== */

/** Le campus en ligne envoie-t-il bien ses demandes à ce site ? (lecture de js/data.js, gardée 10 minutes) */
function cfges_campus_check($refresh = false) {
	$c = get_transient('cfges_campus_check');
	if (!$refresh && is_array($c)) return $c;
	$campus = cfges_campus_url();
	$res = ['ok' => false, 'msg' => ''];
	if (!$campus) $res['msg'] = 'Adresse du campus non renseignée.';
	else {
		$r = wp_remote_get($campus . 'js/data.js', ['timeout' => 8]);
		if (is_wp_error($r) || wp_remote_retrieve_response_code($r) !== 200) $res['msg'] = 'Le campus ne répond pas à cette adresse.';
		else {
			$body = wp_remote_retrieve_body($r);
			if (preg_match('/LEAD_ENDPOINT\s*=\s*"([^"]*)"/', $body, $m)) {
				$found = rtrim($m[1], '/');
				$want = rtrim(cfges_endpoint(), '/');
				if ($found === $want) { $res['ok'] = true; $res['msg'] = 'Le campus envoie ses demandes à ce site.'; }
				elseif ($found === '') $res['msg'] = 'Le campus est encore en mode démo : son formulaire n\'envoie rien.';
				else $res['msg'] = 'Le campus envoie ses demandes ailleurs : ' . $found;
			} else $res['msg'] = 'Réglage du formulaire introuvable dans le campus.';
		}
	}
	set_transient('cfges_campus_check', $res, 10 * MINUTE_IN_SECONDS);
	return $res;
}

function cfges_steps() {
	$test = get_option('cfges_last_test', []);
	$campus = cfges_campus_check();
	$crm_ok = (bool) filter_var(cfges_get('crm_url'), FILTER_VALIDATE_URL);
	$tok_ok = strlen((string) cfges_get('token')) >= 16;
	return [
		['key' => 'crm', 'ok' => $crm_ok && $tok_ok, 'title' => 'Relier le CRM',
			'txt' => $crm_ok && $tok_ok ? 'Adresse et clé du CRM renseignées.' : 'Renseigne l\'adresse du CRM et sa clé d\'import.', 'tab' => 'reglages', 'btn' => 'Ouvrir les réglages'],
		['key' => 'test', 'ok' => !empty($test['ok']), 'title' => 'Tester la connexion',
			'txt' => !empty($test['ok']) ? 'Contact de test bien reçu par le CRM le ' . wp_date('j F à H:i', $test['t']) . '.' : (!empty($test['msg']) ? 'Dernier essai : ' . $test['msg'] : 'Envoie un contact de test pour vérifier que tout passe.'), 'tab' => 'reglages', 'btn' => 'Tester'],
		['key' => 'campus', 'ok' => $campus['ok'], 'title' => 'Brancher le campus sur ce site',
			'txt' => $campus['msg'], 'tab' => 'aide', 'btn' => 'Comment faire ?'],
		['key' => 'live', 'ok' => cfges_live(), 'title' => 'Passer en mode réel',
			'txt' => cfges_live() ? 'Les demandes arrivent dans le CRM.' : 'Mode essai : les demandes sont notées ici mais rien n\'est envoyé au CRM.', 'tab' => 'reglages', 'btn' => 'Choisir le mode'],
		['key' => 'pages', 'ok' => (bool) get_option('cfges_block_used'), 'title' => 'Mettre le campus sur le site',
			'txt' => get_option('cfges_block_used') ? 'Le bloc « Campus 3D » est utilisé sur le site.' : 'Ajoute le bloc « Campus 3D » sur l\'accueil, la page JPO et les fiches formation.', 'tab' => 'pages', 'btn' => 'Voir comment'],
	];
}

/* =====================================================================
   Back-office
   ===================================================================== */

add_action('admin_menu', function () {
	$q = count(cfges_queue());
	$bubble = $q ? ' <span class="awaiting-mod">' . $q . '</span>' : '';
	add_menu_page('Campus 3D', 'Campus 3D' . $bubble, 'manage_options', CFGES_PAGE, 'cfges_page', 'dashicons-location-alt', 58);
});
add_filter('plugin_action_links_' . plugin_basename(__FILE__), function ($links) {
	array_unshift($links, '<a href="' . esc_url(admin_url('admin.php?page=' . CFGES_PAGE)) . '">Tableau de bord</a>');
	return $links;
});
// juste après l'activation : on ouvre le tableau de bord
add_action('admin_init', function () {
	if (get_transient('cfges_welcome') && current_user_can('manage_options') && !isset($_GET['activate-multi'])) {
		delete_transient('cfges_welcome');
		wp_safe_redirect(admin_url('admin.php?page=' . CFGES_PAGE . '&bienvenue=1'));
		exit;
	}
});
// bandeau discret sur les autres écrans tant que rien ne part au CRM, ou si des demandes sont bloquées
add_action('admin_notices', function () {
	if (!current_user_can('manage_options')) return;
	$screen = get_current_screen();
	if ($screen && strpos($screen->id, CFGES_PAGE) !== false) return;
	if (!in_array($screen ? $screen->id : '', ['dashboard', 'plugins'], true)) return;
	$q = count(cfges_queue());
	$url = esc_url(admin_url('admin.php?page=' . CFGES_PAGE));
	if ($q) echo '<div class="notice notice-warning"><p><strong>Campus 3D :</strong> ' . $q . ' demande(s) de plaquette attendent d\'arriver au CRM. <a href="' . $url . '&tab=demandes">Voir</a></p></div>';
	elseif (!cfges_live()) echo '<div class="notice notice-info"><p><strong>Campus 3D :</strong> les demandes de plaquettes ne sont pas encore envoyées au CRM. <a href="' . $url . '">Terminer la mise en route</a></p></div>';
});

add_action('admin_enqueue_scripts', function ($hook) {
	if (strpos($hook, CFGES_PAGE) === false) return;
	wp_enqueue_style('cfges-admin', CFGES_URL . 'assets/admin.css', ['cfges-carte'], CFGES_VERSION);
	wp_enqueue_media();
	// QR codes : petite bibliothèque libre (MIT), chargée seulement dans cet écran du back-office
	wp_enqueue_script('cfges-qr', 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js', [], null, true);
	wp_enqueue_script('cfges-admin', CFGES_URL . 'assets/admin.js', ['jquery', 'cfges-qr'], CFGES_VERSION, true);
	wp_localize_script('cfges-admin', 'CFGES', [
		'ajax'   => admin_url('admin-ajax.php'),
		'nonce'  => wp_create_nonce('cfges'),
		'campus' => cfges_campus_url(),
	]);
});

function cfges_tabs() {
	return ['accueil' => 'Tableau de bord', 'demandes' => 'Demandes', 'pages' => 'Campus sur le site', 'plaquettes' => 'Plaquettes', 'reglages' => 'Réglages', 'aide' => 'Aide'];
}
function cfges_tab_url($t, $extra = []) { return esc_url(add_query_arg(array_merge(['page' => CFGES_PAGE, 'tab' => $t], $extra), admin_url('admin.php'))); }

function cfges_page() {
	if (!current_user_can('manage_options')) return;
	$tab = isset($_GET['tab']) && isset(cfges_tabs()[$_GET['tab']]) ? $_GET['tab'] : 'accueil';
	echo '<div class="wrap cfges">';
	echo '<h1 class="cfges-h1"><span class="dashicons dashicons-location-alt"></span> Campus 3D <small>FGES</small></h1>';
	if (isset($_GET['saved'])) echo '<div class="notice notice-success is-dismissible"><p>Réglages enregistrés.</p></div>';
	echo '<nav class="nav-tab-wrapper">';
	$q = count(cfges_queue());
	foreach (cfges_tabs() as $k => $label) {
		$b = ($k === 'demandes' && $q) ? ' <span class="cfges-pill warn">' . $q . '</span>' : '';
		echo '<a class="nav-tab' . ($k === $tab ? ' nav-tab-active' : '') . '" href="' . cfges_tab_url($k) . '">' . esc_html($label) . $b . '</a>';
	}
	echo '</nav><div class="cfges-body">';
	call_user_func('cfges_tab_' . $tab);
	echo '</div></div>';
}

/* ---------- Tableau de bord ---------- */
function cfges_stats() {
	$log = cfges_log_all(); $now = time();
	$s = ['week' => 0, 'month' => 0, 'all' => count($log), 'attente' => 0, 'echec' => 0, 'essai' => 0, 'by_f' => [], 'by_src' => [], 'days' => array_fill(0, 14, 0)];
	foreach ($log as $e) {
		$age = $now - $e['t'];
		if ($age < 7 * DAY_IN_SECONDS) $s['week']++;
		if ($age < 30 * DAY_IN_SECONDS) $s['month']++;
		if (isset($s[$e['status']])) $s[$e['status']]++;
		$d = (int) floor($age / DAY_IN_SECONDS); if ($d < 14) $s['days'][13 - $d]++;
		if ($age < 30 * DAY_IN_SECONDS) {
			foreach ($e['f'] ?: ['Sans formation précise'] as $f) $s['by_f'][$f] = ($s['by_f'][$f] ?? 0) + 1;
			$src = cfges_source_label($e['src'], $e['med']);
			$s['by_src'][$src] = ($s['by_src'][$src] ?? 0) + 1;
		}
	}
	arsort($s['by_f']); arsort($s['by_src']);
	return $s;
}
function cfges_source_label($src, $med) {
	$m = ['menu' => 'Menu du site', 'accueil' => 'Accueil du site', 'fiche' => 'Fiches formation', 'jpo' => 'Page JPO', 'qr' => 'QR code', 'page' => 'Pages du site'];
	if ($src === 'campus-3d' || !$src) return 'Accès direct au campus';
	if ($med && isset($m[$med])) return $m[$med];
	return $src . ($med ? ' · ' . $med : '');
}

function cfges_tab_accueil() {
	$steps = cfges_steps();
	$done = count(array_filter($steps, function ($s) { return $s['ok']; }));
	$q = count(cfges_queue());
	$st = cfges_stats();
	if ($q) { $cls = 'warn'; $icon = '⏳'; $title = $q . ' demande' . ($q > 1 ? 's attendent' : ' attend') . ' d\'arriver au CRM'; $sub = 'Elles sont gardées et renvoyées toutes seules. Regarde l\'onglet Demandes pour la raison.'; }
	elseif (cfges_live() && $steps[2]['ok']) { $cls = 'ok'; $icon = '✅'; $title = 'Tout fonctionne'; $sub = 'Les demandes de plaquettes du campus 3D arrivent dans le CRM.'; }
	elseif (cfges_live()) { $cls = 'warn'; $icon = '🟡'; $title = 'Le CRM est prêt, le campus pas encore'; $sub = 'Le campus en ligne n\'envoie pas encore ses demandes à ce site.'; }
	elseif (cfges_ready()) { $cls = 'info'; $icon = '🧪'; $title = 'Mode essai'; $sub = 'Les demandes sont notées ici, mais rien n\'est envoyé au CRM.'; }
	else { $cls = 'todo'; $icon = '👋'; $title = isset($_GET['bienvenue']) ? 'Bienvenue ! Quelques minutes pour tout brancher' : 'Mise en route à terminer'; $sub = 'Suis les étapes ci-dessous, dans l\'ordre.'; }

	echo '<div class="cfges-hero ' . $cls . '"><span class="i">' . $icon . '</span><div><h2>' . esc_html($title) . '</h2><p>' . esc_html($sub) . '</p></div>';
	echo '<a class="button button-hero" href="' . esc_url(cfges_campus_url()) . '" target="_blank" rel="noopener">Ouvrir le campus 3D ↗</a></div>';

	echo '<div class="cfges-grid"><div class="cfges-card"><h3>Mise en route <span class="cfges-pill">' . $done . ' / ' . count($steps) . '</span></h3><ol class="cfges-steps">';
	foreach ($steps as $i => $s) {
		echo '<li class="' . ($s['ok'] ? 'ok' : '') . '"><span class="n">' . ($s['ok'] ? '✓' : $i + 1) . '</span><div><b>' . esc_html($s['title']) . '</b><p>' . esc_html($s['txt']) . '</p></div>';
		if (!$s['ok']) echo '<a class="button" href="' . cfges_tab_url($s['tab']) . '">' . esc_html($s['btn']) . '</a>';
		echo '</li>';
	}
	echo '</ol><p class="cfges-mut"><a href="#" data-cfges="recheck">Vérifier à nouveau</a></p></div>';

	echo '<div class="cfges-card"><h3>Demandes de plaquettes</h3><div class="cfges-kpis">';
	echo '<div><b>' . $st['week'] . '</b><span>ces 7 derniers jours</span></div><div><b>' . $st['month'] . '</b><span>ces 30 derniers jours</span></div><div><b>' . $st['all'] . '</b><span>au total</span></div></div>';
	$max = max(1, max($st['days']));
	echo '<div class="cfges-bars" aria-label="Demandes par jour sur 14 jours">';
	foreach ($st['days'] as $i => $n) echo '<i style="height:' . (8 + 92 * $n / $max) . '%" title="' . esc_attr(wp_date('j M', time() - (13 - $i) * DAY_IN_SECONDS) . ' : ' . $n) . '"><em>' . ($n ?: '') . '</em></i>';
	echo '</div><p class="cfges-mut">14 derniers jours</p>';
	if ($st['by_f']) {
		echo '<h4>Formations les plus demandées (30 jours)</h4><ul class="cfges-top">';
		foreach (array_slice($st['by_f'], 0, 5, true) as $f => $n) echo '<li><span>' . esc_html($f) . '</span><b>' . $n . '</b></li>';
		echo '</ul><h4>D\'où viennent les visiteurs</h4><ul class="cfges-top">';
		foreach (array_slice($st['by_src'], 0, 5, true) as $f => $n) echo '<li><span>' . esc_html($f) . '</span><b>' . $n . '</b></li>';
		echo '</ul>';
	} else echo '<p class="cfges-mut">Aucune demande pour l\'instant. Elles s\'afficheront ici dès qu\'un visiteur demandera une plaquette depuis le campus.</p>';
	echo '<p><a class="button" href="' . cfges_tab_url('demandes') . '">Voir toutes les demandes</a></p></div></div>';
}

/* ---------- Demandes ---------- */
function cfges_status_badge($s, $tries = 0) {
	$m = ['envoye' => ['ok', 'Arrivée au CRM'], 'essai' => ['info', 'Mode essai (non envoyée)'], 'attente' => ['warn', 'En attente · ' . $tries . ' essai' . ($tries > 1 ? 's' : '')], 'echec' => ['ko', 'Échec']];
	$x = isset($m[$s]) ? $m[$s] : ['info', $s];
	return '<span class="cfges-pill ' . $x[0] . '">' . esc_html($x[1]) . '</span>';
}
function cfges_tab_demandes() {
	$log = array_reverse(cfges_log_all());
	$q = count(cfges_queue());
	echo '<div class="cfges-card wide"><div class="cfges-row"><h3>Les demandes de plaquettes</h3>';
	if ($q) echo '<button class="button button-primary" data-cfges="retry">' . ($q > 1 ? 'Renvoyer les ' . $q . ' demandes en attente' : 'Renvoyer la demande en attente') . '</button>';
	echo '</div><p class="cfges-mut">Pour protéger la vie privée des visiteurs, ce journal ne garde que le prénom, l\'initiale du nom et une adresse e-mail masquée. La fiche complète est dans le CRM.';
	echo ' Les demandes en attente sont renvoyées automatiquement toutes les quelques minutes pendant 7 jours.</p>';
	if (!$log) { echo '<p class="cfges-empty">Aucune demande pour l\'instant.</p></div>'; return; }
	echo '<table class="widefat striped cfges-table"><thead><tr><th>Date</th><th>Visiteur</th><th>Formations</th><th>Venu par</th><th>État</th></tr></thead><tbody>';
	foreach (array_slice($log, 0, 200) as $e) {
		echo '<tr><td>' . esc_html(wp_date('j M Y · H:i', $e['t'])) . '</td>';
		echo '<td><b>' . esc_html($e['who'] ?: '—') . '</b><br><small>' . esc_html($e['email']) . '</small></td>';
		echo '<td>' . ($e['f'] ? esc_html(implode(', ', $e['f'])) : '<span class="cfges-mut">Présentation générale</span>') . '</td>';
		echo '<td>' . esc_html(cfges_source_label($e['src'], $e['med'])) . ($e['camp'] ? '<br><small>' . esc_html($e['camp']) . '</small>' : '') . (!empty($e['jeu']) ? '<br><small>🎮 ' . esc_html($e['jeu']) . '</small>' : '') . '</td>';
		echo '<td>' . cfges_status_badge($e['status'], $e['tries']) . ($e['err'] ? '<br><small class="cfges-err">' . esc_html($e['err']) . '</small>' : '') . '</td></tr>';
	}
	echo '</tbody></table><p><button class="button-link cfges-danger" data-cfges="clearlog">Vider le journal</button> <span class="cfges-mut">(n\'efface rien dans le CRM ni les demandes en attente)</span></p></div>';
}

/* ---------- Campus sur le site ---------- */
function cfges_tab_pages() {
	$games = cfges_games();
	echo '<div class="cfges-grid"><div class="cfges-card"><h3>1. Le bloc « Campus 3D »</h3>';
	echo '<p>Dans l\'éditeur d\'une page, clique sur <b>+</b> et cherche <b>Campus 3D</b>. Choisis ensuite dans le panneau de droite :</p><ul class="cfges-list">';
	echo '<li><b>Formation</b> : le bouton ouvre directement son mini-jeu, s\'il en a un. Sinon, laisse « Tout le campus ».</li>';
	echo '<li><b>Apparence</b> : une carte avec image (accueil, JPO), un bouton (fiches formation) ou un simple lien (menus, textes).</li>';
	echo '<li><b>Emplacement</b> : sert seulement à savoir d\'où viennent les demandes de plaquettes.</li></ul>';
	echo '<p>Aperçu de la carte :</p><div class="cfges-preview">' . cfges_render(['formation' => '', 'style' => 'carte', 'source' => 'accueil']) . '</div>';
	echo '<p class="cfges-mut">Avec l\'éditeur classique ou un constructeur de page, le même résultat s\'obtient avec un code court, par exemple <code>[campus_3d formation="gestion" style="bouton" emplacement="fiche"]</code>.</p></div>';

	echo '<div class="cfges-card"><h3>2. Un lien ou un QR code</h3><p>Pour un menu, un e-mail, une affiche ou un flyer : choisis, copie, c\'est prêt.</p>';
	echo '<div class="cfges-form"><label>Ouvrir<select id="cfges-l-f"><option value="">Tout le campus</option>';
	foreach ($games as $g) echo '<option value="' . esc_attr($g['id']) . '">Le mini-jeu · ' . esc_html($g['name']) . '</option>';
	echo '</select></label><label>Emplacement<select id="cfges-l-m"><option value="menu">Menu du site</option><option value="accueil">Accueil du site</option><option value="fiche">Fiche formation</option><option value="jpo">Page JPO</option><option value="qr" data-src="jpo">QR code (affiche, flyer, stand)</option><option value="email" data-src="email">E-mail ou newsletter</option><option value="social" data-src="reseaux">Réseaux sociaux</option></select></label>';
	echo '<label>Campagne <small>(facultatif, ex. jpo-2026-11)</small><input id="cfges-l-c" type="text" placeholder="jpo-2026-11"></label></div>';
	echo '<div class="cfges-copy"><input id="cfges-l-out" type="text" readonly><button class="button button-primary" data-cfges="copy" data-target="cfges-l-out">Copier</button></div>';
	echo '<div class="cfges-qr"><div id="cfges-qr"></div><div><p>QR code du lien ci-dessus, prêt à imprimer.</p><button class="button" data-cfges="qrdl">Télécharger le QR code (PNG)</button></div></div></div></div>';

	echo '<div class="cfges-card wide"><h3>Où placer le campus sur fges.fr</h3><table class="widefat striped"><thead><tr><th>Page</th><th>Quoi</th><th>Réglages du bloc</th></tr></thead><tbody>';
	echo '<tr><td>Menu principal</td><td>Un lien « Campus 3D »</td><td>Lien de l\'outil ci-dessus, emplacement « Menu du site »</td></tr>';
	echo '<tr><td>Accueil</td><td>La carte avec image</td><td>Tout le campus · Carte · Accueil</td></tr>';
	echo '<tr><td>Page JPO</td><td>La carte « Prépare ta visite »</td><td>Tout le campus · Carte · Page JPO</td></tr>';
	echo '<tr><td>Fiche d\'une formation avec mini-jeu</td><td>Un bouton vers son jeu</td><td>La formation · Bouton · Fiche formation</td></tr>';
	echo '<tr><td>Fiche d\'une autre formation</td><td>Un lien vers le campus</td><td>Tout le campus · Lien · Fiche formation</td></tr>';
	echo '<tr><td>Affiches, flyers, stand</td><td>Le QR code</td><td>Emplacement « QR code »</td></tr></tbody></table>';
	if ($games) {
		echo '<h4>Formations qui ont un mini-jeu</h4><ul class="cfges-games">';
		foreach ($games as $g) echo '<li><span>' . esc_html($g['game']['icon'] ?? '🎮') . '</span><div><b>' . esc_html($g['name']) . '</b><small>' . esc_html(($g['game']['title'] ?? '') . ' · ' . ($g['game']['dur'] ?? '')) . '</small></div><button class="button button-small" data-cfges="copytext" data-text="' . esc_attr('[campus_3d formation="' . $g['id'] . '" style="bouton" emplacement="fiche"]') . '">Copier le code court</button></li>';
		echo '</ul><p class="cfges-mut">La liste vient du campus en ligne et se met à jour toute seule (au plus tard en 12 h). <a href="#" data-cfges="refresh">Mettre à jour maintenant</a></p>';
	}
	echo '</div>';
}

/* ---------- Plaquettes ---------- */
function cfges_tab_plaquettes() {
	$plaq = cfges_plaquettes();
	$all = cfges_formations();
	echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '"><input type="hidden" name="action" value="cfges_save"><input type="hidden" name="cfges_part" value="plaquettes">';
	wp_nonce_field('cfges_save');
	echo '<div class="cfges-card wide"><div class="cfges-row"><h3>Plaquettes PDF</h3><button class="button button-primary">Enregistrer</button></div>';
	echo '<p>Quand un visiteur demande une plaquette depuis le campus, il reçoit tout de suite le PDF de la formation choisie. <b>Sans PDF, il est renvoyé vers le catalogue de toutes les plaquettes.</b></p>';
	echo '<p class="cfges-mut">Clique sur « Choisir » pour prendre un PDF dans la médiathèque (ou en téléverser un nouveau). Pour mettre à jour une plaquette, choisis simplement le nouveau fichier.</p>';
	$by = [];
	foreach ($all as $f) $by[$f['levelLabel'] ?? $f['level']][] = $f;
	$n = count(array_filter(array_intersect_key($plaq, array_flip(array_column($all, 'id')))));
	echo '<p><span class="cfges-pill ' . ($n ? 'ok' : 'info') . '">' . $n . ' / ' . count($all) . ' formations ont leur plaquette</span></p>';
	foreach ($by as $lvl => $list) {
		echo '<h4>' . esc_html($lvl) . '</h4><table class="widefat striped cfges-plaq"><tbody>';
		foreach ($list as $f) {
			$u = $plaq[$f['id']] ?? '';
			echo '<tr><td class="f"><b>' . esc_html($f['name']) . '</b><small>' . esc_html($f['school']) . '</small></td>';
			echo '<td><div class="cfges-copy"><input type="url" name="plaquettes[' . esc_attr($f['id']) . ']" value="' . esc_attr($u) . '" placeholder="Aucune plaquette : catalogue général">';
			echo '<button type="button" class="button" data-cfges="media">Choisir</button>' . ($u ? '<a class="button" href="' . esc_url($u) . '" target="_blank" rel="noopener">Voir</a>' : '') . '</div></td></tr>';
		}
		echo '</tbody></table>';
	}
	echo '<p><button class="button button-primary">Enregistrer</button></p></div></form>';
}

/* ---------- Réglages ---------- */
function cfges_field_lock($k) { return cfges_locked($k) ? ' disabled title="Défini dans wp-config.php"' : ''; }
function cfges_tab_reglages() {
	$s = cfges_settings();
	$tok = (string) cfges_get('token');
	echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '"><input type="hidden" name="action" value="cfges_save"><input type="hidden" name="cfges_part" value="reglages">';
	wp_nonce_field('cfges_save');
	echo '<div class="cfges-grid"><div class="cfges-card">';

	echo '<h3>Mode d\'envoi</h3><div class="cfges-modes">';
	$live = (bool) cfges_get('live');
	echo '<label class="cfges-mode' . (!$live ? ' on' : '') . '"><input type="radio" name="live" value="0"' . checked(!$live, true, false) . cfges_field_lock('live') . '><b>🧪 Essai</b><span>Les demandes sont notées dans l\'onglet Demandes, rien n\'est envoyé au CRM. Pour vérifier que le campus est bien branché.</span></label>';
	echo '<label class="cfges-mode' . ($live ? ' on' : '') . '"><input type="radio" name="live" value="1"' . checked($live, true, false) . cfges_field_lock('live') . (cfges_ready() ? '' : ' disabled') . '><b>✅ Réel</b><span>Chaque demande crée ou complète le contact dans le CRM.' . (cfges_ready() ? '' : ' <em>Renseigne d\'abord le CRM ci-dessous.</em>') . '</span></label></div>';

	echo '<h3>Le CRM</h3>';
	echo '<label class="cfges-field">Adresse du CRM<input type="url" name="crm_url" value="' . esc_attr((string) cfges_get('crm_url')) . '" placeholder="https://crm.fges.fr"' . cfges_field_lock('crm_url') . '><small>L\'adresse où s\'ouvre le CRM, sans rien après le nom de domaine.</small></label>';
	echo '<label class="cfges-field">Clé d\'import<span class="cfges-copy"><input type="password" name="token" value="" autocomplete="new-password" placeholder="' . ($tok ? '•••••••• (déjà enregistrée, laisse vide pour la garder)' : 'Colle la clé ici') . '"' . cfges_field_lock('token') . '><button type="button" class="button" data-cfges="showpw">Afficher</button></span>';
	echo '<small>C\'est la valeur <code>IMPORT_TOKEN</code> du CRM (16 caractères au moins). Elle reste sur ce serveur : les visiteurs ne la voient jamais.</small></label>';
	echo '<div class="cfges-test"><button type="button" class="button button-primary" data-cfges="test"' . (cfges_ready() ? '' : ' disabled') . '>Envoyer un contact de test au CRM</button><p class="cfges-mut">Crée (ou met à jour) un contact « Test Campus 3D » avec ton adresse e-mail. Tu pourras le supprimer dans le CRM.</p><div id="cfges-test-out"></div></div>';

	echo '</div><div class="cfges-card">';
	echo '<h3>Le campus 3D</h3>';
	echo '<label class="cfges-field">Adresse du campus<input type="url" name="campus_url" value="' . esc_attr($s['campus_url']) . '" placeholder="https://campus.fges.fr/"><small>Seul ce site a le droit d\'envoyer des demandes ici. Elle sert aussi aux liens, au bloc et aux QR codes.</small></label>';
	echo '<label class="cfges-field">Adresse du relais <small>(à donner au campus)</small><span class="cfges-copy"><input type="text" readonly id="cfges-ep" value="' . esc_attr(cfges_endpoint()) . '"><button type="button" class="button" data-cfges="copy" data-target="cfges-ep">Copier</button></span><small>À coller dans <code>js/data.js</code> du campus : <code>LEAD_ENDPOINT</code>.</small></label>';

	echo '<h3>Alertes</h3>';
	echo '<label class="cfges-check"><input type="checkbox" name="notify" value="1"' . checked($s['notify'], true, false) . '> Prévenir par e-mail si des demandes n\'arrivent pas au CRM <small>(au plus une fois par heure)</small></label>';
	echo '<label class="cfges-field">Adresse à prévenir<input type="email" name="notify_email" value="' . esc_attr($s['notify_email']) . '" placeholder="' . esc_attr(get_option('admin_email')) . '"></label>';

	echo '<details class="cfges-adv"><summary>Réglages avancés</summary>';
	echo '<label class="cfges-field">Autres adresses autorisées à envoyer des demandes<textarea name="origins_extra" rows="2" placeholder="https://lwichlacz.github.io"' . cfges_field_lock('origins_extra') . '>' . esc_textarea((string) cfges_get('origins_extra')) . '</textarea><small>Une par ligne. Utile pendant un changement d\'adresse du campus. Autorisées en ce moment : ' . esc_html(implode(', ', cfges_origins())) . '</small></label>';
	if (array_filter(['crm_url', 'token', 'live', 'origins_extra'], 'cfges_locked')) echo '<p class="cfges-mut">🔒 Certains réglages sont définis dans <code>wp-config.php</code> par l\'équipe technique et ne se modifient pas ici.</p>';
	echo '</details>';
	echo '</div></div><p><button class="button button-primary button-hero">Enregistrer les réglages</button></p></form>';
}

/* ---------- Aide ---------- */
function cfges_tab_aide() {
	$ep = cfges_endpoint();
	echo '<div class="cfges-card wide cfges-help">';
	echo '<h3>Comment ça marche</h3><p>Le campus 3D est un site à part (' . esc_html(cfges_campus_url()) . '). Quand un visiteur y demande une plaquette, sa demande passe par ce site WordPress, qui la transmet au CRM avec la clé d\'import. La clé ne quitte jamais ce serveur.</p>';
	echo '<details open><summary>Brancher le campus sur ce site (étape 3)</summary><p>Dans le dépôt du campus, fichier <code>js/data.js</code>, remplacer la ligne <code>export const LEAD_ENDPOINT = "";</code> par :</p><div class="cfges-copy"><input id="cfges-ep2" type="text" readonly value="' . esc_attr('export const LEAD_ENDPOINT = "' . $ep . '";') . '"><button class="button" data-cfges="copy" data-target="cfges-ep2">Copier</button></div><p>Puis lancer <code>python tools/version.py</code>, faire un commit et un push. Le tableau de bord passe au vert en quelques minutes.</p></details>';
	echo '<details><summary>Un visiteur dit qu\'il n\'a rien reçu</summary><p>Ouvre l\'onglet <b>Demandes</b> : si sa demande y figure en « Arrivée au CRM », elle est dans le CRM. En « Mode essai », le mode réel n\'était pas activé. En « En attente », elle partira dès que le CRM répondra.</p></details>';
	echo '<details><summary>Des demandes restent « En attente »</summary><p>La raison est écrite sous chaque demande. Les plus courantes : le CRM est arrêté ou en maintenance (rien à faire, elles repartiront seules), ou la clé d\'import a changé (la recoller dans <b>Réglages</b>, puis « Renvoyer »).</p></details>';
	echo '<details><summary>Le campus change d\'adresse (ex. campus.fges.fr)</summary><p>Mets la nouvelle adresse dans <b>Réglages → Adresse du campus</b>, et l\'ancienne dans <b>Réglages avancés</b> le temps de la bascule. Les liens et le bloc se mettent à jour tout seuls.</p></details>';
	echo '<details><summary>Une extension de sécurité ou de cache bloque les envois</summary><p>Autoriser la route <code>/wp-json/campus-fges/v1/</code> dans l\'extension de sécurité (Wordfence, iThemes…) et l\'exclure du cache. Les permaliens doivent être autre chose que « Simple » (Réglages → Permaliens).</p></details>';
	echo '<details><summary>Données personnelles</summary><p>Ce site ne garde pas les fiches des visiteurs : seulement un journal réduit (prénom, initiale, e-mail masqué) pour suivre les envois, effacé au bout de 13 mois. Une demande en attente est gardée en entier le temps de son envoi, 7 jours au plus. La fiche complète est dans le CRM.</p></details>';
	echo '<details><summary>Pour l\'équipe technique</summary><p>Relais : <code>POST ' . esc_html($ep) . '</code> (origines autorisées : ' . esc_html(implode(', ', cfges_origins())) . '). Anti-robots (champ piège, envoi trop rapide), anti-rafale : ' . CFGES_MAX_PAIR . ' envois par 10 minutes pour un même couple IP + e-mail, ' . CFGES_MAX_IP . ' par IP, alerte e-mail au-delà de ' . CFGES_ALERT_HOUR . ' dans l\'heure, refus au-delà de ' . CFGES_MAX_HOUR . '. Nouvel essai par WP-Cron toutes les 5 minutes. Plaquettes en lecture : <code>GET ' . esc_html(rest_url('campus-fges/v1/plaquettes')) . '</code>. Réglages verrouillables dans <code>wp-config.php</code> : <code>CAMPUS_FGES_CRM_URL</code>, <code>CAMPUS_FGES_CRM_TOKEN</code>, <code>CAMPUS_FGES_CRM_LIVE</code>, <code>CAMPUS_FGES_ORIGINS</code>, et <code>CAMPUS_FGES_TRUSTED_PROXY</code> si le site est derrière un proxy de confiance.</p></details>';
	echo '</div>';
}

/* ---------- Enregistrement ---------- */
add_action('admin_post_cfges_save', function () {
	if (!current_user_can('manage_options')) wp_die('Accès refusé.');
	check_admin_referer('cfges_save');
	$s = cfges_settings();
	$part = sanitize_key($_POST['cfges_part'] ?? '');
	if ($part === 'plaquettes') {
		$p = [];
		foreach ((array) ($_POST['plaquettes'] ?? []) as $id => $url) {
			$url = esc_url_raw(trim(wp_unslash($url)));
			if ($url) $p[sanitize_key($id)] = $url;
		}
		$s['plaquettes'] = $p;
	} else {
		$s['campus_url'] = esc_url_raw(trim(wp_unslash($_POST['campus_url'] ?? '')));
		if (!cfges_locked('crm_url')) $s['crm_url'] = untrailingslashit(esc_url_raw(trim(wp_unslash($_POST['crm_url'] ?? ''))));
		if (!cfges_locked('token')) { $t = trim(wp_unslash($_POST['token'] ?? '')); if ($t !== '') $s['token'] = sanitize_text_field($t); }
		if (!cfges_locked('live')) $s['live'] = !empty($_POST['live']);
		if (!cfges_locked('origins_extra')) $s['origins_extra'] = sanitize_textarea_field(wp_unslash($_POST['origins_extra'] ?? ''));
		$s['notify'] = !empty($_POST['notify']);
		$s['notify_email'] = sanitize_email(wp_unslash($_POST['notify_email'] ?? ''));
		delete_transient('cfges_campus_check');
		delete_transient('cfges_formations');
	}
	update_option('cfges_settings', $s, false);
	if ($part !== 'plaquettes') { $s2 = cfges_settings(); if (!empty($s2['live']) && !cfges_ready()) { $s2['live'] = false; update_option('cfges_settings', $s2, false); } }
	wp_safe_redirect(add_query_arg(['page' => CFGES_PAGE, 'tab' => $part === 'plaquettes' ? 'plaquettes' : 'reglages', 'saved' => 1], admin_url('admin.php')));
	exit;
});

/* ---------- Actions rapides (AJAX) ---------- */
add_action('wp_ajax_cfges', function () {
	if (!current_user_can('manage_options')) wp_send_json_error('Accès refusé.', 403);
	check_ajax_referer('cfges', 'nonce');
	$what = sanitize_key($_POST['what'] ?? '');
	if ($what === 'test') {
		if (!cfges_ready()) wp_send_json_error('Renseigne et enregistre d\'abord l\'adresse et la clé du CRM.');
		$h = wp_remote_get(rtrim((string) cfges_get('crm_url'), '/') . '/health', ['timeout' => 8]);
		if (is_wp_error($h) || wp_remote_retrieve_response_code($h) !== 200) {
			$msg = is_wp_error($h) ? 'Le CRM ne répond pas à cette adresse (' . $h->get_error_message() . ').' : 'Aucun CRM trouvé à cette adresse (code ' . wp_remote_retrieve_response_code($h) . ') : vérifie-la.';
			update_option('cfges_last_test', ['ok' => false, 't' => time(), 'msg' => $msg], false);
			wp_send_json_error($msg);
		}
		$admin = (string) get_option('admin_email');
		$mail = strpos($admin, '@') ? preg_replace('/@/', '+campus3d@', $admin, 1) : $admin;
		$res = cfges_send(['prenom' => 'Test', 'nom' => 'Campus 3D', 'email' => $mail, 'consentement' => true, 'source_formulaire' => 'Campus FGES (jeu 3D)', 'utm_source' => 'test-wordpress', 'filieres_visees' => 'Test de connexion']);
		$ok = $res === true;
		$msg = $ok ? 'Le CRM a bien reçu le contact de test (' . $mail . ').' : $res;
		update_option('cfges_last_test', ['ok' => $ok, 't' => time(), 'msg' => $msg], false);
		$ok ? wp_send_json_success($msg) : wp_send_json_error($msg);
	}
	if ($what === 'retry') {
		if (!cfges_live()) wp_send_json_error('Passe d\'abord en mode réel dans Réglages.');
		list($ok, $ko) = cfges_retry(true);
		wp_send_json_success($ok . ' envoyée(s)' . ($ko ? ', ' . $ko . ' toujours en attente' : '') . '.');
	}
	if ($what === 'clearlog') { update_option('cfges_log', [], false); wp_send_json_success('Journal vidé.'); }
	if ($what === 'recheck') { cfges_campus_check(true); wp_send_json_success('ok'); }
	if ($what === 'refresh') { cfges_formations(true); wp_send_json_success('ok'); }
	wp_send_json_error('Action inconnue.');
});

/* =====================================================================
   Le bloc « Campus 3D » et le code court [campus_3d]
   ===================================================================== */

function cfges_render($a) {
	$a = wp_parse_args($a, ['formation' => '', 'style' => 'carte', 'texte' => '', 'source' => 'page', 'titre' => '']);
	$campus = cfges_campus_url();
	if (!$campus) return '';
	$f = $a['formation'] ? cfges_formation($a['formation']) : null;
	$game = $f && !empty($f['game']) ? $f['game'] : null;
	$url = cfges_link($game ? $f['id'] : '', sanitize_key($a['source']) ?: 'page', $f ? $f['id'] : '');
	$btn = $a['texte'] ?: ($game ? 'Jouer au mini-jeu ' . ($game['title'] ?? '') : 'Visiter le campus en 3D');
	wp_enqueue_style('cfges-carte');
	if (!is_admin()) update_option('cfges_block_used', 1, true);
	if ($a['style'] === 'lien') return '<a class="cfges-lien" href="' . esc_url($url) . '">' . esc_html($btn) . ' →</a>';
	if ($a['style'] === 'bouton') {
		return '<p class="cfges-wrapbtn"><a class="cfges-btn" href="' . esc_url($url) . '">' . ($game ? '<span aria-hidden="true">' . esc_html($game['icon'] ?? '🎮') . '</span> ' : '') . esc_html($btn) . '</a>' .
			($game ? '<small>' . esc_html(($game['dur'] ?? '') . ' · dans le campus 3D de la FGES') . '</small>' : '') . '</p>';
	}
	$title = $a['titre'] ?: ($game ? $game['title'] : 'Visite le campus de la FGES en 3D');
	$txt = $game ? ($game['pitch'] ?? '') : 'Promène-toi dans le quartier Vauban et à Euratechnologies, découvre les formations et joue à leurs mini-jeux.';
	return '<div class="cfges-carte"><a class="cfges-img" href="' . esc_url($url) . '" tabindex="-1" aria-hidden="true"><img src="' . esc_url($campus . 'img/carte.jpg') . '" onerror="this.onerror=null;this.src=\'' . esc_url($campus . 'img/apercu.jpg') . '\'" alt="" loading="lazy" width="782" height="510"></a>' .
		'<div class="cfges-txt"><p class="cfges-k">' . ($game ? esc_html(($game['icon'] ?? '🎮') . ' Mini-jeu · ' . ($game['dur'] ?? '')) : '🏛️ Campus 3D') . '</p><h3>' . esc_html($title) . '</h3><p>' . esc_html($txt) . '</p>' .
		'<a class="cfges-btn" href="' . esc_url($url) . '">' . esc_html($btn) . ' →</a></div></div>';
}
add_shortcode('campus_3d', function ($atts) {
	$a = shortcode_atts(['formation' => '', 'style' => 'carte', 'texte' => '', 'emplacement' => 'page', 'titre' => ''], $atts, 'campus_3d');
	$a['source'] = $a['emplacement'];
	return cfges_render($a);
});
add_action('init', function () {
	if (!function_exists('register_block_type')) return;
	wp_register_style('cfges-carte', CFGES_URL . 'assets/carte.css', [], CFGES_VERSION);
	wp_register_script('cfges-bloc', CFGES_URL . 'assets/bloc.js', ['wp-blocks', 'wp-element', 'wp-components', 'wp-block-editor', 'wp-server-side-render'], CFGES_VERSION, true);
	register_block_type('campus-fges/campus-3d', [
		'editor_script'   => 'cfges-bloc',
		'style'           => 'cfges-carte',   // chargé sur le site et dans l'éditeur
		'render_callback' => 'cfges_render',
		'attributes'      => [
			'formation' => ['type' => 'string', 'default' => ''],
			'style'     => ['type' => 'string', 'default' => 'carte'],
			'texte'     => ['type' => 'string', 'default' => ''],
			'source'    => ['type' => 'string', 'default' => 'page'],
		],
	]);
});
add_action('enqueue_block_editor_assets', function () {
	$opts = [['value' => '', 'label' => 'Tout le campus']];
	foreach (cfges_formations() as $f) $opts[] = ['value' => $f['id'], 'label' => (!empty($f['game']) ? '🎮 ' : '') . $f['name']];
	wp_localize_script('cfges-bloc', 'CFGES_BLOC', ['formations' => $opts]);
});
