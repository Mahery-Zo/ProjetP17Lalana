import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/api";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [source, setSource] = useState(null); // "local" | "firebase" | null
  const [loading, setLoading] = useState(true);

  // --- Helpers ---
  const clearLocalSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("auth_source");
  };

  const setLocalSession = (data) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("auth_source", "local");
  };

  const setFirebaseSession = (fbUser) => {
    localStorage.setItem("auth_source", "firebase");
    setUser({ id: fbUser.uid, email: fbUser.email });
    setSource("firebase");
  };

  //  Restore session (LOCAL first) + single Firebase listener
  useEffect(() => {
    let unsub = null;

    try {
      const savedSource = localStorage.getItem("auth_source");

      // If last session was LOCAL → restore instantly (no need to wait firebase)
      if (savedSource === "local") {
        const token = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");
        if (token && savedUser && savedUser !== "undefined") {
          try {
            setUser(JSON.parse(savedUser));
            setSource("local");
            setLoading(false);
            return; // stop here, no firebase listener needed
          } catch (error) {
            console.error("Error parsing user data:", error);
            clearLocalSession();
          }
        }
      }

      // Otherwise listen to Firebase once (only if Firebase is configured)
      if (auth) {
        unsub = onAuthStateChanged(auth, (fbUser) => {
          if (fbUser) {
            setFirebaseSession(fbUser);
          } else {
            // no firebase user
            // do not erase local session here; only clear on logout
            if (localStorage.getItem("auth_source") === "firebase") {
              setUser(null);
              setSource(null);
            }
          }
          setLoading(false);
        });
      } else {
        // No Firebase configured, just finish loading
        setLoading(false);
      }
    } catch (e) {
      // fallback safety
      console.error("Auth initialization error:", e);
      setLoading(false);
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  //  Local login
  const loginLocal = async (email, password) => {
    const data = await authService.login(email, password);
    setLocalSession(data);
    setUser(data.user);
    setSource("local");
    return data;
  };
  // const getrole = async (user) => {
  //   if (source === "firebase") {
  //     // Fetch role from your database if needed
  //     return "user"; // default role
  //   }
  // };

  //  Firebase login
  const loginFirebase = async (email, password) => {
    if (!auth) {
      throw new Error("Firebase not configured");
    }
    const res = await signInWithEmailAndPassword(auth, email.trim(), password);
    // const token = await res.user.getIdToken();
    localStorage.setItem("auth_source", "firebase");
    const data = await authService.login(email, password);
    
    setUser({ id: res.user.uid, email: res.user.email, role: data.user.role });
    setLocalSession(data);
    
    // localStorage.setItem("token", data.token);
    // localStorage.setItem("user", JSON.stringify(data.user));
   
    setSource("firebase");
    return res.user;
  };

  //  Smart login: try Firebase first, if NETWORK error → fallback local
  const login = async (email, password) => {
    // If Firebase not configured, use local auth directly
    if (!auth) {
      return loginLocal(email, password);
    }

    try {
      return await loginFirebase(email, password);
    } catch (err) {
      const msg = (err?.message || "").toLowerCase();
      const code = err?.code || "";

      const isNetwork =
        code === "auth/network-request-failed" ||
        msg.includes("network") ||
        msg.includes("timeout") ||
        msg.includes("fetch") ||
        msg.includes("failed to fetch");

      if (isNetwork) {
        return loginLocal(email, password);
      }

      // Real auth error (wrong password, user not found...) → don't fallback
      throw err;
    }
  };

  //  Local register
  const registerLocal = async (name, email, password, passwordConfirmation) => {
    const data = await authService.register(
      name,
      email,
      password,
      passwordConfirmation
    );
    setLocalSession(data);
    setUser(data.user);
    setSource("local");
    return data;
  };

  //  Firebase register
  const registerFirebase = async (email, password) => {
    if (!auth) {
      throw new Error("Firebase not configured");
    }
    const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
    localStorage.setItem("auth_source", "firebase");
    setUser({ id: res.user.uid, email: res.user.email });
    setSource("firebase");
    return res.user;
  };

  //  Register behavior (tu peux changer si tu veux firebase quand online)
  const register = async (name, email, password, passwordConfirmation) => {
    return registerLocal(name, email, password, passwordConfirmation);
  };

  //  Logout (both)
  const logout = async () => {
    try {
      if (source === "local") {
        await authService.logout();
      } else if (source === "firebase" && auth) {
        await signOut(auth);
      }
    } finally {
      clearLocalSession();
      setUser(null);
      setSource(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      source,
      loading,

      login,
      register,
      logout,

      loginLocal,
      loginFirebase,
      registerLocal,
      registerFirebase,

      setUser,
    }),
    [user, source, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
