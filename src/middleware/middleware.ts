import type { MiddlewareHandler } from 'astro';

export const onRequest: MiddlewareHandler = async (context, next) => {
	const { pathname } = context.url;
	const accessToken = context.cookies.get('sb-access-token');

	// Permitir acceso libre a signin, register y endpoints de Auth
    if (
        pathname.startsWith('/') ||
		pathname.startsWith('/Module-start/signin') ||
		pathname.startsWith('/Module-start/register') ||
		pathname.startsWith('/api/Auth') ||
		pathname === '/favicon.svg'
	) {
		return next();
	}

	// Si no hay sesión, redirigir a signin
	if (!accessToken) {
		return context.redirect('/Module-start/signin');
	}

	// Si hay sesión, permitir acceso
	return next();
};
