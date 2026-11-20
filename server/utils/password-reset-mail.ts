import { sendMail } from './mail'

type PasswordResetMail = {
  to: string
  locale: string
  resetUrl: string
}

export async function sendPasswordResetMail({ to, locale, resetUrl }: PasswordResetMail) {
  const es = locale === 'es'
  const subject = es ? 'Restablecer contraseña de Hilko' : 'Reset your Hilko password'
  const greeting = es ? 'Hola,' : 'Hello,'
  const body = es
    ? `Recibimos una solicitud para restablecer la contraseña de tu cuenta Hilko.

Usa este enlace dentro de la próxima hora:

${resetUrl}

Si no la solicitaste, puedes ignorar este correo.`
    : `We received a request to reset your Hilko password.

Use this link within the next hour:

${resetUrl}

If you did not request this, you can ignore this email.`

  const html = `
<p>${greeting}</p>
<p>${es ? 'Pulsa el enlace para elegir una contraseña nueva (válido 1 hora):' : 'Click the link below to choose a new password (valid for 1 hour):'}</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p style="color:#57534e;font-size:14px">${es ? 'Si no la solicitaste, ignora este mensaje.' : 'If you did not request this, ignore this message.'}</p>`

  await sendMail({
    to,
    subject,
    text: `${greeting}\n\n${body}`,
    html,
  })
}