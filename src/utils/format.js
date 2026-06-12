export const parseApiError = (err, fallback = 'Something went wrong.') => err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback
