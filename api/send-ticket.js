import nodemailer from "nodemailer";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Méthode non autorisée" });
	}

	const {
		email,
		nom,
		prenom,
		eventTitle,
		eventDate,
		placesCount,
		ticketCode,
	} = req.body;
	const gmailPassword = process.env.GMAIL_APP_PASSWORD;

	if (!gmailPassword) {
		return res.status(500).json({
			error: "Mot de passe d'application Gmail manquant sur le serveur",
		});
	}

	// Configuration du serveur SMTP Gmail
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: "csaadmin34130@gmail.com",
			pass: gmailPassword.replace(/\s+/g, ""), // Nettoie les espaces éventuels
		},
	});

	const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticketCode}`;

	const mailOptions = {
		from: '"Cultura Saint-Aunès" <csaadmin34130@gmail.com>',
		to: email,
		subject: `Votre ticket pour l'événement : ${eventTitle}`,
		html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #034475; text-align: center;">Cultura Saint-Aunès</h2>
        <h3 style="text-align: center;">Confirmation de réservation</h3>
        <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
        <p>Nous vous remercions pour votre réservation. Voici les détails de votre participation :</p>
        <ul style="background: #f8fafc; padding: 15px; border-radius: 8px; list-style: none;">
          <li><strong>Événement :</strong> ${eventTitle}</li>
          <li><strong>Date :</strong> ${eventDate}</li>
          <li><strong>Nombre de places :</strong> ${placesCount}</li>
        </ul>
        <p style="text-align: center; margin-top: 20px;"><strong>Voici votre QR code à présenter lors de votre arrivée en magasin :</strong></p>
        <div style="text-align: center; margin: 20px 0;">
          <img src="${qrCodeUrl}" alt="QR Code Ticket" style="width: 180px; height: 180px; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px;" />
        </div>
        <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">Cultura Saint-Aunès - Ecoparc St Aunès</p>
      </div>
    `,
	};

	try {
		await transporter.sendMail(mailOptions);
		return res.status(200).json({ success: true });
	} catch (error) {
		console.error("Erreur d'envoi Gmail :", error);
		return res.status(500).json({ error: error.message });
	}
}
