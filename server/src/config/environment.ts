export const readEnvironment = (env = process.env) => {
  const production = env.NODE_ENV === 'production';
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be an integer between 1 and 65535');
  const publicAddress = env.PUBLIC_URL || env.RENDER_EXTERNAL_URL;
  if (production && !publicAddress)
    throw new Error('PUBLIC_URL or RENDER_EXTERNAL_URL is required in production');
  const publicUrl = publicAddress ? new URL(publicAddress) : undefined;
  if (publicUrl && !['http:', 'https:'].includes(publicUrl.protocol))
    throw new Error('PUBLIC_URL must be an http(s) URL');
  const origins = (env.ALLOWED_ORIGINS ?? publicUrl?.origin ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (production && origins.length === 0)
    throw new Error('Production requires an allowed browser origin');
  for (const origin of origins) {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin)
      throw new Error('ALLOWED_ORIGINS must contain exact http(s) origins without paths');
  }
  return { production, port, host: env.HOST ?? '0.0.0.0', origins };
};
