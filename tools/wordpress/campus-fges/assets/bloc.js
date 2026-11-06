/* Bloc « Campus 3D » pour l'éditeur de pages (sans étape de compilation) */
(function (wp) {
	const el = wp.element.createElement;
	const { InspectorControls, useBlockProps } = wp.blockEditor;
	const { PanelBody, SelectControl, TextControl } = wp.components;
	const SSR = wp.serverSideRender;
	const formations = (window.CFGES_BLOC && window.CFGES_BLOC.formations) || [{ value: "", label: "Tout le campus" }];

	wp.blocks.registerBlockType("campus-fges/campus-3d", {
		apiVersion: 2,
		title: "Campus 3D",
		description: "Une carte, un bouton ou un lien vers le campus 3D de la FGES, ou directement vers le mini-jeu d'une formation.",
		icon: "location-alt",
		category: "widgets",
		keywords: ["campus", "3d", "fges", "jeu", "visite"],
		attributes: {
			formation: { type: "string", default: "" },
			style: { type: "string", default: "carte" },
			texte: { type: "string", default: "" },
			source: { type: "string", default: "page" }
		},
		edit: function (props) {
			const a = props.attributes, set = props.setAttributes;
			return el("div", useBlockProps(),
				el(InspectorControls, null,
					el(PanelBody, { title: "Réglages du campus 3D", initialOpen: true },
						el(SelectControl, { label: "Formation", help: "🎮 = la formation a un mini-jeu : le bouton l'ouvre directement.", value: a.formation, options: formations, onChange: v => set({ formation: v }) }),
						el(SelectControl, { label: "Apparence", value: a.style, options: [
							{ value: "carte", label: "Carte avec image (accueil, JPO)" },
							{ value: "bouton", label: "Bouton (fiche formation)" },
							{ value: "lien", label: "Simple lien (dans un texte)" }
						], onChange: v => set({ style: v }) }),
						el(SelectControl, { label: "Emplacement", help: "Sert seulement à savoir d'où viennent les demandes de plaquettes.", value: a.source, options: [
							{ value: "accueil", label: "Accueil du site" },
							{ value: "fiche", label: "Fiche formation" },
							{ value: "jpo", label: "Page JPO" },
							{ value: "page", label: "Autre page" }
						], onChange: v => set({ source: v }) }),
						el(TextControl, { label: "Texte du bouton (facultatif)", placeholder: "Visiter le campus en 3D", value: a.texte, onChange: v => set({ texte: v }) })
					)
				),
				el(SSR, { block: "campus-fges/campus-3d", attributes: a })
			);
		},
		save: function () { return null; }
	});
})(window.wp);
