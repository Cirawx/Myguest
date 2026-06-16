import resend
from app.config import get_settings

settings = get_settings()

resend.api_key = settings.resend_api_key

async def enviar_email_recuperacion(email_destino: str, token: str, nombre: str):
    link = f"{settings.frontend_url}/reset-password?token={token}"

    resend.Emails.send({
        "from": "MyGuest <onboarding@resend.dev>",
        "to": email_destino,
        "subject": "Recuperacion de contrasena - MyGuest",
        "html": f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00529B;">MyGuest - Recuperacion de contrasena</h2>
            <p>Hola <strong>{nombre}</strong>,</p>
            <p>Recibimos una solicitud para restablecer tu contrasena.</p>
            <p>Haz clic en el boton para crear una nueva contrasena:</p>
            <a href="{link}" style="
                display: inline-block;
                padding: 12px 24px;
                background-color: #00529B;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                margin: 16px 0;
            ">
                Restablecer contrasena
            </a>
            <p style="color: #666;">Este link expira en <strong>30 minutos</strong>.</p>
            <p style="color: #666;">Si no solicitaste esto, ignora este correo.</p>
        </div>
        """
    })