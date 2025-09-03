import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase/SupabaseClient";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();


  if (!email || !password) {
    return redirect(`/Module-start/signin?error=Faltan+credenciales`);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(`/Module-start/signin?error=${encodeURIComponent(error.message)}`);
  }

  const { access_token, refresh_token, user } = data.session;
  cookies.set("sb-access-token", access_token, {
    path: "/",
  });
  cookies.set("sb-refresh-token", refresh_token, {
    path: "/",
  });

  // Obtener el rol del usuario desde la tabla user_roles
  let userRole = null;
  let username = null;
  if (user?.id) {
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (!roleError && roleData) {
      userRole = roleData.role;
      cookies.set('sb-role', userRole, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      const { data: userData, error: userError } = await supabase
      .from('user_roles')
      .select('user_name')
      .eq('user_id', user.id)
      .single();

      if (userData && userData.user_name) {
        username = userData.user_name;
        cookies.set('sb-username', username, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }
  }
  return redirect("/Module-start/dashboard");
    
};

















