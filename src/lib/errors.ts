export function friendlyError(err: any): string {
  const msg: string = err?.message ?? ''

  if (!navigator.onLine) return 'You appear to be offline. Please check your connection and try again.'
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network'))
    return 'A network error occurred. Please check your connection and try again.'
  if (msg.includes('timeout') || msg.includes('Timeout'))
    return 'The request took too long. Please try again.'
  if (msg.includes('401') || msg.includes('Unauthorised') || msg.includes('Unauthorized'))
    return 'Your session has expired. Please sign in again.'
  if (msg.includes('429'))
    return 'Too many requests. Please wait a moment before trying again.'
  if (msg.includes('500') || msg.includes('Internal'))
    return 'Something went wrong on our end. Please try again in a moment.'
  if (msg.includes('too large') || msg.includes('10MB'))
    return msg
  if (msg.includes('Unsupported') || msg.includes('file type'))
    return msg
  if (msg.includes('could not be read') || msg.includes('corrupted') || msg.includes('re-save'))
    return msg

  // Anything we don't recognize — log it for you, show generic message to users
  console.error('Unhandled error:', err)
  return 'Something went wrong processing your request. Please try again, or contact support if this keeps happening.'
}