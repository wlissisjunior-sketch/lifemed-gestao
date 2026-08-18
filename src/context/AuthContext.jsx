import { createContext, useContext, useState } from "react";
import { roles } from "../data/mockData";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  function login(email) {
    const name = email.includes("@")
      ? email.split("@")[0].replace(/[._]/g, " ")
      : email;
    setUser({
      name: name
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" ") || "Usuário LifeMed",
      role: roles[2],
      email: email || "usuario@lifemed.com",
      initials: (name || "U").slice(0, 2).toUpperCase(),
    });
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
