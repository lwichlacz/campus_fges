/* Back-office du Campus 3D : actions rapides, liens et QR codes, choix des plaquettes */
(function ($) {
	const toast = msg => { const t = $('<div class="cfges-toast">').text(msg).appendTo("body"); setTimeout(() => t.fadeOut(300, () => t.remove()), 2600); };
	const call = (what, extra) => $.post(CFGES.ajax, Object.assign({ action: "cfges", nonce: CFGES.nonce, what }, extra || {}));
	const copy = text => { (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast("Copié ✓"), () => { window.prompt("Copie ce texte :", text); }); };

	$(document).on("click", "[data-cfges]", function (e) {
		const b = $(this), k = b.data("cfges");
		if (k === "copy") { e.preventDefault(); copy($("#" + b.data("target")).val()); }
		if (k === "copytext") { e.preventDefault(); copy(b.data("text")); }
		if (k === "showpw") { e.preventDefault(); const i = b.siblings("input"); const show = i.attr("type") === "password"; i.attr("type", show ? "text" : "password"); b.text(show ? "Masquer" : "Afficher"); }
		if (k === "test") {
			e.preventDefault(); const out = $("#cfges-test-out").removeClass("ok ko").text("Envoi en cours…"); b.prop("disabled", true);
			call("test").done(r => out.addClass(r.success ? "ok" : "ko").text((r.success ? "✅ " : "❌ ") + r.data)).fail(() => out.addClass("ko").text("❌ Impossible de lancer le test.")).always(() => b.prop("disabled", false));
		}
		if (k === "retry") { e.preventDefault(); b.prop("disabled", true).text("Envoi…"); call("retry").done(r => { toast(r.data); setTimeout(() => location.reload(), 900); }).fail(() => b.prop("disabled", false)); }
		if (k === "clearlog") { e.preventDefault(); if (confirm("Vider le journal des demandes ? (Rien n'est effacé dans le CRM.)")) call("clearlog").done(() => location.reload()); }
		if (k === "recheck" || k === "refresh") { e.preventDefault(); b.text("Vérification…"); call(k).done(() => location.reload()); }
		if (k === "media") {
			e.preventDefault(); const input = b.siblings("input");
			const frame = wp.media({ title: "Choisir la plaquette (PDF)", button: { text: "Utiliser ce PDF" }, library: { type: "application/pdf" }, multiple: false });
			frame.on("select", () => { input.val(frame.state().get("selection").first().get("url")).trigger("change"); toast("Plaquette choisie : pense à enregistrer"); });
			frame.open();
		}
		if (k === "qrdl") { e.preventDefault(); const c = $("#cfges-qr canvas")[0]; if (!c) return; const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = "qr-campus-3d.png"; a.click(); }
	});

	// cartes de choix du mode
	$(document).on("change", ".cfges-mode input", function () { $(".cfges-mode").removeClass("on"); $(this).closest(".cfges-mode").addClass("on"); });

	// générateur de liens
	function buildLink() {
		const out = $("#cfges-l-out"); if (!out.length) return;
		const f = $("#cfges-l-f").val(), opt = $("#cfges-l-m option:selected"), m = opt.val(), c = $.trim($("#cfges-l-c").val());
		const u = new URL(CFGES.campus);
		if (f) u.searchParams.set("jeu", f);
		u.searchParams.set("utm_source", opt.data("src") || "fges.fr");
		u.searchParams.set("utm_medium", m);
		if (c || f) u.searchParams.set("utm_campaign", c || f);
		out.val(u.toString());
		drawQR(u.toString());
	}
	function drawQR(text) {
		const box = $("#cfges-qr"); if (!box.length) return;
		if (typeof window.qrcode !== "function") { box.html('<small style="padding:8px;text-align:center">QR code indisponible (pas de connexion à cdnjs)</small>'); return; }
		const q = window.qrcode(0, "M"); q.addData(text); q.make();
		const n = q.getModuleCount(), cell = 10, m = 4, size = (n + 2*m)*cell;
		const c = document.createElement("canvas"); c.width = c.height = size;
		const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, size, size); g.fillStyle = "#111";
		for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) g.fillRect((k + m)*cell, (r + m)*cell, cell, cell);
		box.empty().append(c);
	}
	$(document).on("change input", "#cfges-l-f, #cfges-l-m, #cfges-l-c", buildLink);
	$(buildLink);
})(jQuery);
