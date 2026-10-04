/** Sends a 6-digit code to the address the person just typed. */
export async function sendVerificationEmail(to: string): Promise<{ code: string } | { activation: true; message: string }> {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: 'MFY',
      email: to,
      message: `Your MFY verification code is ${code}. Enter it on the sign-up or reset screen. If you did not ask for this, ignore the email.`,
      _subject: 'Your MFY verification code',
      _template: 'box',
      _captcha: 'false',
    }),
  })
  const data = await res.json().catch(() => ({} as { success?: boolean | string; message?: string }))
  const message = String(data?.message || '')
  if (/activat/i.test(message)) return { activation: true, message }
  if (!res.ok || data?.success === false || data?.success === 'false') {
    throw new Error(message || 'Could not send the verification email.')
  }
  return { code }
}
