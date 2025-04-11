import { supabase } from './supabase';

export interface AuthError {
  message: string;
  status?: number;
}

export interface AuthResult<T = any> {
  data: T | null;
  error: AuthError | null;
}

export interface RegisterOptions {
  email: string;
  password: string;
  redirectTo?: string;
}

export interface LoginOptions {
  email: string;
  password: string;
  redirectTo?: string;
}

/**
 * Register a new user with email and password
 */
export async function register(options: RegisterOptions): Promise<AuthResult> {
  try {
    const { email, password, redirectTo } = options;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo || `${window.location.origin}/verify`,
      },
    });
    
    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status || 400,
        },
      };
    }
    
    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error during registration:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred',
        status: 500,
      },
    };
  }
}

/**
 * Log in a user with email and password
 */
export async function login(options: LoginOptions): Promise<AuthResult> {
  try {
    const { email, password } = options;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status || 400,
        },
      };
    }
    
    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error during login:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred',
        status: 500,
      },
    };
  }
}

/**
 * Log out the current user
 */
export async function logout(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status || 400,
        },
      };
    }
    
    return {
      data: true,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error during logout:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred',
        status: 500,
      },
    };
  }
}

/**
 * Get the current user session
 */
export async function getSession(): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status || 400,
        },
      };
    }
    
    return {
      data: data.session,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error getting session:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred',
        status: 500,
      },
    };
  }
}

/**
 * Get the current user
 */
export async function getUser(): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status || 400,
        },
      };
    }
    
    return {
      data: data.user,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error getting user:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred',
        status: 500,
      },
    };
  }
}

/**
 * Send a password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          status: error.status || 400,
        },
      };
    }
    
    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error during password reset:', error);
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred',
        status: 500,
      },
    };
  }
} 