import nodemailer from "nodemailer";
import QRCode from "qrcode";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Méthode non autorisée" });
	}

	const {
		to,
		prenom,
		nom,
		eventTitle,
		eventDate,
		eventTime,
		ticketCode,
		placesCount,
	} = req.body;

	if (!to || !ticketCode) {
		return res.status(400).json({ error: "Paramètres manquants" });
	}

	try {
		// 1. Générer le QR code sous forme de Buffer (PNG)
		const qrCodeBuffer = await QRCode.toBuffer(ticketCode, {
			type: "png",
			width: 250,
			margin: 2,
		});

		// 2. Transpoteur Nodemailer avec Gmail SMTP
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.GMAIL_USER,
				pass: process.env.GMAIL_APP_PASSWORD,
			},
		});

		// 3. E-mail structuré avec image CID
		const mailOptions = {
			from: '"Cultura Saint-Aunès" <' + process.env.GMAIL_USER + ">",
			to: to,
			subject: `Votre billet pour : ${eventTitle} - Cultura Saint-Aunès`,
			html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <div style="background-color: #034475; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; font-size: 20px;">Cultura Saint-Aunès</h2>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #cbd5e1;">Confirmation de réservation</p>
          </div>
          
          <div style="padding: 20px;">
            <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
            <p>Votre réservation pour l'événement ci-dessous a bien été enregistrée :</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #034475;">
              <h3 style="margin: 0 0 10px 0; color: #034475; font-size: 18px;">${eventTitle}</h3>
              <p style="margin: 5px 0; font-size: 14px;">📅 <strong>Date :</strong> ${eventDate} à ${eventTime}</p>
              <p style="margin: 5px 0; font-size: 14px;">🎟️ <strong>Nombre de places :</strong> ${placesCount || 1}</p>
            </div>

            <p style="text-align: center; margin-top: 25px;">Présentez ce QR code à l'entrée de l'événement :</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <img src="cid:qrcode" alt="QR Code Billet" style="width: 200px; height: 200px; border: 4px solid #f1f5f9; border-radius: 8px;" />
            </div>

            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 30px;">
              Cultura Saint-Aunès • Ecoparc St Aunès • 04 67 40 75 80
            </p>
          </div>
        </div>
      `,
			attachments: [
				{
					filename: "qrcode.png",
					content: qrCodeBuffer,
					cid: "qrcode",
				},
			],
		};

		await transporter.sendMail(mailOptions);
		return res
			.status(200)
			.json({ success: true, message: "E-mail envoyé avec succès" });
	} catch (error) {
		console.error("Erreur d'envoi :", error);
		return res.status(500).json({ error: error.message });
	}
}
