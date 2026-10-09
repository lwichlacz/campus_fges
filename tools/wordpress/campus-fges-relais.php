<?php
/**
 * Plugin Name: Campus FGES · relais du formulaire
 * Description: Reçoit les demandes de plaquettes du campus 3D et les transmet au CRM. La clé du CRM reste sur le serveur.
 * Version: 1.0.0
 * Requires PHP: 7.4
 *
 * Installation : déposer ce fichier dans wp-content/plugins/ puis activer l'extension.
 * Réglages, à ajouter dans wp-config.php (jamais dans ce fichier) :
 *
 *   define('CAMPUS_FGES_CRM_URL',   'https://adresse-du-crm');
 *   define('CAMPUS_FGES_CRM_TOKEN', 'la-clé-d-import');
 *   define('CAMPUS_FGES_CRM_LIVE',  false);   // true = envoi réel ; false = mode essai (rien n'est transmis)
 *   define('CAMPUS_FGES_ORIGINS',   'https://lwichlacz.github.io');   // adresse(s) du campus 3D, séparées par des virgules
 *
 * Adresse du relais : https://www.fges.fr/wp-json/campus-fges/v1/lead
 * Même logique que tools/serve.py (relais de développement).
 */

if (!defined('ABSPATH')) exit;

function campus_fges_origins() {
	$list = defined('CAMPUS_FGES_ORIGINS') ? CAMPUS_FGES_ORIGINS : 'https://lwichlacz.github.io';
	return array_filter(array_map(function ($o) { return rtrim(trim($o), '/'); }, explode(',', $list)));
}

// WordPress répond déjà aux requêtes venant d'autres adresses (CORS) : ce relais n'accepte que celles du campus 3D
add_action('rest_api_init', function () {
	register_rest_route('campus-fges/v1', '/lead', [
		'methods'             => 'POST',
		'callback'            => 'campus_fges_lead',
		'permission_callback' => function (WP_REST_Request $req) {
			$origin = rtrim((string) $req->get_header('origin'), '/');
			return $origin === '' || in_array($origin, campus_fges_origins(), true);
		},
	]);
});

function campus_fges_reply($code, $data) {
	return new WP_REST_Response($data, $code);
}

function campus_fges_clip($v, $n) {
	$v = is_string($v) ? trim(wp_strip_all_tags($v)) : '';
	return $v === '' ? null : mb_substr($v, 0, $n);
}

function campus_fges_lead(WP_REST_Request $req) {
	// anti-rafale : 5 envois par 10 minutes et par adresse IP
	$ip  = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
	$key = 'campus_fges_' . md5($ip);
	$hits = (int) get_transient($key);
	if ($hits >= 5) return campus_fges_reply(429, ['ok' => false, 'error' => "Trop d'envois, réessaie dans quelques minutes."]);

	$raw = $req->get_body();
	if (strlen($raw) > 8000) return campus_fges_reply(400, ['ok' => false, 'error' => 'Demande illisible.']);
	$d = json_decode($raw, true);
	if (!is_array($d)) return campus_fges_reply(400, ['ok' => false, 'error' => 'Demande illisible.']);

	// anti-robots : champ piège rempli ou formulaire envoyé trop vite → on fait semblant
	if (!empty($d['website']) || (int) ($d['elapsed'] ?? 0) < 3000) return campus_fges_reply(200, ['ok' => true]);

	$email = strtolower(trim((string) ($d['email'] ?? '')));
	if (!is_email($email)) return campus_fges_reply(400, ['ok' => false, 'error' => 'Adresse e-mail invalide.']);
	if (($d['consentement'] ?? null) !== true) return campus_fges_reply(400, ['ok' => false, 'error' => 'Le consentement est nécessaire pour te recontacter.']);

	$formations = array_slice(array_values(array_filter((array) ($d['formations'] ?? []), 'is_array')), 0, 12);
	if (!$formations) $formations = [[]];
	$base = [
		'prenom'                => campus_fges_clip($d['prenom'] ?? '', 80),
		'nom'                   => campus_fges_clip($d['nom'] ?? '', 80),
		'email'                 => $email,
		'telephone'             => campus_fges_clip($d['telephone'] ?? '', 30),
		'code_postal'           => campus_fges_clip($d['code_postal'] ?? '', 10),
		'consentement'          => true,
		'tracking_consentement' => ($d['tracking'] ?? null) === true,
		'source_formulaire'     => 'Campus FGES (jeu 3D)',
		'utm_source'            => campus_fges_clip($d['utm_source'] ?? '', 80) ?: 'campus-3d',
		'utm_medium'            => campus_fges_clip($d['utm_medium'] ?? '', 80),
		'utm_campaign'          => campus_fges_clip($d['utm_campaign'] ?? '', 80),
	];

	$live = defined('CAMPUS_FGES_CRM_LIVE') && CAMPUS_FGES_CRM_LIVE && defined('CAMPUS_FGES_CRM_TOKEN') && CAMPUS_FGES_CRM_TOKEN && defined('CAMPUS_FGES_CRM_URL') && CAMPUS_FGES_CRM_URL;
	$sent = 0;
	foreach ($formations as $f) {
		$payload = $base;
		if (!empty($f['name'])) $payload['filieres_visees'] = campus_fges_clip($f['name'], 160);
		if (in_array($f['school'] ?? '', ['FGES', 'ISEA', 'EDN'], true)) $payload['entite'] = $f['school'];
		if (!$live) { $sent++; continue; }       // mode essai : rien ne sort du serveur
		$r = wp_remote_post(rtrim(CAMPUS_FGES_CRM_URL, '/') . '/api/webhooks/wordpress-form', [
			'timeout' => 12,
			'headers' => ['Content-Type' => 'application/json', 'X-Import-Token' => CAMPUS_FGES_CRM_TOKEN],
			'body'    => wp_json_encode($payload),
		]);
		if (is_wp_error($r)) { error_log('[Campus FGES] CRM injoignable : ' . $r->get_error_message()); continue; }
		$code = wp_remote_retrieve_response_code($r);
		if ($code === 200 || $code === 201) $sent++;
		else error_log('[Campus FGES] refus du CRM ' . $code . ' : ' . substr(wp_remote_retrieve_body($r), 0, 300));
	}
	set_transient($key, $hits + 1, 10 * MINUTE_IN_SECONDS);
	if ($sent === 0) return campus_fges_reply(502, ['ok' => false, 'error' => 'Le service est momentanément indisponible. Réessaie plus tard.']);
	return campus_fges_reply(200, ['ok' => true, 'sent' => $sent, 'dryRun' => !$live]);
}
