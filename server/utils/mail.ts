import nodemailer from 'nodemailer'

export async function sendMail(options: {
  to: string
  subject: string
  text: string
}) {
  const host = process.env.NUXT_SMTP_HOST ?? 'localhost'
  const port = Number(process.env.NUXT_SMTP_PORT ?? 1025)
  const from = process.env.NUXT_SMTP_FROM ?? 'AccessMap <noreply@accessmap.local>'

  const transport = nodemailer.createTransport({ host, port, secure: false })
  await transport.sendMail({ from, ...options })
}