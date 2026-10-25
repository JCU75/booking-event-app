// CONFIGURATION SUPABASE
const SUPABASE_URL = "https://houeubtytanbppotwaey.supabase.co";
const SUPABASE_ANON_KEY =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdWV1YnR5dGFuYnBwb3R3YWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwMzUyOTksImV4cCI6MjEwNjYxMTI5OX0.JJE3UExQuhPLVjrnwkKD6nTNp_9uip2kz6ASjlIG-FY";

const supabaseClient = window.supabase.createClient(
	SUPABASE_URL,
	SUPABASE_ANON_KEY,
);
const animation_url =
	"https://houeubtytanbppotwaey.supabase.co/storage/v1/object/public/CulturaSaintAunes-images/animation.jpg";
const dedicace_url =
	"https://houeubtytanbppotwaey.supabase.co/storage/v1/object/public/CulturaSaintAunes-images/dedicace.jpg";
const loisir_creatif_url =
	"https://houeubtytanbppotwaey.supabase.co/storage/v1/object/public/CulturaSaintAunes-images/loisir_creatif.jpg";

let events = [];
let reservations = {};
let isAdminLoggedIn = sessionStorage.getItem("cultura_admin_logged") === "true";
let html5QrCode = null;

async function loadData() {
	try {
		const { data: evData, error: evError } = await supabaseClient
			.from("events")
			.select("*")
			.order("raw_date", { ascending: true });
		if (evError) throw evError;

		events = evData.map((e) => ({
			id: e.id,
			title: e.title,
			category: e.category,
			rawDate: e.raw_date,
			time: e.time,
			description: e.description,
			maxPlaces: e.max_places,
			image: e.image,
			askAge: e.ask_age,
		}));

		const { data: resData, error: resError } = await supabaseClient
			.from("reservations")
			.select("*");
		if (resError) throw resError;

		reservations = {};
		resData.forEach((r) => {
			if (!reservations[r.event_id]) {
				reservations[r.event_id] = [];
			}
			reservations[r.event_id].push({
				id: r.id,
				nom: r.nom,
				prenom: r.prenom,
				email: r.email,
				telephone: r.telephone,
				age: r.age,
				placesCount: r.places_count || 1,
			});
		});
	} catch (err) {
		console.error("Supabase loading error :", err);
	}
}

function getCategoryStyles(cat) {
	if (cat === "loisir créatif") {
		return {
			label: "Loisir Créatif",
			badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
			img_url: loisir_creatif_url,
		};
	} else if (cat === "dédicace") {
		return {
			label: "Dédicace",
			badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
			img_url: dedicace_url,
		};
	} else {
		return {
			label: "Animation",
			badgeColor: "bg-sky-100 text-sky-800 border-sky-200",
			img_url: animation_url,
		};
	}
}

function getTakenSeats(eventId) {
	if (!reservations[eventId]) return 0;
	return reservations[eventId].reduce(
		(total, r) => total + (r.placesCount || 1),
		0,
	);
}

function formatDateTime(dateString, timeString) {
	if (!dateString) return "Date à venir";
	const options = {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	};
	const date = new Date(dateString);
	const dateFormatee = date.toLocaleDateString("fr-FR", options);
	return timeString ? `${dateFormatee} à ${timeString}` : dateFormatee;
}

function createEventCard(ev) {
	const prises = getTakenSeats(ev.id);
	const restantes = ev.maxPlaces - prises;
	const isComplet = restantes <= 0;
	const styles = getCategoryStyles(ev.category);
	const dateAffichage = formatDateTime(ev.rawDate, ev.time);
	const imageUrl = ev.image || styles.img_url;
	const buttonText = isComplet
		? "Victime de son succès"
		: "Réserver une place";

	const placesLabel = isComplet
		? "Complet"
		: `${restantes} place${restantes > 1 ? "s" : ""} restante${restantes > 1 ? "s" : ""}`;

	const buttonClass = isComplet
		? "w-full bg-gray-200 border-2 border-red-200 font-['Poppins'] text-red-600 font-bold py-2.5 rounded-xl text-base transition-colors duration-200 shadow-sm flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed"
		: "w-full bg-white border-2 border-[#034475] font-['Poppins'] text-[#034475] group-hover:bg-[#034475] group-hover:text-white font-bold py-2.5 rounded-xl text-base transition-colors duration-200 shadow-sm flex items-center justify-center gap-1.5";

	return `
		<div onclick="openModal('${ev.id}')" class="group w-full h-auto md:h-[500px] md:min-w-[320px] md:w-[320px] md:flex-shrink-0 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-slate-200 overflow-hidden flex flex-col justify-between">
			<div class="relative h-40 sm:h-44 w-full overflow-hidden bg-slate-200">
				<img src="${imageUrl}" alt="${ev.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
				<span class="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-white/90 backdrop-blur-sm border ${styles.badgeColor} shadow-sm">
					${styles.label}
				</span>
				<span class="absolute top-3 right-3 text-xs font-bold ${isComplet ? "text-red-500 bg-red-50" : "text-emerald-600 bg-emerald-50"} px-3 py-1 rounded-full uppercase">${placesLabel}</span>
			</div>
			<div class="p-5 flex-grow flex flex-col justify-between space-y-3">
				<div>
					<h3 class="font-['Poppins'] text-lg font-bold text-[#00447F] leading-[19.2px] tracking-[0px] group-hover:text-[#034475] transition leading-snug line-clamp-2 mb-5">${ev.title}</h3>
					<div class="flex justify-between items-center mb-5">
						<span class="font-['Poppins'] text-base font-semibold text-[#1877F2]"><i class="fa-solid fa-calendar-days"></i> ${dateAffichage}</span>
					</div>
					<p class="font-['Poppins'] text-[14px] text-[#1C2D55] leading-[21px] line-clamp-6 mt-1">${ev.description}</p>
				</div>
				<div class="pt-3 border-t border-slate-100 space-y-2.5">
					<button type="button" class="${buttonClass}">
					${buttonText}<span class="group-hover:translate-x-0.5 transition-transform"></span>
					</button>
				</div>
			</div>
		</div>
	`;
}

window.addEventListener("hashchange", router);
window.addEventListener("load", async () => {
	await loadData();
	router();
});

async function router() {
	const hash = window.location.hash;
	const headerActions = document.getElementById("headerActions");
	const main = document.getElementById("mainContainer");

	if (hash === "#admin") {
		if (!isAdminLoggedIn) {
			headerActions.innerHTML = `<a href="#" class="text-xs text-blue-200 hover:text-white"><i class="fa-solid fa-right-from-bracket"></i> Exit</a>`;
			renderLoginView(main);
		} else {
			headerActions.innerHTML = `<button onclick="logoutAdmin()" class="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition"><i class="fa-solid fa-right-from-bracket"></i> Déconnexion</button>`;
			renderAdminDashboard(main);
		}
	} else if (hash === "#admin/create") {
		if (!isAdminLoggedIn) {
			window.location.hash = "#admin";
			return;
		}
		headerActions.innerHTML = `
			<button onclick="window.location.hash='#admin'" 
					class="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition flex items-center justify-center gap-2" 
					title="Retour au tableau de bord">
				<i class="fa-solid fa-arrow-left"></i>
				<span class="hidden sm:inline">Retour au tableau de bord</span>
			</button>
`;
		renderCreateEventView(main);
	} else if (hash.startsWith("#admin/edit/")) {
		if (!isAdminLoggedIn) {
			window.location.hash = "#admin";
			return;
		}
		const eventId = hash.replace("#admin/edit/", "");
		headerActions.innerHTML = `<button onclick="window.location.hash='#admin/manage'" class="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition">← Retour à la gestion</button>`;
		renderEditEventView(main, eventId);
	} else if (hash === "#admin/manage") {
		if (!isAdminLoggedIn) {
			window.location.hash = "#admin";
			return;
		}
		headerActions.innerHTML = `
			<button onclick="window.location.hash='#admin'" 
					class="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition flex items-center justify-center gap-2" 
					title="Retour au tableau de bord">
				<i class="fa-solid fa-arrow-left"></i>
				<span class="hidden sm:inline">Retour au tableau de bord</span>
			</button>
`;
		renderManageEventsView(main);
	} else if (hash === "#admin/scan") {
		if (!isAdminLoggedIn) {
			window.location.hash = "#admin";
			return;
		}
		headerActions.innerHTML = `
			<button onclick="window.location.hash='#admin'" 
					class="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition flex items-center justify-center gap-2" 
					title="Retour au tableau de bord">
				<i class="fa-solid fa-arrow-left"></i>
				<span class="hidden sm:inline">Retour au tableau de bord</span>
			</button>
`;
		renderScanView(main);
	} else {
		headerActions.innerHTML = `
			<a href="#admin"
			class="text-white/30 hover:text-white active:text-white text-base px-2 py-1 transition-colors duration-200"
			title="Espace collaborateur"
			aria-label="Espace collaborateur">
				<i class="fa-solid fa-lock text-xs sm:text-sm"></i>
			</a>
		`;
		renderClientView(main);
	}
}

function renderClientView(container) {
	container.innerHTML = `
		<div class="max-w-6xl mx-auto px-4 sm:px-6 md:pl-0 mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between">
			<div>
				<span class="text-sm md:text-base font-normal font-['Poppins'] tracking-normal text-[#00417A]">
					<i class="fa-regular fa-heart"></i> Partageons nos passions
				</span>
				<h2 class="text-2xl sm:text-3xl md:text-[40px] font-extrabold text-[#00417A] mt-1 leading-tight">
					Vibrez avec nos événements
				</h2>
				<p class="text-xs sm:text-sm text-slate-500 mt-1">${events.length} événement${events.length > 1 ? "s" : ""} à venir</p>
			</div>
		</div>

		<!-- Conteneur : grille sur mobile, carrousel sur desktop -->
		<div class="relative w-full">
			<div
				id="clientEventsScrollContainer"
				class="
					grid grid-cols-1 sm:grid-cols-2 gap-6
					px-4 sm:px-6
					md:flex md:gap-6 md:overflow-x-auto md:no-scrollbar md:scroll-smooth
					md:py-2
					md:pl-[max(1.5rem,calc((100vw-72rem)/2))] md:pr-6
				"
			></div>

			<!-- Flèches visibles uniquement à partir de md -->
			<div class="hidden md:flex justify-center items-center gap-3 mt-6">
				<button onclick="slideCarousel('gauche')" class="w-10 h-10 rounded-full border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-sm transition active:scale-95 font-bold">←</button>
				<button onclick="slideCarousel('droite')" class="w-10 h-10 rounded-full border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-700 shadow-sm transition active:scale-95 font-bold">→</button>
			</div>
		</div>
	`;
	renderClientEventsGrid();
}

function slideCarousel(direction) {
	const container = document.getElementById("clientEventsScrollContainer");
	if (!container) return;
	const scrollAmount = 344;
	container.scrollBy({
		left: direction === "gauche" ? -scrollAmount : scrollAmount,
		behavior: "smooth",
	});
}

function renderClientEventsGrid() {
	const grid = document.getElementById("clientEventsScrollContainer");
	if (!grid) return;
	grid.innerHTML = "";
	events.forEach((ev) => {
		grid.innerHTML += createEventCard(ev);
	});
}

function renderLoginView(container) {
	container.innerHTML = `
		<div class="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 my-12 px-4 pb-6">
			<div class="bg-[#034475] p-6 text-white text-center -mx-4 -mt-4 mb-4">
				<h2 class="text-xl font-bold">Espace Collaborateur</h2>
				<p class="text-xs text-blue-200 mt-1">Connexion sécurisée Cultura Saint-Aunès</p>
			</div>
			<form onsubmit="handleLogin(event)" class="space-y-4">
				<div>
					<label class="block text-xs font-bold text-slate-600 uppercase mb-1">Identifiant</label>
					<input type="text" id="loginUser" required placeholder="admin" class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
				</div>
				<div>
					<label class="block text-xs font-bold text-slate-600 uppercase mb-1">Mot de passe</label>
					<input type="password" id="loginPass" required placeholder="••••••••" class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
				</div>
				<div id="loginError" class="text-xs text-red-500 font-semibold hidden">Identifiant ou mot de passe incorrect.</div>
				<button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition shadow-md">Se connecter</button>
			</form>
		</div>
	`;
}

async function handleLogin(e) {
	e.preventDefault();
	const email = document.getElementById("loginUser").value.trim();
	const password = document.getElementById("loginPass").value.trim();

	const { data, error } = await supabaseClient.auth.signInWithPassword({
		email: email,
		password: password,
	});

	if (error) {
		document.getElementById("loginError").classList.remove("hidden");
		console.error("Erreur de connexion :", error.message);
		return;
	}

	isAdminLoggedIn = true;
	sessionStorage.setItem("cultura_admin_logged", "true");
	document.getElementById("loginError").classList.add("hidden");
	window.location.hash = "#admin";
	router();
}

function logoutAdmin() {
	isAdminLoggedIn = false;
	sessionStorage.removeItem("cultura_admin_logged");
	window.location.hash = "";
	router();
}

function renderAdminDashboard(container) {
	container.innerHTML = `
		<div class="max-w-6xl mx-auto px-6">
			<div class="mb-10 text-center md:text-center">
				<h2 class="font-['Poppins'] text-4xl font-extrabold text-[#00447F]">Tableau de bord Administrateur</h2>
				<p class="text-sm text-slate-600 mt-1">Choisissez une action ci-dessous pour gérer l'agenda du magasin.</p>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
				<div onclick="window.location.hash='#admin/create'" class="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer border border-blue-100 flex flex-col items-center text-center group">
					<div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition"><i class="fa-solid fa-circle-plus"></i></div>
					<h3 class="font-['Poppins'] text-lg font-bold text-[#00447F] group-hover:text-blue-600 transition">Créer un événement</h3>
					<p class="text-xs text-slate-500 mt-2">Ajoutez une nouvelle animation, un loisir créatif ou une dédicace.</p>
				</div>
				<div onclick="window.location.hash='#admin/manage'" class="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer border border-purple-100 flex flex-col items-center text-center group">
					<div class="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition"><i class="fa-solid fa-list-check"></i></div>
					<h3 class="font-['Poppins'] text-lg font-bold text-[#00447F] group-hover:text-purple-600 transition">Gérer les événements & Inscrits</h3>
					<p class="text-xs text-slate-500 mt-2">Modifiez les fiches, consultez les listes d'émargement et gérez les annulations.</p>
				</div>
				<div onclick="window.location.hash='#admin/scan'" class="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition cursor-pointer border border-emerald-100 flex flex-col items-center text-center group">
					<div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition"><i class="fa-solid fa-camera"></i></div>
					<h3 class="font-['Poppins'] text-lg font-bold text-[#00447F] group-hover:text-emerald-600 transition">Scanner les Billets</h3>
					<p class="text-xs text-slate-500 mt-2">Validez les présences en scannant les QR codes à l'entrée.</p>
				</div>
			</div>
		</div>
	`;
}

// GESTION DU SCANNER QR CODE INTÉGRÉ
function renderScanView(container) {
	container.innerHTML = `
		<div class="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 p-6 my-4">
			<h2 class="text-2xl font-bold text-center text-slate-800 mb-1">Contrôle d'accès</h2>
			<p class="text-center text-slate-500 mb-6 text-sm">Cultura Saint-Aunès - Validation des tickets</p>

			<div id="startScanContainer" class="text-center py-4">
				<button onclick="initAndStartScanner()" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl text-lg shadow-lg transition flex items-center justify-center gap-3">
					<i class="fa-solid fa-camera text-2xl"></i> Démarrer le scanner
				</button>
			</div>

			<div id="reader" class="w-full rounded-lg overflow-hidden border border-slate-200 hidden"></div>

			<div id="stopScanContainer" class="mt-4 hidden text-center">
				<button onclick="stopScanner()" class="bg-red-100 hover:bg-red-200 text-red-700 font-bold py-2 px-4 rounded-lg text-sm transition">
					Arrêter la caméra
				</button>
			</div>

			<div id="resultContainer" class="mt-6 hidden p-4 rounded-lg text-center transition-all">
				<p id="resultMessage" class="font-bold text-lg"></p>
				<div id="ticketDetails" class="text-sm mt-2 text-slate-700"></div>
			</div>
		</div>
	`;

	if (typeof Html5Qrcode === "undefined") {
		const script = document.createElement("script");
		script.src = "https://unpkg.com/html5-qrcode";
		document.head.appendChild(script);
	}
}

async function initAndStartScanner() {
	const startContainer = document.getElementById("startScanContainer");
	const readerEl = document.getElementById("reader");
	const stopContainer = document.getElementById("stopScanContainer");

	if (startContainer) startContainer.classList.add("hidden");
	if (readerEl) readerEl.classList.remove("hidden");
	if (stopContainer) stopContainer.classList.remove("hidden");

	if (!html5QrCode) {
		html5QrCode = new Html5Qrcode("reader");
	}

	const config = {
		fps: 10,
		qrbox: { width: 250, height: 250 },
	};

	try {
		await html5QrCode.start(
			{ facingMode: "environment" },
			config,
			onScanSuccess,
			() => {},
		);
	} catch (err) {
		console.error("Erreur caméra arrière :", err);
		try {
			await html5QrCode.start(
				{ facingMode: "user" },
				config,
				onScanSuccess,
				() => {},
			);
		} catch (e) {
			alert(
				"Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.",
			);
			stopScanner();
		}
	}
}

async function stopScanner() {
	if (html5QrCode && html5QrCode.isScanning) {
		try {
			await html5QrCode.stop();
		} catch (e) {
			console.error(e);
		}
	}
	const readerEl = document.getElementById("reader");
	const stopContainer = document.getElementById("stopScanContainer");
	const startContainer = document.getElementById("startScanContainer");

	if (readerEl) readerEl.classList.add("hidden");
	if (stopContainer) stopContainer.classList.add("hidden");
	if (startContainer) startContainer.classList.remove("hidden");
}

async function onScanSuccess(decodedText) {
	if (html5QrCode && html5QrCode.isScanning) {
		try {
			await html5QrCode.stop();
		} catch (e) {}
	}

	const ticketCode = decodedText.trim();
	const resultContainer = document.getElementById("resultContainer");
	const resultMessage = document.getElementById("resultMessage");
	const ticketDetails = document.getElementById("ticketDetails");

	if (!resultContainer) return;

	resultContainer.classList.remove(
		"hidden",
		"bg-green-100",
		"bg-red-100",
		"bg-yellow-100",
		"border-green-400",
		"border-red-400",
		"border-yellow-400",
	);
	resultContainer.classList.add("border");

	const { data, error } = await supabaseClient
		.from("reservations")
		.select("*")
		.eq("ticket_code", ticketCode)
		.single();

	if (error || !data) {
		resultContainer.classList.add("bg-red-100", "border-red-400");
		resultMessage.className = "font-bold text-lg text-red-700";
		resultMessage.innerText = "❌ Billet invalide ou introuvable !";
		ticketDetails.innerText =
			"Ce QR code ne correspond à aucune réservation.";
	} else if (data.checked_in) {
		resultContainer.classList.add("bg-yellow-100", "border-yellow-400");
		resultMessage.className = "font-bold text-lg text-yellow-800";
		resultMessage.innerText = "⚠️ Attention : Billet déjà utilisé !";
		ticketDetails.innerHTML = `Participant : <strong>${data.prenom} ${data.nom}</strong><br>Places : <strong>${data.places_count || 1}</strong>`;
	} else {
		const { error: updateError } = await supabaseClient
			.from("reservations")
			.update({ checked_in: true })
			.eq("id", data.id);

		if (updateError) {
			resultContainer.classList.add("bg-red-100", "border-red-400");
			resultMessage.className = "font-bold text-lg text-red-700";
			resultMessage.innerText = "Erreur réseau lors de la validation.";
		} else {
			resultContainer.classList.add("bg-green-100", "border-green-400");
			resultMessage.className = "font-bold text-lg text-green-700";
			resultMessage.innerText = "✅ Billet valide - Entrée autorisée";
			ticketDetails.innerHTML = `Participant : <strong>${data.prenom} ${data.nom}</strong><br>Nombre de places : <strong class="text-base">${data.places_count || 1}</strong>`;
		}
	}

	setTimeout(() => {
		if (resultContainer) resultContainer.classList.add("hidden");
		initAndStartScanner();
	}, 8000);
}

function renderCreateEventView(container) {
	const nextWeek = new Date();
	nextWeek.setDate(nextWeek.getDate() + 7);
	const defaultDateStr = nextWeek.toISOString().split("T")[0];

	container.innerHTML = `
		<div class="max-w-4xl mx-auto px-6">
			<div class="mb-6">
				<h2 class="font-['Poppins'] text-2xl font-extrabold text-[#00447F]">Créer un nouvel événement</h2>
				<p class="text-xs text-slate-600">Remplissez les informations ci-dessous.</p>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start bg-white p-6 rounded-2xl shadow-md border border-slate-200">
				<form id="newEventQueueForm" onsubmit="addEvent(event)" class="space-y-4">
					<div>
						<label class="block text-xs font-bold text-slate-600 uppercase mb-1">Titre</label>
						<input type="text" id="newTitle" oninput="updatePreview()" required placeholder="Ex: Atelier Peinture" class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
					</div>
					<div>
						<label class="block text-xs font-bold text-slate-600 uppercase mb-1">Catégorie</label>
						<select id="newCategory" onchange="updatePreview()" class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
							<option value="animation">Animation</option>
							<option value="loisir créatif">Loisir créatif</option>
							<option value="dédicace">Dédicace</option>
						</select>
					</div>
					<div class="grid grid-cols-3 gap-3">
						<div>
							<label class="block text-xs font-bold text-slate-600 uppercase mb-1">Date</label>
							<input type="date" id="newDate" onchange="updatePreview()" value="${defaultDateStr}" required class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm">
						</div>
						<div>
							<label class="block text-xs font-bold text-slate-600 uppercase mb-1">Heure</label>
							<input type="time" id="newTime" onchange="updatePreview()" value="15:00" required class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm">
						</div>
						<div>
							<label class="block text-xs font-bold text-slate-600 uppercase mb-1">Places max</label>
							<input type="number" id="newMaxPlaces" oninput="updatePreview()" value="10" min="1" max="100" required class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm">
						</div>
					</div>
					<div>
						<label class="block text-xs font-bold text-slate-600 uppercase mb-1">Description</label>
						<textarea id="newDesc" oninput="updatePreview()" rows="3" required class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm"></textarea>
					</div>
					<div>
						<label class="block text-xs font-bold text-slate-600 uppercase mb-1">Lien de l'image</label>
						<input type="url" id="newImage" oninput="updatePreview()" placeholder="https://images.unsplash.com/..." class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm">
					</div>
					<div class="flex items-center gap-2 pt-2">
						<input type="checkbox" id="newAskAge" class="w-4 h-4 text-blue-600 rounded border-slate-300">
						<label for="newAskAge" class="text-xs font-bold text-slate-700">Demander l'âge des participants</label>
					</div>
					<button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition shadow-md mt-4">Publier l'événement</button>
				</form>
				<div class="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
					<span class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Aperçu en direct</span>
					<div id="cardPreviewContainer" class="w-full flex justify-center"></div>
				</div>
			</div>
		</div>
	`;
	updatePreview();
}

function updatePreview() {
	const dummyEv = {
		id: "preview",
		title:
			document.getElementById("newTitle").value || "Titre de l'événement",
		category: document.getElementById("newCategory").value,
		rawDate: document.getElementById("newDate").value,
		time: document.getElementById("newTime").value,
		maxPlaces:
			parseInt(document.getElementById("newMaxPlaces").value) || 10,
		description:
			document.getElementById("newDesc").value || "Description...",
		image: document.getElementById("newImage").value,
	};
	document.getElementById("cardPreviewContainer").innerHTML =
		createEventCard(dummyEv);
}

async function addEvent(e) {
	e.preventDefault();
	const rawCategory = document
		.getElementById("newCategory")
		.value.trim()
		.toLowerCase();
	const customImage = document.getElementById("newImage").value.trim();

	let defaultImage = animation_url;
	if (rawCategory.includes("dedicace") || rawCategory.includes("dédicace")) {
		defaultImage = dedicace_url;
	} else if (
		rawCategory.includes("loisir") ||
		rawCategory.includes("creatif") ||
		rawCategory.includes("créatif")
	) {
		defaultImage = loisir_creatif_url;
	}

	const newEv = {
		id: "ev-" + Date.now(),
		title: document.getElementById("newTitle").value,
		category: document.getElementById("newCategory").value,
		raw_date: document.getElementById("newDate").value,
		time: document.getElementById("newTime").value,
		max_places:
			parseInt(document.getElementById("newMaxPlaces").value) || 10,
		description: document.getElementById("newDesc").value,
		image: customImage !== "" ? customImage : defaultImage,
		ask_age: document.getElementById("newAskAge").checked,
	};

	const { error } = await supabaseClient.from("events").insert([newEv]);
	if (error) {
		alert("Erreur lors de l'enregistrement : " + error.message);
		return;
	}
	await loadData();
	window.location.hash = "#admin/manage";
}

function renderEditEventView(container, eventId) {
	const ev = events.find((e) => e.id === eventId);
	if (!ev) {
		window.location.hash = "#admin/manage";
		return;
	}

	container.innerHTML = `
		<div class="max-w-2xl mx-auto px-6 bg-white p-8 rounded-2xl shadow-md border border-slate-200">
			<div class="mb-6"><h2 class="text-2xl font-extrabold text-slate-900">Modifier l'événement</h2></div>
			<form onsubmit="saveUpdate(event, '${ev.id}')" class="space-y-4">
				<div>
					<label class="block text-xs font-bold text-slate-600 uppercase mb-1">Titre</label>
					<input type="text" id="editTitle" value="${ev.title}" required class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm">
				</div>
				<div>
					<label class="block text-xs font-bold text-slate-600 uppercase mb-1">Catégorie</label>
					<select id="editCategory" class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm">
						<option value="animation" ${ev.category === "animation" ? "selected" : ""}>Animation</option>
						<option value="loisir créatif" ${ev.category === "loisir créatif" ? "selected" : ""}>Loisir créatif</option>
						<option value="dédicace" ${ev.category === "dédicace" ? "selected" : ""}>Dédicace</option>
					</select>
				</div>
				<div class="grid grid-cols-3 gap-3">
					<div><label class="block text-xs font-bold text-slate-600 uppercase mb-1">Date</label><input type="date" id="editDate" value="${ev.rawDate}" required class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm"></div>
					<div><label class="block text-xs font-bold text-slate-600 uppercase mb-1">Heure</label><input type="time" id="editTime" value="${ev.time || "15:00"}" required class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm"></div>
					<div><label class="block text-xs font-bold text-slate-600 uppercase mb-1">Places max</label><input type="number" id="editMaxPlaces" value="${ev.maxPlaces}" min="1" required class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm"></div>
				</div>
				<div><label class="block text-xs font-bold text-slate-600 uppercase mb-1">Description</label><textarea id="editDesc" rows="3" required class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm">${ev.description}</textarea></div>
				<div><label class="block text-xs font-bold text-slate-600 uppercase mb-1">Lien de l'image</label><input type="url" id="editImage" value="${ev.image || ""}" class="w-full bg-slate-50 border border-slate-300 p-2.5 rounded-lg text-sm"></div>
				<div class="flex items-center gap-2 pt-2">
					<input type="checkbox" id="editAskAge" ${ev.askAge ? "checked" : ""} class="w-4 h-4 text-blue-600 rounded border-slate-300">
					<label for="editAskAge" class="text-xs font-bold text-slate-700">Demander l'âge des participants</label>
				</div>
				<button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm transition shadow-md mt-4">Enregistrer</button>
			</form>
		</div>
	`;
}

async function saveUpdate(e, eventId) {
	e.preventDefault();
	const updated = {
		title: document.getElementById("editTitle").value,
		category: document.getElementById("editCategory").value,
		raw_date: document.getElementById("editDate").value,
		time: document.getElementById("editTime").value,
		max_places:
			parseInt(document.getElementById("editMaxPlaces").value) || 10,
		description: document.getElementById("editDesc").value,
		image: document.getElementById("editImage").value,
		ask_age: document.getElementById("editAskAge").checked,
	};

	const { error } = await supabaseClient
		.from("events")
		.update(updated)
		.eq("id", eventId);
	if (error) {
		alert("Erreur : " + error.message);
		return;
	}
	await loadData();
	window.location.hash = "#admin/manage";
}

function renderManageEventsView(container) {
	container.innerHTML = `
		<div class="max-w-5xl mx-auto px-6">
			<div class="mb-6 flex justify-between items-center">
				<div>
					<h2 class="text-2xl font-extrabold text-slate-900">Gestion des événements</h2>
					<p class="text-xs text-slate-600">Modifiez, visualisez les inscrits ou supprimez des sessions.</p>
				</div>
				<button onclick="window.location.hash='#admin/create'" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow">+ Ajouter</button>
			</div>
			<div class="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
				<table class="w-full text-left border-collapse text-xs">
					<thead>
						<tr class="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px]">
							<th class="py-3 px-4">Événement</th>
							<th class="py-3 px-4">Date & Heure</th>
							<th class="py-3 px-4">Inscrits / Max</th>
							<th class="py-3 px-4 text-right">Actions</th>
						</tr>
					</thead>
					<tbody id="manageTableBody"></tbody>
				</table>
			</div>
		</div>
	`;
	renderManageTable();
}

function renderManageTable() {
	const tbody = document.getElementById("manageTableBody");
	if (!tbody) return;
	tbody.innerHTML = "";
	if (events.length === 0) {
		tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-slate-400">Aucun événement.</td></tr>`;
		return;
	}
	events.forEach((ev) => {
		const prises = getTakenSeats(ev.id);
		const styles = getCategoryStyles(ev.category);
		tbody.innerHTML += `
			<tr class="border-b border-slate-100 hover:bg-slate-50">
				<td class="py-3 px-4"><div class="font-bold text-slate-900">${ev.title}</div><span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${styles.badgeColor}">${styles.label}</span></td>
				<td class="py-3 px-4 text-slate-600 font-medium">${formatDateTime(ev.rawDate, ev.time)}</td>
				<td class="py-3 px-4 font-bold text-slate-700">${prises} / ${ev.maxPlaces} places</td>
				<td class="py-3 px-4 text-right space-x-1">
					<button onclick="window.location.hash='#admin/edit/${ev.id}'" class="bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold px-2.5 py-1.5 rounded">✏ Modifier</button>
					<button onclick="openAdminReservationsModal('${ev.id}')" class="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold px-2.5 py-1.5 rounded">👥 Inscrits</button>
					<button onclick="deleteEvent('${ev.id}')" class="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-2.5 py-1.5 rounded">🗑 Supprimer</button>
				</td>
			</tr>
		`;
	});
}

async function deleteEvent(eventId) {
	if (confirm("Voulez-vous vraiment supprimer cet événement ?")) {
		const { error } = await supabaseClient
			.from("events")
			.delete()
			.eq("id", eventId);
		if (error) {
			alert("Erreur : " + error.message);
			return;
		}
		await loadData();
		renderManageTable();
	}
}

function openAdminReservationsModal(eventId) {
	const ev = events.find((e) => e.id === eventId);
	const list = reservations[eventId] || [];

	document.getElementById("adminResTitle").innerText =
		`Inscrits : ${ev.title}`;
	document.getElementById("adminResSub").innerText =
		`${list.length} réservation(s) - ${getTakenSeats(eventId)} place(s) prise(s) sur ${ev.maxPlaces}`;
	document.getElementById("printEventName").innerText =
		`${ev.title} - ${formatDateTime(ev.rawDate, ev.time)}`;

	const content = document.getElementById("adminResListContent");
	if (list.length === 0) {
		content.innerHTML = `<p class="text-xs text-slate-500 text-center py-6">Aucune réservation.</p>`;
	} else {
		let html = `<table class="w-full text-left border-collapse text-xs"><thead><tr class="border-b border-slate-200 text-slate-400 uppercase text-[10px]"><th class="py-2 px-2">#</th><th class="py-2 px-2">Nom & Prénom</th><th class="py-2 px-2">E-mail</th><th class="py-2 px-2">Téléphone</th><th class="py-2 px-2">Places</th>${ev.askAge ? '<th class="py-2 px-2">Âge</th>' : ""}<th class="py-2 px-2 text-right no-print">Action</th></tr></thead><tbody>`;
		list.forEach((item, index) => {
			html += `
				<tr class="border-b border-slate-100 hover:bg-slate-50">
					<td class="py-2.5 px-2 font-bold text-slate-400">${index + 1}</td>
					<td class="py-2.5 px-2 font-semibold text-slate-800">${item.nom} ${item.prenom}</td>
					<td class="py-2.5 px-2 text-blue-600 underline"><a href="mailto:${item.email}">${item.email}</a></td>
					<td class="py-2.5 px-2 text-slate-600">${item.telephone}</td>
					<td class="py-2.5 px-2 font-bold text-blue-600">${item.placesCount || 1} pl.</td>
					${ev.askAge ? `<td class="py-2.5 px-2 text-slate-600 font-medium">${item.age ? item.age + " ans" : "-"}</td>` : ""}
					<td class="py-2.5 px-2 text-right no-print">
						<button onclick="cancelReservation('${item.id}', '${eventId}')" class="text-red-500 hover:text-red-700 font-bold px-2 py-1 bg-red-50 rounded">Annuler</button>
					</td>
				</tr>
			`;
		});
		html += `</tbody></table>`;
		content.innerHTML = html;
	}
	document
		.getElementById("adminReservationsModal")
		.classList.remove("hidden");
}

function closeAdminReservationsModal() {
	document.getElementById("adminReservationsModal").classList.add("hidden");
	if (window.location.hash === "#admin/manage") renderManageTable();
}

async function cancelReservation(resId, eventId) {
	if (confirm("Voulez-vous vraiment annuler cette réservation ?")) {
		const { error } = await supabaseClient
			.from("reservations")
			.delete()
			.eq("id", resId);
		if (error) {
			alert("Erreur : " + error.message);
			return;
		}
		await loadData();
		openAdminReservationsModal(eventId);
	}
}

function printList() {
	window.print();
}

let currentActiveEventId = null;

function openModal(eventId) {
	if (eventId === "preview") return;
	currentActiveEventId = eventId;
	const ev = events.find((e) => e.id === eventId);
	const prises = getTakenSeats(eventId);
	const restantes = ev.maxPlaces - prises;
	const styles = getCategoryStyles(ev.category);

	document.getElementById("modalCategory").innerText = styles.label;
	document.getElementById("modalTitle").innerText = ev.title;
	document.getElementById("modalDesc").innerText = ev.description;
	document.getElementById("modalDate").innerText = formatDateTime(
		ev.rawDate,
		ev.time,
	);
	document.getElementById("modalPlacesLabel").innerText =
		`${restantes} place${restantes > 1 ? "s" : ""}`;
	document.getElementById("modalMaxPlaces").innerText = ev.maxPlaces;
	document.getElementById("modalEventId").value = ev.id;

	const maxSelectable = Math.min(restantes, 5);
	let optionsHtml = "";
	for (let i = 1; i <= maxSelectable; i++) {
		optionsHtml += `<option value="${i}">${i} place${i > 1 ? "s" : ""}</option>`;
	}

	const ageContainer = document.getElementById("ageFieldContainer");
	if (ev.askAge) {
		ageContainer.innerHTML = `
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
                <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Téléphone</label>
                <input type="tel" id="telephone" required inputmode="tel" placeholder="06..."
                    class="w-full bg-slate-50 border border-slate-300 p-2 rounded-lg text-sm">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Âge</label>
                <input type="number" id="age" required min="1" max="120"
                    class="w-full bg-slate-50 border border-slate-300 p-2 rounded-lg text-sm">
            </div>
            <div class="col-span-2 sm:col-span-1">
                <label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Places</label>
                <select id="placesCount"
                    class="w-full bg-slate-50 border border-slate-300 p-2 rounded-lg text-sm">
                    ${optionsHtml}
                </select>
            </div>
        </div>
    `;
	} else {
		ageContainer.innerHTML = `
			<div class="grid grid-cols-2 gap-3">
				<div><label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Téléphone</label><input type="tel" id="telephone" required placeholder="06..." class="w-full bg-slate-50 border border-slate-300 p-2 rounded-lg text-sm"></div>
				<div><label class="block text-[10px] font-bold text-slate-600 uppercase mb-1">Places</label><select id="placesCount" class="w-full bg-slate-50 border border-slate-300 p-2 rounded-lg text-sm">${optionsHtml}</select></div>
			</div>
		`;
	}

	document.getElementById("reservationForm").reset();
	document.getElementById("modalSuccess").classList.add("hidden");
	document.getElementById("modalDesc").classList.remove("hidden");
	document.getElementById("modalInfoBox").classList.remove("hidden");

	if (restantes <= 0) {
		document.getElementById("modalFormContainer").classList.add("hidden");
		document.getElementById("modalComplet").classList.remove("hidden");
	} else {
		document
			.getElementById("modalFormContainer")
			.classList.remove("hidden");
		document.getElementById("modalComplet").classList.add("hidden");
	}
	document.getElementById("eventModal").classList.remove("hidden");
}

function closeModal() {
	document.getElementById("eventModal").classList.add("hidden");
	if (window.location.hash === "") renderClientEventsGrid();
}

async function submitReservation(e) {
	e.preventDefault();
	const ev = events.find((e) => e.id === currentActiveEventId);
	const prises = getTakenSeats(currentActiveEventId);
	const requestedPlaces =
		parseInt(document.getElementById("placesCount").value) || 1;

	if (prises + requestedPlaces > ev.maxPlaces) {
		alert("Désolé, il ne reste plus assez de places pour cette quantité.");
		return;
	}
	const ticketCode = crypto.randomUUID();

	const newRes = {
		event_id: currentActiveEventId,
		nom: document.getElementById("nom").value,
		prenom: document.getElementById("prenom").value,
		email: document.getElementById("email").value,
		telephone: document.getElementById("telephone").value,
		age: ev.askAge ? parseInt(document.getElementById("age").value) : null,
		places_count: requestedPlaces,
		ticket_code: ticketCode,
		checked_in: false,
	};

	const { error } = await supabaseClient
		.from("reservations")
		.insert([newRes]);
	if (error) {
		alert("Erreur lors de la réservation : " + error.message);
		return;
	}

	await loadData();

	// Population du billet stylisé avec les textes propres (sans double émoji)
	document.getElementById("ticketParticipantName").innerText =
		`${newRes.prenom} ${newRes.nom}`;
	document.getElementById("ticketEventTitle").innerText =
		`Événement : ${ev.title}`;
	document.getElementById("ticketEventDate").innerText = formatDateTime(
		ev.rawDate,
		ev.time,
	);
	document.getElementById("ticketPlacesCount").innerText =
		`Nombre de places : ${requestedPlaces}`;

	// QR code et référence
	const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketCode}`;
	document.getElementById("ticketQrImage").src = qrCodeUrl;
	document.getElementById("ticketCodeDisplay").innerText =
		`Ref: ${ticketCode.substring(0, 8).toUpperCase()}`;

	// Transition d'affichage
	document.getElementById("modalFormContainer").classList.add("hidden");
	// On cache les infos redondantes
	document.getElementById("modalDesc").classList.add("hidden");
	document.getElementById("modalInfoBox").classList.add("hidden");
	document.getElementById("modalSuccess").classList.remove("hidden");

	const nouvellesPrises = getTakenSeats(currentActiveEventId);
	const nouvellesRestantes = ev.maxPlaces - nouvellesPrises;
	document.getElementById("modalPlacesLabel").innerText =
		`${nouvellesRestantes} place${nouvellesRestantes > 1 ? "s" : ""}`;
}
function printTicket() {
	const ev = events.find((e) => e.id === currentActiveEventId);
	if (!ev) return;

	// 1. On récupère le code HTML du ticket
	const ticketHTML = document.getElementById("ticketCardPreview").outerHTML;

	// 2. On crée un nom de fichier propre
	const safeTitle = ev.title.replace(/[^a-zA-Z0-9]/g, "_");
	const dateStr = ev.rawDate || "";

	// 3. On récupère les scripts CSS (Tailwind et FontAwesome) pour que le ticket soit bien stylisé
	const links = Array.from(
		document.querySelectorAll(
			'link[rel="stylesheet"], script[src*="tailwind"]',
		),
	)
		.map((el) => el.outerHTML)
		.join("");

	// 4. On ouvre une nouvelle fenêtre vierge
	const printWindow = window.open("", "_blank");

	// 5. On écrit une page HTML ultra-minimaliste avec juste le ticket
	printWindow.document.write(`
		<!DOCTYPE html>
		<html lang="fr">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Billet_Cultura_${safeTitle}_${dateStr}</title>
			${links}
			<style>
				/* On force la page à avoir 0 marge pour éviter la 2ème page vide */
				@page { margin: 10mm; size: auto; }
				body { 
					margin: 0; 
					padding: 0; 
					display: flex; 
					justify-content: center; 
					align-items: flex-start;
					background: white;
					-webkit-print-color-adjust: exact;
					print-color-adjust: exact;
				}
				/* On donne une taille fixe au ticket pour qu'il soit bien lisible */
				#ticketCardPreview { 
					width: 100% !important; 
					max-width: 340px !important; 
					margin: 0 !important;
				}
			</style>
		</head>
		<body>
			${ticketHTML}
		</body>
		</html>
	`);

	printWindow.document.close();

	// 6. On attend 500ms que le CSS (Tailwind) se charge, puis on imprime
	setTimeout(() => {
		printWindow.focus();
		printWindow.print();
		// On ferme la fenêtre une fois l'impression terminée
		printWindow.onafterprint = () => printWindow.close();
	}, 500);
}
