// import { User } from "@/types/types";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// // ------------------- UTIL -------------------
// const fetcher = async <T>(url: string, options?: RequestInit): Promise<T> => {
//   const res = await fetch(url, {
//     headers: { "Content-Type": "application/json" },
//     ...options,
//   });
//   if (!res.ok) throw new Error(await res.text());
//   return res.json();
// };

// // ------------------- QUERY KEYS -------------------
// export const EVENT_KEYS = {
//   all: ["users"] as const,
//   one: (id: number) => ["user", id] as const,
// };

// // ===================================================================
// // 🟦 USERS ROOT
// // ===================================================================

// // GET all
// export function useUsers() {
//   return useQuery({
//     queryKey: EVENT_KEYS.all,
//     queryFn: () => fetcher("/api/users"),
//   });
// }

// // POST create
// export function useCreateUser() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: (data: User) =>
//       fetcher("/api/users", {
//         method: "POST",
//         body: JSON.stringify(data),
//       }),
//     onSuccess: () => qc.invalidateQueries({ queryKey: EVENT_KEYS.all }),
//   });
// }

// // GET single User
// export function useUser(eventId: number) {
//   return useQuery({
//     queryKey: EVENT_KEYS.one(eventId),
//     queryFn: () => fetcher(`/api/users/${eventId}`),
//     enabled: !!eventId,
//   });
// }
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@/types/types";
import { useNotification } from "./use-notification";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface GetUsersResponse {
  totalItems: number;
  limitPerPage: number;
  totalPages: number;
  currentPage: number;
  data: User[];
}

// Récupérer tous les users
export function useUsersQuery(): {
  data: GetUsersResponse | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  pagination: { pageIndex: number; pageSize: number };
  setPage: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
} {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const query = useQuery<GetUsersResponse>({
    queryKey: ["users", pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      try {
        const res = await fetch(
          `/api/users?page=${pagination.pageIndex + 1}&limit=${
            pagination.pageSize
          }`,
          {
            credentials: "include",
          }
        );
        const data = await res.json();

        if (!res.ok) {
          console.log("daata: ", data);
          console.error(
            data.message || "Erreur lors du fetch des utilisateurs: ",
            data
          );
          throw new Error("Erreur lors du chargement des utilisateurs.");
        }
        return data;
      } catch (error) {
        console.error("Erreur lors du fetch des utilisateurs: ", error);
        throw error;
      }
    },
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });

  const setPage = (pageIndex: number) => {
    setPagination((prev) => ({
      ...prev,
      pageIndex,
    }));
  };

  const setPageSize = (pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize,
    }));
  };

  return {
    ...query,
    pagination,
    setPage,
    setPageSize,
  };
}

// Récupérer un user par son id
export function useUserQuery(userId: string): UseQueryResult<User, Error> {
  return useQuery<User>({
    queryKey: ["user", userId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Erreur lors du fetch de l'utilisateur");
        const data = await res.json();

        return data.user;
      } catch (error) {
        console.error("Erreur lors du fetch de l'utilisateur: ", error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

// Ajouter un user
export function useAddUserMutation(): UseMutationResult<
  { message: string },
  Error,
  Partial<User>,
  unknown
> {
  const { show } = useNotification();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Partial<User>) => {
      const res = await fetch(`/api/users`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de l'ajout");
      }
      return data;
    },
    onSuccess: (data) => {
      show("success", data.message || "Utilisateur ajouté avec succès");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      show("error", error.message || "Erreur lors de l'ajout de l'utilisateur");
    },
  });
}

// Désactiver un ou plusieurs utilisateurs
export function useDeactivateUserMutation() {
  const { show } = useNotification();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userIds: string[]) => {
      const res = await fetch(`/api/users/deactivate`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Échec de la désactivation");
      return data;
    },
    onSuccess: (data) => {
      show("note", data.message || "Utilisateurs désactivés avec succès");

      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      show("error", error.message || "Erreur lors de la désactivation");
    },
  });
}

// Supprimer définitivement un utilisateur (Et toutes les data lui rattaché)
export function useDeleteUserMutation() {
  const { show } = useNotification();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Échec de la suppression");
      }

      return data;
    },
    onSuccess: (data, userId) => {
      show("success", data.message || "Utilisateur supprimé définitivement");

      // Invalider les requêtes affectées
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
      router.push("/dashboard/users");

      // Si l'utilisateur supprimé est l'utilisateur courant
      if (
        (queryClient.getQueryData(["auth-user"]) as User | undefined)?.id ===
        userId
      ) {
        router.push("/login");
      }
    },
    onError: (error: Error) => {
      show("error", error.message || "Erreur lors de la suppression");
    },
  });
}

// Rechercher des users
export function useSearchUsersMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (query: string) => {
      const res = await fetch(`/api/users/search?query=${query}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          `Erreur recherche d'utilisateurs. Erreur: `,
          data.message
        );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["users"], data.data);
    },
  });
}

// Mettre à jour un user
export function useUpdateUserMutation() {
  const { show } = useNotification();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Partial<User>) => {
      const { id, ...payload } = user;
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      return res.json();
    },
    onSuccess: (data) => {
      show("success", data.message || "Utilisateur mis à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
    onError: (error) => {
      show(
        "error",
        error.message || "Erreur lors de la mise à jour de l'utilisateur"
      );
    },
  });
}

// Mettre à jour le profil de l'utilisateur connecté (nom, email, mot de passe)
export interface UpdateMyProfilePayload {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function useUpdateMyProfileMutation() {
  const { show } = useNotification();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateMyProfilePayload) => {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de la mise à jour du profil");
      }
      return data;
    },
    onSuccess: async (data) => {
      show("success", data.message || "Profil mis à jour avec succès !");
      // Forcer la mise à jour de la session dans Better Auth client
      await authClient.getSession();
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
    },
    onError: (error: Error) => {
      show("error", error.message || "Erreur lors de la mise à jour du profil");
    },
  });
}
