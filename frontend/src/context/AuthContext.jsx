import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();
const API_BASE = "http://127.0.0.1:5000/api";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("reviewguard_token") || null;
    } catch (e) {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedToken = localStorage.getItem("reviewguard_token");
      const savedUser = localStorage.getItem("reviewguard_user");
      if (savedToken && savedUser) {
        return JSON.parse(savedUser);
      }
      return null;
    } catch (e) {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Validate session on mount or token change
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) throw new Error("Session invalid");
          return res.json();
        })
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem("reviewguard_user", JSON.stringify(data.user));
          } else {
            logout();
          }
        })
        .catch(() => {
          logout();
        });
    } else {
      setUser(null);
    }
  }, [token]);

  const login = async (identifier, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials. Please verify your email/username and password.");
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("reviewguard_token", data.token);
      localStorage.setItem("reviewguard_user", JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async ({ username, email, password, name }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, name })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registration failed.");
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("reviewguard_token", data.token);
      localStorage.setItem("reviewguard_user", JSON.stringify(data.user));
      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem("reviewguard_token");
    if (currentToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${currentToken}` }
        });
      } catch (e) {
        // Silent catch
      }
    }
    setToken(null);
    setUser(null);
    setAuthError(null);
    localStorage.removeItem("reviewguard_token");
    localStorage.removeItem("reviewguard_user");
  };

  const isAuthenticated = Boolean(token && user);
  const isAdmin = Boolean(token && user && user.role === "admin");
  const isAnalyst = Boolean(token && user && user.role === "analyst");

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isAnalyst,
        isLoading,
        authError,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
